/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmbeddingsService } from './embeddings.service';

/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║           SEMANTIC RESPONSE CACHE  (pgvector-backed)                  ║
 * ╠════════════════════════════════════════════════════════════════════════╣
 * ║  Uses cosine similarity on question embeddings to instantly serve     ║
 * ║  answers for semantically identical (or near-identical) questions.    ║
 * ║                                                                       ║
 * ║  Flow:                                                                ║
 * ║  1. User asks a question                                              ║
 * ║  2. Generate embedding for the question                               ║
 * ║  3. Search pgvector for cached answers with similarity > threshold    ║
 * ║  4. HIT  → return cached answer (<50ms)                              ║
 * ║  5. MISS → run full pipeline, cache the result for future queries     ║
 * ║                                                                       ║
 * ║  Benefits: ~10x faster repeat queries, lower LLM API costs,          ║
 * ║  consistent answers for semantically equivalent questions.            ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 */

export interface CachedAnswer {
  answer: string;
  searchType: string;
  confidence: number;
  cachedAt: Date;
  hitCount: number;
}

@Injectable()
export class RagCacheService implements OnModuleInit {
  private readonly logger = new Logger('RagCache');
  private tableReady = false;

  // Similarity threshold: 0.92 = very similar questions
  // Lower = more aggressive caching, higher = more precise matching
  private readonly SIMILARITY_THRESHOLD = 0.92;

  // Cache TTL: answers older than this are stale
  private readonly CACHE_TTL_HOURS = 24;

  // Max cached entries (auto-prune oldest)
  private readonly MAX_CACHE_SIZE = 5000;

  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async onModuleInit() {
    await this.ensureTable();
  }

  /**
   * Create the cache table if it doesn't exist
   */
  private async ensureTable(): Promise<void> {
    try {
      // Check if pgvector is available
      await this.dataSource.query(`SELECT '[1,2,3]'::vector(3)`);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS rag_response_cache (
          id SERIAL PRIMARY KEY,
          question_hash TEXT NOT NULL,
          question_text TEXT NOT NULL,
          question_embedding vector(1536),
          answer TEXT NOT NULL,
          search_type TEXT NOT NULL DEFAULT 'cached',
          confidence REAL NOT NULL DEFAULT 0.95,
          user_role TEXT NOT NULL DEFAULT 'ADMIN',
          hit_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_hit_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
        )
      `);

      // Create index for fast similarity search
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_rag_cache_embedding
        ON rag_response_cache USING ivfflat (question_embedding vector_cosine_ops)
        WITH (lists = 20)
      `).catch(() => {
        // IVFFlat index may fail with too few rows — that's fine, sequential scan works
        this.logger.debug('IVFFlat index skipped (may need more rows)');
      });

      // Index for hash-based exact lookups
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_rag_cache_hash
        ON rag_response_cache (question_hash)
      `).catch(() => {});

      this.tableReady = true;
      this.logger.log('✅ Semantic response cache table ready');
    } catch (err) {
      this.logger.warn(`⚠️ Semantic cache unavailable: ${err.message}`);
      this.tableReady = false;
    }
  }

  /**
   * Look up a cached answer for a semantically similar question.
   * Returns null on cache miss.
   */
  async lookup(question: string, userRole: string = 'ADMIN'): Promise<CachedAnswer | null> {
    if (!this.tableReady) return null;

    try {
      // Step 1: Fast exact-match check (hash-based, <1ms)
      const hash = this.hashQuestion(question, userRole);
      const exactRows = await this.dataSource.query(
        `SELECT answer, search_type, confidence, created_at, hit_count
         FROM rag_response_cache
         WHERE question_hash = $1 AND expires_at > NOW()
         LIMIT 1`,
        [hash],
      );
      if (exactRows.length > 0) {
        const row = exactRows[0];
        // Update hit count (fire-and-forget)
        this.dataSource.query(
          `UPDATE rag_response_cache SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE question_hash = $1`,
          [hash],
        ).catch(() => {});
        this.logger.log(`⚡ Cache HIT (exact hash) for: "${question.slice(0, 60)}..."`);
        return {
          answer: row.answer,
          searchType: 'cached_exact',
          confidence: parseFloat(row.confidence) || 0.95,
          cachedAt: row.created_at,
          hitCount: parseInt(row.hit_count) + 1,
        };
      }

      // Step 2: Semantic similarity search (pgvector cosine distance)
      const embedding = await this.embeddingsService.generateEmbedding(question, 'query');
      if (!embedding) return null;

      const embStr = `[${embedding.join(',')}]`;
      const semanticRows = await this.dataSource.query(
        `SELECT answer, search_type, confidence, created_at, hit_count,
                1 - (question_embedding <=> $1::vector) AS similarity
         FROM rag_response_cache
         WHERE expires_at > NOW()
           AND user_role = $2
           AND question_embedding IS NOT NULL
         ORDER BY question_embedding <=> $1::vector
         LIMIT 1`,
        [embStr, userRole],
      );

      if (semanticRows.length > 0) {
        const row = semanticRows[0];
        const similarity = parseFloat(row.similarity);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          // Update hit count
          this.dataSource.query(
            `UPDATE rag_response_cache SET hit_count = hit_count + 1, last_hit_at = NOW()
             WHERE id = (SELECT id FROM rag_response_cache WHERE expires_at > NOW() AND user_role = $1
                         ORDER BY question_embedding <=> $2::vector LIMIT 1)`,
            [userRole, embStr],
          ).catch(() => {});
          this.logger.log(`⚡ Cache HIT (semantic, sim=${similarity.toFixed(3)}) for: "${question.slice(0, 60)}..."`);
          return {
            answer: row.answer,
            searchType: 'cached_semantic',
            confidence: Math.min(parseFloat(row.confidence), similarity),
            cachedAt: row.created_at,
            hitCount: parseInt(row.hit_count) + 1,
          };
        }
        this.logger.debug(`Cache MISS (best similarity=${similarity.toFixed(3)} < ${this.SIMILARITY_THRESHOLD})`);
      }

      return null;
    } catch (err) {
      this.logger.debug(`Cache lookup error: ${err.message}`);
      return null;
    }
  }

  /**
   * Store a question + answer in the cache for future lookups.
   * Fire-and-forget — never blocks the response.
   */
  async store(
    question: string,
    answer: string,
    searchType: string,
    confidence: number,
    userRole: string = 'ADMIN',
  ): Promise<void> {
    if (!this.tableReady) return;
    // Don't cache low-confidence or error responses
    if (confidence < 0.5) return;
    // Don't cache very short or error answers
    if (answer.length < 20 || /error|couldn't|unable|sorry/i.test(answer.slice(0, 50))) return;
    // ── CRITICAL: Never cache "no results" answers ──
    // These are DB-state-dependent: a "no data" answer today could be
    // wrong tomorrow when the same question has real data. Caching them
    // would return stale empty answers as hits for semantically similar
    // future questions (e.g. test Q2-Q10 returning wrong cached "no data").
    const NO_RESULTS_PATTERN = /no (data|results?|candidates?|users?|records?|matches?|assessments?|information) (found|available|at this time)|not available|no matching|no completed|couldn't find|no (one|user|candidate|employee|affiliate|company|corporate|group|batch|role|assessment) (found|available|registered|completed)/i;
    if (NO_RESULTS_PATTERN.test(answer.slice(0, 200))) {
      this.logger.debug(`⏭️ Skipping cache store — answer is a no-results response`);
      return;
    }

    try {
      const hash = this.hashQuestion(question, userRole);

      // Don't re-cache if exact hash already exists
      const existing = await this.dataSource.query(
        `SELECT id FROM rag_response_cache WHERE question_hash = $1 LIMIT 1`,
        [hash],
      );
      if (existing.length > 0) return;

      // Generate embedding for semantic matching
      const embedding = await this.embeddingsService.generateEmbedding(question, 'query');
      const embStr = embedding ? `[${embedding.join(',')}]` : null;

      await this.dataSource.query(
        `INSERT INTO rag_response_cache (question_hash, question_text, question_embedding, answer, search_type, confidence, user_role, expires_at)
         VALUES ($1, $2, $3::vector, $4, $5, $6, $7, NOW() + INTERVAL '${this.CACHE_TTL_HOURS} hours')`,
        [hash, question.slice(0, 500), embStr, answer, searchType, confidence, userRole],
      );

      // Auto-prune if cache is too large
      this.pruneIfNeeded().catch(() => {});

      this.logger.debug(`📦 Cached answer for: "${question.slice(0, 60)}..."`);
    } catch (err) {
      this.logger.debug(`Cache store error: ${err.message}`);
    }
  }

  /**
   * Invalidate all cache entries (e.g. after data changes)
   */
  async invalidateAll(): Promise<void> {
    if (!this.tableReady) return;
    await this.dataSource.query(`DELETE FROM rag_response_cache`);
    this.logger.log('🗑️ Cache invalidated');
  }

  /**
   * Invalidate cache entries for a specific role
   */
  async invalidateByRole(userRole: string): Promise<void> {
    if (!this.tableReady) return;
    await this.dataSource.query(
      `DELETE FROM rag_response_cache WHERE user_role = $1`,
      [userRole],
    );
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{ totalEntries: number; totalHits: number; avgConfidence: number }> {
    if (!this.tableReady) return { totalEntries: 0, totalHits: 0, avgConfidence: 0 };
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(hit_count), 0) AS hits, ROUND(AVG(confidence)::numeric, 2) AS avg_conf
       FROM rag_response_cache WHERE expires_at > NOW()`,
    );
    const r = rows[0];
    return {
      totalEntries: parseInt(r.total) || 0,
      totalHits: parseInt(r.hits) || 0,
      avgConfidence: parseFloat(r.avg_conf) || 0,
    };
  }

  // ── Helpers ──

  private hashQuestion(question: string, role: string): string {
    // Simple hash: normalize and combine role + question
    const normalized = question.toLowerCase().trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
    return `${role}:${normalized}`;
  }

  private async pruneIfNeeded(): Promise<void> {
    const countRows = await this.dataSource.query(
      `SELECT COUNT(*) AS cnt FROM rag_response_cache`,
    );
    const count = parseInt(countRows[0]?.cnt) || 0;
    if (count > this.MAX_CACHE_SIZE) {
      // Delete oldest 20% entries
      const deleteCount = Math.floor(count * 0.2);
      await this.dataSource.query(
        `DELETE FROM rag_response_cache WHERE id IN (
           SELECT id FROM rag_response_cache ORDER BY last_hit_at ASC NULLS FIRST, created_at ASC LIMIT $1
         )`,
        [deleteCount],
      );
      this.logger.log(`🗑️ Pruned ${deleteCount} old cache entries`);
    }
  }
}
