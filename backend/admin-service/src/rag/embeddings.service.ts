/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Production-Grade Embeddings Service
 * Features: Batch processing, caching, retry logic, optimized semantic search
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private hfApiToken: string | null = null;
  private pgvectorAvailable = false;

  // Fallback list of free HuggingFace models (all 384 dimensions)
  private readonly HF_MODELS = [
    'sentence-transformers/all-MiniLM-L6-v2',
    'sentence-transformers/all-MiniLM-L12-v2',
    'sentence-transformers/paraphrase-MiniLM-L6-v2',
    'BAAI/bge-small-en-v1.5',
  ];
  private activeModelIdx = 0;
  private readonly EMBEDDING_DIM = 384;

  /** Track when all models were exhausted for auto-recovery */
  private modelsExhaustedAt: number | null = null;
  private readonly MODEL_RETRY_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  /** Current model URL – updates automatically on 410 fallback */
  private get HF_API_URL(): string {
    return `https://router.huggingface.co/hf-inference/models/${this.HF_MODELS[this.activeModelIdx]}/pipeline/feature-extraction`;
  }
  private get HF_MODEL(): string {
    return this.HF_MODELS[this.activeModelIdx];
  }

  /** Switch to next model when current one returns 410 Gone */
  private switchToNextModel(): boolean {
    if (this.activeModelIdx < this.HF_MODELS.length - 1) {
      this.activeModelIdx++;
      this.logger.warn(`⚡ Switching to fallback model: ${this.HF_MODEL}`);
      return true;
    }
    this.modelsExhaustedAt = Date.now();
    this.logger.error('❌ All HF embedding models exhausted (410 Gone). Will retry in 5 minutes.');
    return false;
  }

  /**
   * Reset model index after cooldown so the service can recover
   * from transient 410 errors without requiring a server restart.
   */
  private resetIfCooledDown(): void {
    if (
      this.modelsExhaustedAt &&
      Date.now() - this.modelsExhaustedAt >= this.MODEL_RETRY_COOLDOWN
    ) {
      this.logger.log('🔄 Cooldown elapsed – resetting HF model list for retry');
      this.activeModelIdx = 0;
      this.modelsExhaustedAt = null;
    }
  }

  // Cache for embeddings to reduce API calls
  private embeddingCache = new Map<
    string,
    { embedding: number[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
  private readonly BATCH_SIZE = 10; // Process 10 at a time
  private readonly MAX_RETRIES = 3;

  constructor(private dataSource: DataSource) { }

  async onModuleInit() {
    this.hfApiToken = process.env.HF_API_TOKEN || null;
    if (this.hfApiToken) {
      this.logger.log('✅ HuggingFace API token configured (higher rate limits)');
    } else {
      this.logger.log('ℹ️  No HF_API_TOKEN – using HuggingFace free tier (works without key, lower rate limits)');
    }
    await this.checkPgvector();
  }

  private async checkPgvector(): Promise<void> {
    try {
      await this.dataSource.query(`SELECT '[1,2,3]'::vector(3)`);
      this.pgvectorAvailable = true;
      this.logger.log('✅ pgvector extension available');
    } catch (_error) {
      this.pgvectorAvailable = false;
      this.logger.warn('⚠️ pgvector not available - run SQL migration');
    }
  }

  /**
   * Generate single embedding with caching and retry
   */
  /**
   * Normalize HuggingFace API response to a flat number[] embedding.
   * HF returns different shapes depending on model / pipeline:
   *   number[]  – direct embedding
   *   number[][] – batch with 1 item
   *   number[][][] – token-level (shouldn't happen for sentence-transformers)
   */
  private normalizeEmbedding(data: any): number[] | null {
    if (!data) return null;
    if (Array.isArray(data)) {
      if (typeof data[0] === 'number') return data;          // flat
      if (Array.isArray(data[0])) {
        if (typeof data[0][0] === 'number') return data[0];  // nested once
      }
    }
    return null;
  }

  async generateEmbedding(
    text: string,
    task: 'passage' | 'query' = 'passage',
  ): Promise<number[] | null> {
    // Auto-recover from exhausted state after cooldown
    this.resetIfCooledDown();
    if (this.activeModelIdx >= this.HF_MODELS.length) return null;
    // Check cache
    const cacheKey = `${task}:${text.slice(0, 100)}`;
    const cached = this.embeddingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.embedding;
    }

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          this.logger.warn(`HF embedding request timeout after 20s (attempt ${attempt})`);
        }, 20000);

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.hfApiToken) {
          headers['Authorization'] = `Bearer ${this.hfApiToken}`;
        }

        const response = await fetch(this.HF_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: text.slice(0, 8000),
            options: { wait_for_model: true },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          await this.sleep(1000 * attempt);
          continue;
        }

        if (response.status === 410) {
          // Model removed from HF serverless – try next model
          if (this.switchToNextModel()) {
            continue; // retry with next model
          }
          return null;
        }

        if (response.status === 503) {
          // Model still loading on HuggingFace serverless – back off and retry
          this.logger.warn('HF model loading, retrying…');
          await this.sleep(2000 * attempt);
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          if (this.hfApiToken) {
            this.logger.warn('⚠️ HF token invalid – falling back to unauthenticated requests');
            this.hfApiToken = null;
            continue; // retry without token
          }
          // Already unauthenticated and still failing – give up
          this.logger.error('❌ HF API returned 401/403 even without token');
          return null;
        }

        if (!response.ok) {
          throw new Error(`HF API error: ${response.status}`);
        }

        const data = await response.json();
        const embedding = this.normalizeEmbedding(data);

        if (embedding) {
          this.embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });
        }
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
    if (texts.length === 0) return [];

    // Auto-recover from exhausted state after cooldown
    this.resetIfCooledDown();
    if (this.activeModelIdx >= this.HF_MODELS.length) {
      return new Array(texts.length).fill(null);
    }

    const results: (number[] | null)[] = new Array(texts.length).fill(null);

    for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
      const batch = texts
        .slice(i, i + this.BATCH_SIZE)
        .map((t) => t.slice(0, 8000));

      // Add retry logic for batch requests
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          // Create AbortController for timeout handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            this.logger.warn(`Batch request timeout after 30 seconds (attempt ${attempt})`);
          }, 30000); // 30 second timeout

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (this.hfApiToken) {
            headers['Authorization'] = `Bearer ${this.hfApiToken}`;
          }

          const response = await fetch(this.HF_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              inputs: batch,
              options: { wait_for_model: true },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.status === 410) {
            // Model removed – try fallback
            if (this.switchToNextModel()) {
              continue;
            }
            break; // all models exhausted
          }

          if (response.status === 503) {
            this.logger.warn('HF model loading (batch), retrying…');
            await this.sleep(2000 * attempt);
            continue;
          }

          if (response.status === 401 || response.status === 403) {
            if (this.hfApiToken) {
              this.logger.warn('⚠️ HF token invalid – retrying without auth');
              this.hfApiToken = null;
              continue;
            }
            // Already unauthenticated – stop retrying
            this.logger.error('❌ HF API returned 401/403 even without token');
            break;
          }

          if (!response.ok) {
            if (attempt === this.MAX_RETRIES) {
              this.logger.warn(`Batch failed with status ${response.status} after ${attempt} attempts`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          // HF batch response: number[][] (one embedding per input)
          if (Array.isArray(data)) {
            data.forEach((item: any, idx: number) => {
              results[i + idx] = this.normalizeEmbedding([item]) ?? (Array.isArray(item) && typeof item[0] === 'number' ? item : null);
            });
          }

          // Successfully processed batch, break retry loop
          break;
        } catch (error) {
          if (attempt === this.MAX_RETRIES) {
            this.logger.error('Batch embedding error:');
            this.logger.error(error);
            // Continue to next batch instead of failing completely
            break;
          } else {
            this.logger.warn(`Batch attempt ${attempt} failed, retrying in ${attempt * 1000}ms...`);
            await this.sleep(attempt * 1000); // Progressive backoff
          }
        }
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
    sourceId?: number,
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
        [content, category, JSON.stringify(metadata), sourceTable, sourceId],
      );
      const documentId = docResult[0].id;

      if (embedding) {
        const embeddingStr = `[${embedding.join(',')}]`;
        await this.dataSource.query(
          `INSERT INTO rag_embeddings (document_id, embedding)
                     VALUES ($1, $2::vector)`,
          [documentId, embeddingStr],
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
  async bulkStoreDocuments(
    documents: Array<{
      content: string;
      category: string;
      metadata?: Record<string, any>;
      sourceTable?: string;
      sourceId?: number;
    }>,
  ): Promise<{ success: number; failed: number }> {
    if (!this.pgvectorAvailable)
      return { success: 0, failed: documents.length };

    // Generate all embeddings in batches
    const contents = documents.map((d) => d.content);
    const embeddings = await this.generateBatchEmbeddings(contents);

    let success = 0,
      failed = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const embedding = embeddings[i];

      try {
        const docResult = await this.dataSource.query(
          `INSERT INTO rag_documents (content, category, metadata, source_table, source_id)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
          [
            doc.content,
            doc.category,
            JSON.stringify(doc.metadata || {}),
            doc.sourceTable,
            doc.sourceId,
          ],
        );
        const documentId = docResult[0].id;

        if (embedding) {
          const embeddingStr = `[${embedding.join(',')}]`;
          await this.dataSource.query(
            `INSERT INTO rag_embeddings (document_id, embedding)
                         VALUES ($1, $2::vector)`,
            [documentId, embeddingStr],
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
    minSimilarity: number = 0.3,
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
      return Object.fromEntries(
        result.map((r: any) => [r.category, parseInt(r.count)]),
      );
    } catch {
      return {};
    }
  }

  getStatus(): { embeddingsAvailable: boolean; pgvectorAvailable: boolean; model: string; dimensions: number; fallbackModels: string[] } {
    return {
      embeddingsAvailable: this.activeModelIdx < this.HF_MODELS.length,
      pgvectorAvailable: this.pgvectorAvailable,
      model: this.HF_MODEL,
      dimensions: this.EMBEDDING_DIM,
      fallbackModels: this.HF_MODELS,
    };
  }

  /**
   * Store or Update documents efficiently
   */
  async bulkUpsertDocuments(
    documents: Array<{
      content: string;
      category: string;
      metadata?: Record<string, any>;
      sourceTable?: string;
      sourceId?: number;
    }>,
  ): Promise<{ success: number; failed: number }> {
    if (!this.pgvectorAvailable)
      return { success: 0, failed: documents.length };

    // 1. Generate embeddings for all new contents
    const contents = documents.map((d) => d.content);
    const embeddings = await this.generateBatchEmbeddings(contents);

    let success = 0,
      failed = 0;

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
          [doc.sourceTable, doc.sourceId],
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
              [doc.content, JSON.stringify(doc.metadata), id],
            );

            if (embedding) {
              const vectorStr = `[${embedding.join(',')}]`;
              await this.dataSource.query(
                `UPDATE rag_embeddings 
                                 SET embedding = $1::vector
                                 WHERE document_id = $2`,
                [vectorStr, id],
              );
            }
            this.logger.debug(`Updated doc ${id}`);
          }
        } else {
          // INSERT
          await this.storeDocument(
            doc.content,
            doc.category,
            doc.metadata,
            doc.sourceTable,
            doc.sourceId,
          );
        }
        success++;
      } catch (error) {
        this.logger.error(
          `Upsert failed for ${doc.sourceTable}:${doc.sourceId}`,
          error,
        );
        failed++;
      }
    }

    return { success, failed };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
