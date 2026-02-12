/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Production-Grade Embeddings Service — Google Gemini
 * Model: gemini-embedding-001 (1536 dimensions)
 * Features:
 *   - Task-aware embeddings (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY)
 *   - Batch processing via batchEmbedContents API
 *   - Caching, retry logic, rate limiting
 *   - Auto-schema migration with HNSW indexing
 *   - 1536d: optimal balance of quality + IVFFlat compatibility
 */
@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private googleApiKey: string | null = null;
  private pgvectorAvailable = false;
  private embeddingsAvailable = false;

  private readonly MODEL = 'models/gemini-embedding-001';
  private readonly EMBEDDING_DIM = 1536;  // Safe dimension that works with both IVFFlat and HNSW
  private readonly GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

  // Cache for embeddings to reduce API calls
  private embeddingCache = new Map<
    string,
    { embedding: number[]; timestamp: number }
  >();
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
  private readonly BATCH_SIZE = 50; // Google supports up to 100 per batch
  private readonly MAX_RETRIES = 3;

  // Rate limiting for free tier (15 RPM)
  private requestTimestamps: number[] = [];
  private readonly RATE_LIMIT_RPM = 14; // stay just under limit

  constructor(private dataSource: DataSource) { }

  async onModuleInit() {
    this.googleApiKey = process.env.GOOGLE_API_KEY || null;
    if (this.googleApiKey) {
      this.logger.log('✅ Google Gemini API key configured');
      this.embeddingsAvailable = true;
    } else {
      this.logger.error(
        '❌ No GOOGLE_API_KEY set — embeddings disabled. Add it to .env',
      );
      this.embeddingsAvailable = false;
    }
    await this.checkPgvector();
    if (this.pgvectorAvailable) {
      await this.checkAndMigrateSchema();
    }
  }

  // ─────────────── Infrastructure ───────────────

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
   * Auto-detect and migrate vector column from old dimension
   * to the new 1536-dim Google Gemini format.
   */
  private async checkAndMigrateSchema(): Promise<void> {
    try {
      // Check current vector dimension by inspecting column type
      const colInfo = await this.dataSource.query(`
        SELECT atttypmod FROM pg_attribute
        WHERE attrelid = 'rag_embeddings'::regclass
          AND attname = 'embedding'
      `);

      if (colInfo.length === 0) {
        this.logger.warn('⚠️ rag_embeddings table or embedding column not found');
        return;
      }

      const currentDim = colInfo[0].atttypmod;

      if (currentDim !== this.EMBEDDING_DIM) {
        this.logger.warn(
          `⚠️ Schema mismatch detected (current: ${currentDim} dims, required: ${this.EMBEDDING_DIM} dims). Migrating...`,
        );

        // 1. Clear incompatible embeddings
        await this.dataSource.query('DELETE FROM rag_embeddings');
        await this.dataSource.query('DELETE FROM rag_documents');

        // 2. Drop old indexes first
        await this.dataSource.query('DROP INDEX IF EXISTS idx_rag_embeddings_vector');
        await this.dataSource.query('DROP INDEX IF EXISTS rag_embeddings_embedding_idx');
        
        // 3. Alter column to new dimension
        await this.dataSource.query(
          `ALTER TABLE rag_embeddings ALTER COLUMN embedding TYPE vector(${this.EMBEDDING_DIM})`,
        );

        // 4. Create HNSW index (better for 1536+ dimensions)
        try {
          await this.dataSource.query(`
            CREATE INDEX idx_rag_embeddings_vector 
            ON rag_embeddings USING hnsw (embedding vector_cosine_ops)
          `);
          this.logger.log('✅ Created HNSW index for optimal performance');
        } catch (hnswError) {
          // Fallback to IVFFlat if HNSW not available (older pgvector)
          this.logger.warn('HNSW not available, falling back to IVFFlat');
          await this.dataSource.query(`
            CREATE INDEX idx_rag_embeddings_vector 
            ON rag_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
          `);
        }

        // 5. Update semantic_search function to match new dimension
        await this.dataSource.query(`
          CREATE OR REPLACE FUNCTION semantic_search(
              query_embedding vector(${this.EMBEDDING_DIM}),
              match_count INT DEFAULT 5,
              filter_category VARCHAR DEFAULT NULL
          )
          RETURNS TABLE (
              document_id INT,
              content TEXT,
              metadata JSONB,
              category VARCHAR(50),
              similarity FLOAT
          ) AS $$
          BEGIN
              RETURN QUERY
              SELECT 
                  d.id,
                  d.content,
                  d.metadata,
                  d.category,
                  1 - (e.embedding <=> query_embedding) AS similarity
              FROM rag_embeddings e
              JOIN rag_documents d ON d.id = e.document_id
              WHERE (filter_category IS NULL OR d.category = filter_category)
              ORDER BY e.embedding <=> query_embedding
              LIMIT match_count;
          END;
          $$ LANGUAGE plpgsql;
        `);

        // 6. Update other tables if they exist
        const tables = ['rag_employee_profiles', 'rag_role_requirements'];
        for (const table of tables) {
          const tableExists = await this.dataSource.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = '${table}'
            )
          `);
          if (tableExists[0].exists) {
            await this.dataSource.query(`DELETE FROM ${table}`);
            await this.dataSource.query(
              `ALTER TABLE ${table} ALTER COLUMN embedding TYPE vector(${this.EMBEDDING_DIM})`,
            );
          }
        }

        this.logger.log(
          `✅ Schema migrated to ${this.EMBEDDING_DIM} dimensions. Old data cleared.`,
        );
      } else {
        this.logger.log(`✅ Vector schema OK (${this.EMBEDDING_DIM} dimensions)`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Schema check skipped (table may not exist yet):', error.message);
    }
  }

  // ─────────────── Rate Limiting ───────────────

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < 60000,
    );

    if (this.requestTimestamps.length >= this.RATE_LIMIT_RPM) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitMs = 60000 - (now - oldestInWindow) + 500; // +500ms buffer
      this.logger.debug(`⏳ Rate limit: waiting ${(waitMs / 1000).toFixed(1)}s`);
      await this.sleep(waitMs);
    }

    this.requestTimestamps.push(Date.now());
  }

  // ─────────────── Core: Single Embedding ───────────────

  /**
   * Generate a single embedding using Google Gemini.
   * @param text - The text to embed (max ~2048 tokens)
   * @param task - 'passage' uses RETRIEVAL_DOCUMENT, 'query' uses RETRIEVAL_QUERY
   */
  async generateEmbedding(
    text: string,
    task: 'passage' | 'query' = 'passage',
  ): Promise<number[] | null> {
    if (!this.embeddingsAvailable || !this.googleApiKey) return null;

    // Check cache
    const cacheKey = `${task}:${text.slice(0, 200)}`;
    const cached = this.embeddingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.embedding;
    }

    const taskType =
      task === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.waitForRateLimit();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const url = `${this.GEMINI_BASE_URL}/${this.MODEL}:embedContent?key=${this.googleApiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.MODEL,
            content: { parts: [{ text: text.slice(0, 10000) }] },
            taskType,
            outputDimensionality: this.EMBEDDING_DIM,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          this.logger.warn(`⏳ Rate limited (attempt ${attempt}), backing off...`);
          await this.sleep(2000 * attempt);
          continue;
        }

        if (response.status === 400) {
          const errBody = await response.json().catch(() => ({}));
          this.logger.warn(`⚠️ Bad request: ${JSON.stringify(errBody).slice(0, 200)}`);
          return null;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          throw new Error(`Google API ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const embedding: number[] | undefined = data?.embedding?.values;

        if (embedding && embedding.length === this.EMBEDDING_DIM) {
          this.embeddingCache.set(cacheKey, {
            embedding,
            timestamp: Date.now(),
          });
          return embedding;
        }

        this.logger.warn('⚠️ Unexpected embedding response shape');
        return null;
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          this.logger.error(
            `❌ Embedding failed after ${this.MAX_RETRIES} attempts:`,
            error,
          );
          return null;
        }
        await this.sleep(1000 * attempt);
      }
    }
    return null;
  }

  // ─────────────── Core: Batch Embeddings ───────────────

  /**
   * Generate embeddings in batch using Google's batchEmbedContents API.
   * This is significantly more efficient than calling embedContent N times.
   */
  async generateBatchEmbeddings(
    texts: string[],
    task: 'passage' | 'query' = 'passage',
  ): Promise<(number[] | null)[]> {
    if (texts.length === 0) return [];
    if (!this.embeddingsAvailable || !this.googleApiKey) {
      return new Array(texts.length).fill(null);
    }

    const taskType =
      task === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';
    const results: (number[] | null)[] = new Array(texts.length).fill(null);

    for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + this.BATCH_SIZE);

      // Check cache first; only request uncached items
      const uncachedIndices: number[] = [];
      for (let j = 0; j < batchTexts.length; j++) {
        const cacheKey = `${task}:${batchTexts[j].slice(0, 200)}`;
        const cached = this.embeddingCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          results[i + j] = cached.embedding;
        } else {
          uncachedIndices.push(j);
        }
      }

      if (uncachedIndices.length === 0) continue; // all from cache

      // Build batch request body
      const requests = uncachedIndices.map((j) => ({
        model: this.MODEL,
        content: { parts: [{ text: batchTexts[j].slice(0, 10000) }] },
        taskType,
        outputDimensionality: this.EMBEDDING_DIM,
      }));

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          await this.waitForRateLimit();

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const url = `${this.GEMINI_BASE_URL}/${this.MODEL}:batchEmbedContents?key=${this.googleApiKey}`;

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.status === 429) {
            this.logger.warn(`⏳ Batch rate limited (attempt ${attempt}), backing off...`);
            await this.sleep(3000 * attempt);
            continue;
          }

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Google Batch API ${response.status}: ${errText.slice(0, 200)}`);
          }

          const data = await response.json();
          const embeddings: any[] = data?.embeddings || [];

          embeddings.forEach((emb: any, idx: number) => {
            const values: number[] | undefined = emb?.values;
            if (values && values.length === this.EMBEDDING_DIM) {
              const originalIdx = uncachedIndices[idx];
              results[i + originalIdx] = values;
              // Cache the result
              const cacheKey = `${task}:${batchTexts[originalIdx].slice(0, 200)}`;
              this.embeddingCache.set(cacheKey, {
                embedding: values,
                timestamp: Date.now(),
              });
            }
          });

          break; // success
        } catch (error) {
          if (attempt === this.MAX_RETRIES) {
            this.logger.error('❌ Batch embedding failed:', error);
            break;
          }
          this.logger.warn(`Batch attempt ${attempt} failed, retrying...`);
          await this.sleep(1500 * attempt);
        }
      }
    }

    return results;
  }

  // ─────────────── Storage: Single Document ───────────────

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

  // ─────────────── Storage: Bulk Store ───────────────

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

  // ─────────────── Semantic Search ───────────────

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

  // ─────────────── Stats & Status ───────────────

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

  getStatus(): {
    embeddingsAvailable: boolean;
    pgvectorAvailable: boolean;
    model: string;
    dimensions: number;
  } {
    return {
      embeddingsAvailable: this.embeddingsAvailable,
      pgvectorAvailable: this.pgvectorAvailable,
      model: 'Google Gemini gemini-embedding-001',
      dimensions: this.EMBEDDING_DIM,
    };
  }

  // ─────────────── Storage: Bulk Upsert ───────────────

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

  // ─────────────── Utilities ───────────────

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
