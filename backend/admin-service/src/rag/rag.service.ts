import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { DATABASE_SCHEMA } from './schema-context';

interface UserContext {
    id: number;
    role: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    corporateId?: number | null;
}

interface IngestRequest {
    content: string;
    category: 'candidate' | 'role' | 'course' | 'question' | 'tool';
    metadata?: Record<string, any>;
    sourceTable?: string;
    sourceId?: number;
}

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private llm: ChatGroq | null = null;

    constructor(
        private dataSource: DataSource,
        private embeddingsService: EmbeddingsService,
    ) { }

    private getLlm(): ChatGroq {
        if (!this.llm) {
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) {
                throw new Error('GROQ_API_KEY not set');
            }
            this.llm = new ChatGroq({
                apiKey,
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2,
            });
        }
        return this.llm;
    }

    /**
     * Main query method - Hybrid Search (Semantic + SQL)
     */
    async query(question: string, user: UserContext): Promise<any> {
        if (!question || typeof question !== 'string') {
            throw new Error('Question is required');
        }

        this.logger.log(`Processing query: "${question}"`);

        try {
            // 1. Try Semantic Search first
            const semanticResults = await this.embeddingsService.semanticSearch(question, 5);

            // 2. If semantic search has results, use them
            if (semanticResults.length > 0) {
                this.logger.log(`Found ${semanticResults.length} semantic results`);
                return await this.answerFromSemanticResults(question, semanticResults, user);
            }

            // 3. Fallback to Text-to-SQL
            this.logger.log('No semantic results, falling back to SQL');
            return await this.answerFromSql(question, user);

        } catch (error) {
            this.logger.error('Query error:', error);
            return {
                answer: 'I encountered an error processing your request.',
                error: error.message,
            };
        }
    }

    /**
     * Answer using semantic search results
     */
    private async answerFromSemanticResults(
        question: string,
        results: any[],
        user: UserContext
    ): Promise<any> {
        const context = results.map((r, i) =>
            `[${i + 1}] ${r.content} (similarity: ${(r.similarity * 100).toFixed(1)}%)`
        ).join('\n\n');

        const systemPrompt = `You are an AI assistant for OriginBI.
Use ONLY the following retrieved documents to answer the question.
If the documents don't contain relevant information, say so.

RETRIEVED DOCUMENTS:
${context}

User Role: ${user.role}`;

        const response = await this.getLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(question),
        ]);

        return {
            answer: response.content,
            sources: results.map(r => ({
                content: r.content.substring(0, 100) + '...',
                category: r.category,
                similarity: r.similarity,
            })),
            searchType: 'semantic',
        };
    }

    /**
     * Answer using SQL generation
     */
    private async answerFromSql(question: string, user: UserContext): Promise<any> {
        const systemPrompt = `You are a PostgreSQL expert. Generate a SELECT query.

Database Schema:
${DATABASE_SCHEMA}

Rules:
1. Return ONLY the SQL query, no markdown
2. Only SELECT queries allowed
3. Limit results to 20
4. Filter is_deleted = false where applicable

Question: ${question}`;

        const sqlResponse = await this.getLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(question),
        ]);

        let sql = sqlResponse.content.toString().trim();
        sql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();

        // Safety check
        const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE'];
        if (forbidden.some(word => sql.toUpperCase().includes(word))) {
            throw new Error('Unsafe query detected');
        }

        const results = await this.dataSource.query(sql);

        // Generate natural language answer
        const answerPrompt = `Question: "${question}"
SQL: ${sql}
Results: ${JSON.stringify(results.slice(0, 10), null, 2)}

Provide a helpful natural language answer based on these results.`;

        const answerResponse = await this.getLlm().invoke([
            new SystemMessage(answerPrompt),
        ]);

        return {
            answer: answerResponse.content,
            sql,
            rowCount: results.length,
            searchType: 'sql',
        };
    }

    /**
     * Ingest a document into the RAG system
     */
    async ingest(request: IngestRequest): Promise<{ success: boolean; documentId?: number; error?: string }> {
        try {
            const documentId = await this.embeddingsService.storeDocument(
                request.content,
                request.category,
                request.metadata || {},
                request.sourceTable,
                request.sourceId,
            );

            if (documentId) {
                return { success: true, documentId };
            } else {
                return { success: false, error: 'Failed to store document' };
            }
        } catch (error) {
            this.logger.error('Ingest error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bulk ingest multiple documents
     */
    async bulkIngest(documents: IngestRequest[]): Promise<{ total: number; success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const doc of documents) {
            const result = await this.ingest(doc);
            if (result.success) {
                success++;
            } else {
                failed++;
            }
        }

        return { total: documents.length, success, failed };
    }

    /**
     * Index existing database content
     */
    async indexExistingData(): Promise<{ indexed: number }> {
        let indexed = 0;

        // Index career_roles
        try {
            const roles = await this.dataSource.query(`
                SELECT id, name, description FROM career_roles LIMIT 100
            `);
            for (const role of roles) {
                await this.ingest({
                    content: `Career Role: ${role.name}. ${role.description || ''}`,
                    category: 'role',
                    metadata: { name: role.name },
                    sourceTable: 'career_roles',
                    sourceId: role.id,
                });
                indexed++;
            }
        } catch (e) {
            this.logger.warn('Could not index career_roles');
        }

        // Index assessment_questions
        try {
            const questions = await this.dataSource.query(`
                SELECT id, question_text_en, category FROM assessment_questions LIMIT 100
            `);
            for (const q of questions) {
                await this.ingest({
                    content: `Assessment Question: ${q.question_text_en}. Category: ${q.category}`,
                    category: 'question',
                    metadata: { category: q.category },
                    sourceTable: 'assessment_questions',
                    sourceId: q.id,
                });
                indexed++;
            }
        } catch (e) {
            this.logger.warn('Could not index assessment_questions');
        }

        return { indexed };
    }

    /**
     * Get RAG status
     */
    async getStatus(): Promise<any> {
        const embeddingStatus = this.embeddingsService.getStatus();

        let documentCount = 0;
        try {
            const result = await this.dataSource.query('SELECT COUNT(*) as count FROM rag_documents');
            documentCount = parseInt(result[0].count);
        } catch (e) {
            // Table might not exist
        }

        return {
            status: 'ok',
            service: 'rag',
            embeddings: embeddingStatus,
            documentCount,
        };
    }

    async seedKnowledgeBase() {
        return this.indexExistingData();
    }

    async generatePdf(data: any, question: string) {
        return Buffer.from(`RAG Report\n\nQuery: ${question}\n\n${data.answer}`);
    }
}
