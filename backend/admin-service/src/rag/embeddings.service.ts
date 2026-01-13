import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private jinaApiKey: string | null = null;
    private pgvectorAvailable = false;

    constructor(private dataSource: DataSource) { }

    async onModuleInit() {
        this.jinaApiKey = process.env.JINA_API_KEY || null;
        if (this.jinaApiKey) {
            this.logger.log('Jina API key found');
        } else {
            this.logger.warn('JINA_API_KEY not set - embeddings will be disabled');
        }

        // Check if pgvector is available
        await this.checkPgvector();
    }

    /**
     * Check if pgvector extension is installed
     */
    private async checkPgvector(): Promise<void> {
        try {
            await this.dataSource.query(`SELECT '[1,2,3]'::vector(3)`);
            this.pgvectorAvailable = true;
            this.logger.log('pgvector extension is available');
        } catch (error) {
            this.pgvectorAvailable = false;
            this.logger.warn('pgvector extension not available - run the SQL migration first');
        }
    }

    /**
     * Generate embedding for text using Jina AI
     */
    async generateEmbedding(text: string): Promise<number[] | null> {
        if (!this.jinaApiKey) {
            this.logger.warn('Cannot generate embedding - JINA_API_KEY not set');
            return null;
        }

        try {
            const response = await fetch('https://api.jina.ai/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.jinaApiKey}`,
                },
                body: JSON.stringify({
                    model: 'jina-embeddings-v3',
                    task: 'retrieval.passage',
                    dimensions: 1024,
                    input: [text],
                }),
            });

            if (!response.ok) {
                throw new Error(`Jina API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            this.logger.error('Failed to generate embedding:', error);
            return null;
        }
    }

    /**
     * Generate query embedding (optimized for search)
     */
    async generateQueryEmbedding(query: string): Promise<number[] | null> {
        if (!this.jinaApiKey) return null;

        try {
            const response = await fetch('https://api.jina.ai/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.jinaApiKey}`,
                },
                body: JSON.stringify({
                    model: 'jina-embeddings-v3',
                    task: 'retrieval.query',
                    dimensions: 1024,
                    input: [query],
                }),
            });

            if (!response.ok) throw new Error(`Jina API error: ${response.status}`);

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            this.logger.error('Failed to generate query embedding:', error);
            return null;
        }
    }

    /**
     * Store document with embedding
     */
    async storeDocument(
        content: string,
        category: string,
        metadata: Record<string, any> = {},
        sourceTable?: string,
        sourceId?: number
    ): Promise<number | null> {
        if (!this.pgvectorAvailable) {
            this.logger.warn('pgvector not available - skipping storage');
            return null;
        }

        try {
            // Generate embedding
            const embedding = await this.generateEmbedding(content);

            // Insert document
            const docResult = await this.dataSource.query(
                `INSERT INTO rag_documents (content, category, metadata, source_table, source_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [content, category, JSON.stringify(metadata), sourceTable, sourceId]
            );
            const documentId = docResult[0].id;

            // Insert embedding if generated
            if (embedding) {
                const embeddingStr = `[${embedding.join(',')}]`;
                await this.dataSource.query(
                    `INSERT INTO rag_embeddings (document_id, embedding)
                     VALUES ($1, $2::vector)`,
                    [documentId, embeddingStr]
                );
            }

            this.logger.log(`Stored document ${documentId} with category: ${category}`);
            return documentId;
        } catch (error) {
            this.logger.error('Failed to store document:', error);
            return null;
        }
    }

    /**
     * Semantic search using pgvector
     */
    async semanticSearch(
        query: string,
        limit: number = 5,
        category?: string
    ): Promise<any[]> {
        if (!this.pgvectorAvailable) {
            this.logger.warn('pgvector not available - returning empty results');
            return [];
        }

        try {
            const queryEmbedding = await this.generateQueryEmbedding(query);
            if (!queryEmbedding) {
                this.logger.warn('Could not generate query embedding');
                return [];
            }

            const embeddingStr = `[${queryEmbedding.join(',')}]`;

            // Use the helper function or direct query
            let sql = `
                SELECT 
                    d.id,
                    d.content,
                    d.metadata,
                    d.category,
                    1 - (e.embedding <=> $1::vector) AS similarity
                FROM rag_embeddings e
                JOIN rag_documents d ON d.id = e.document_id
            `;

            const params: any[] = [embeddingStr];
            if (category) {
                sql += ` WHERE d.category = $2`;
                params.push(category);
            }

            sql += ` ORDER BY e.embedding <=> $1::vector LIMIT $${params.length + 1}`;
            params.push(limit);

            const results = await this.dataSource.query(sql, params);
            return results;
        } catch (error) {
            this.logger.error('Semantic search failed:', error);
            return [];
        }
    }

    /**
     * Get service status
     */
    getStatus(): { jinaAvailable: boolean; pgvectorAvailable: boolean } {
        return {
            jinaAvailable: !!this.jinaApiKey,
            pgvectorAvailable: this.pgvectorAvailable,
        };
    }
}
