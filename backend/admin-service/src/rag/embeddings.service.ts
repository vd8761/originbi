import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Production-Grade Embeddings Service
 * Features: Batch processing, caching, retry logic, optimized semantic search
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private jinaApiKey: string | null = null;
    private pgvectorAvailable = false;

    // Cache for embeddings to reduce API calls
    private embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
    private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
    private readonly BATCH_SIZE = 10; // Process 10 at a time
    private readonly MAX_RETRIES = 3;

    constructor(private dataSource: DataSource) { }

    async onModuleInit() {
        this.jinaApiKey = process.env.JINA_API_KEY || null;
        if (this.jinaApiKey) {
            this.logger.log('✅ Jina API key configured');
        } else {
            this.logger.warn('⚠️ JINA_API_KEY not set - embeddings disabled');
        }
        await this.checkPgvector();
    }

    private async checkPgvector(): Promise<void> {
        try {
            await this.dataSource.query(`SELECT '[1,2,3]'::vector(3)`);
            this.pgvectorAvailable = true;
            this.logger.log('✅ pgvector extension available');
        } catch (error) {
            this.pgvectorAvailable = false;
            this.logger.warn('⚠️ pgvector not available - run SQL migration');
        }
    }

    /**
     * Generate single embedding with caching and retry
     */
    async generateEmbedding(text: string, task: 'passage' | 'query' = 'passage'): Promise<number[] | null> {
        if (!this.jinaApiKey) return null;

        // Check cache
        const cacheKey = `${task}:${text.slice(0, 100)}`;
        const cached = this.embeddingCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.embedding;
        }

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const response = await fetch('https://api.jina.ai/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.jinaApiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'jina-embeddings-v3',
                        task: `retrieval.${task}`,
                        dimensions: 1024,
                        input: [text.slice(0, 8000)], // Limit text length
                    }),
                });

                if (response.status === 429) {
                    // Rate limited - wait and retry
                    await this.sleep(1000 * attempt);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`Jina API error: ${response.status}`);
                }

                const data = await response.json();
                const embedding = data.data[0].embedding;

                // Cache the result
                this.embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });
                return embedding;
            } catch (error) {
                if (attempt === this.MAX_RETRIES) {
                    this.logger.error(`Failed after ${this.MAX_RETRIES} attempts:`, error);
                    return null;
                }
                await this.sleep(500 * attempt);
            }
        }
        return null;
    }

    /**
     * Generate embeddings in batch for efficiency
     */
    async generateBatchEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
        if (!this.jinaApiKey || texts.length === 0) return texts.map(() => null);

        const results: (number[] | null)[] = new Array(texts.length).fill(null);

        for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
            const batch = texts.slice(i, i + this.BATCH_SIZE).map(t => t.slice(0, 8000));

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
                        input: batch,
                    }),
                });

                if (!response.ok) {
                    this.logger.warn(`Batch failed with status ${response.status}`);
                    continue;
                }

                const data = await response.json();
                data.data.forEach((item: any, idx: number) => {
                    results[i + idx] = item.embedding;
                });

                // Rate limit protection
                if (i + this.BATCH_SIZE < texts.length) {
                    await this.sleep(200);
                }
            } catch (error) {
                this.logger.error('Batch embedding error:', error);
            }
        }

        return results;
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
            this.logger.warn('pgvector not available');
            return null;
        }

        try {
            const embedding = await this.generateEmbedding(content, 'passage');

            const docResult = await this.dataSource.query(
                `INSERT INTO rag_documents (content, category, metadata, source_table, source_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [content, category, JSON.stringify(metadata), sourceTable, sourceId]
            );
            const documentId = docResult[0].id;

            if (embedding) {
                const embeddingStr = `[${embedding.join(',')}]`;
                await this.dataSource.query(
                    `INSERT INTO rag_embeddings (document_id, embedding)
                     VALUES ($1, $2::vector)`,
                    [documentId, embeddingStr]
                );
            }

            return documentId;
        } catch (error) {
            this.logger.error('Failed to store document:', error);
            return null;
        }
    }

    /**
     * Bulk store documents efficiently
     */
    async bulkStoreDocuments(documents: Array<{
        content: string;
        category: string;
        metadata?: Record<string, any>;
        sourceTable?: string;
        sourceId?: number;
    }>): Promise<{ success: number; failed: number }> {
        if (!this.pgvectorAvailable) return { success: 0, failed: documents.length };

        // Generate all embeddings in batches
        const contents = documents.map(d => d.content);
        const embeddings = await this.generateBatchEmbeddings(contents);

        let success = 0, failed = 0;

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            const embedding = embeddings[i];

            try {
                const docResult = await this.dataSource.query(
                    `INSERT INTO rag_documents (content, category, metadata, source_table, source_id)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [doc.content, doc.category, JSON.stringify(doc.metadata || {}), doc.sourceTable, doc.sourceId]
                );
                const documentId = docResult[0].id;

                if (embedding) {
                    const embeddingStr = `[${embedding.join(',')}]`;
                    await this.dataSource.query(
                        `INSERT INTO rag_embeddings (document_id, embedding)
                         VALUES ($1, $2::vector)`,
                        [documentId, embeddingStr]
                    );
                }
                success++;
            } catch (error) {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Semantic search with minimum similarity threshold
     */
    async semanticSearch(
        query: string,
        limit: number = 5,
        category?: string,
        minSimilarity: number = 0.3
    ): Promise<any[]> {
        if (!this.pgvectorAvailable) return [];

        try {
            const queryEmbedding = await this.generateEmbedding(query, 'query');
            if (!queryEmbedding) return [];

            const embeddingStr = `[${queryEmbedding.join(',')}]`;

            let sql = `
                SELECT 
                    d.id,
                    d.content,
                    d.metadata,
                    d.category,
                    d.source_table,
                    d.source_id,
                    1 - (e.embedding <=> $1::vector) AS similarity
                FROM rag_embeddings e
                JOIN rag_documents d ON d.id = e.document_id
                WHERE 1 - (e.embedding <=> $1::vector) >= $2
            `;

            const params: any[] = [embeddingStr, minSimilarity];

            if (category) {
                sql += ` AND d.category = $3`;
                params.push(category);
            }

            sql += ` ORDER BY e.embedding <=> $1::vector LIMIT $${params.length + 1}`;
            params.push(limit);

            return await this.dataSource.query(sql, params);
        } catch (error) {
            this.logger.error('Semantic search failed:', error);
            return [];
        }
    }

    /**
     * Get document count by category
     */
    async getDocumentStats(): Promise<Record<string, number>> {
        try {
            const result = await this.dataSource.query(`
                SELECT category, COUNT(*) as count 
                FROM rag_documents 
                GROUP BY category
            `);
            return Object.fromEntries(result.map((r: any) => [r.category, parseInt(r.count)]));
        } catch {
            return {};
        }
    }

    getStatus(): { jinaAvailable: boolean; pgvectorAvailable: boolean } {
        return {
            jinaAvailable: !!this.jinaApiKey,
            pgvectorAvailable: this.pgvectorAvailable,
        };
    }

    /**
     * Store or Update documents efficiently
     */
    async bulkUpsertDocuments(documents: Array<{
        content: string;
        category: string;
        metadata?: Record<string, any>;
        sourceTable?: string;
        sourceId?: number;
    }>): Promise<{ success: number; failed: number }> {
        if (!this.pgvectorAvailable) return { success: 0, failed: documents.length };

        // 1. Generate embeddings for all new contents
        const contents = documents.map(d => d.content);
        const embeddings = await this.generateBatchEmbeddings(contents);

        let success = 0, failed = 0;

        // 2. Process each document
        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            const embedding = embeddings[i];

            if (!doc.sourceTable || !doc.sourceId) {
                // If no source ID, fallback to regular insert
                await this.storeDocument(doc.content, doc.category, doc.metadata);
                success++;
                continue;
            }

            try {
                // Check if exists
                const existing = await this.dataSource.query(
                    `SELECT id, content FROM rag_documents WHERE source_table = $1 AND source_id = $2`,
                    [doc.sourceTable, doc.sourceId]
                );

                if (existing.length > 0) {
                    // UPDATE
                    const id = existing[0].id;

                    // Only update if content changed
                    if (existing[0].content !== doc.content) {
                        await this.dataSource.query(
                            `UPDATE rag_documents 
                             SET content = $1, metadata = $2, updated_at = NOW()
                             WHERE id = $3`,
                            [doc.content, JSON.stringify(doc.metadata), id]
                        );

                        if (embedding) {
                             const vectorStr = `[${embedding.join(',')}]`;
                             await this.dataSource.query(
                                `UPDATE rag_embeddings 
                                 SET embedding = $1::vector
                                 WHERE document_id = $2`,
                                [vectorStr, id]
                            );
                        }
                        this.logger.debug(`Updated doc ${id}`);
                    }
                } else {
                    // INSERT
                    await this.storeDocument(doc.content, doc.category, doc.metadata, doc.sourceTable, doc.sourceId);
                }
                success++;
            } catch (error) {
                this.logger.error(`Upsert failed for ${doc.sourceTable}:${doc.sourceId}`, error);
                failed++;
            }
        }

        return { success, failed };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
