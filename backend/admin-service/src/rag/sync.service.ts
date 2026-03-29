/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmbeddingsService } from './embeddings.service';

/**
 * Auto-Sync Service for RAG Knowledge Base
 * - Runs every 30 minutes
 * - Indexes ALL database tables
 * - Incremental updates (only new/changed records)
 * - Contextual chunking for better embeddings
 */
@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name);
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;
  private isSyncing = false;

  // Sync every 30 minutes
  private readonly SYNC_INTERVAL_MS = 30 * 60 * 1000;

  constructor(
    private dataSource: DataSource,
    private embeddingsService: EmbeddingsService,
  ) { }

  async onModuleInit() {
    if (process.env.DISABLE_RAG_AUTO_SYNC === 'true') {
      this.logger.log('⏸️ Auto-sync disabled by DISABLE_RAG_AUTO_SYNC=true');
      return;
    }

    // Initial sync after 1 minute (let app fully start)
    setTimeout(() => this.runSync(), 60000);

    // Schedule regular sync
    this.syncInterval = setInterval(() => {
      this.runSync();
    }, this.SYNC_INTERVAL_MS);

    this.logger.log('✅ Auto-sync service initialized (30 min interval)');
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(): Promise<any> {
    return this.runSync();
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      lastSync: this.lastSyncTime,
      isSyncing: this.isSyncing,
      intervalMinutes: this.SYNC_INTERVAL_MS / 60000,
    };
  }

  /**
   * Main sync process
   */
  private async runSync(): Promise<any> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping...');
      return { status: 'skipped', reason: 'already_syncing' };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    this.logger.log('🔄 Starting knowledge base sync...');

    try {
      const results = await this.syncAllTables();
      this.lastSyncTime = new Date();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `✅ Sync complete in ${duration}s. Indexed ${results.total} documents.`,
      );

      return {
        status: 'success',
        duration: `${duration}s`,
        ...results,
      };
    } catch (error) {
      this.logger.error('❌ Sync failed:', error.message);
      return { status: 'error', error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync all database tables with contextual chunking
   */
  private async syncAllTables(): Promise<{
    total: number;
    details: Record<string, number>;
  }> {
    let total = 0;
    const details: Record<string, number> = {};

    // Define DB sources with contextual formatting for knowledge-oriented retrieval.
    // Keep sourceId stable so bulkUpsert can update instead of duplicating.
    const tableSources = [
      // Career & Skills
      {
        name: 'career_roles',
        query: `
          SELECT
            cr.id,
            cr.career_role_name,
            cr.short_description,
            cr.is_active,
            COALESCE(string_agg(DISTINCT crt.tool_name, ', '), '') AS tools
          FROM career_roles cr
          LEFT JOIN career_role_tools crt
            ON crt.career_role_id = cr.id AND crt.is_deleted = false
          WHERE cr.is_deleted = false
          GROUP BY cr.id, cr.career_role_name, cr.short_description, cr.is_active
        `,
        format: (r: any) => `CAREER ROLE: ${r.career_role_name}
Description: ${r.short_description || 'Professional role'}
Status: ${r.is_active ? 'Active' : 'Inactive'}
Key tools/skills: ${r.tools || 'Not specified'}
Type: Career opportunity and competency profile`,
        category: 'career',
      },
      {
        name: 'career_role_tools',
        query: `
          SELECT
            MIN(id) AS id,
            tool_name,
            COUNT(DISTINCT career_role_id) AS usage_count
          FROM career_role_tools
          WHERE is_deleted = false
          GROUP BY tool_name
          LIMIT 2000
        `,
        format: (r: any) => `PROFESSIONAL TOOL: ${r.tool_name}
Type: Technology/Software tool used in career pathways
Used in ${r.usage_count || 1} role(s)
Category: Technical skill`,
        category: 'tool',
      },
      // Courses & Education
      {
        name: 'courses',
        query: `
          SELECT
            tcd.id,
            tcd.course_name,
            tcd.notes,
            tcd.compatibility_percentage,
            COALESCE(pt.blended_style_name, 'General') AS trait_name,
            COALESCE(pt.blended_style_desc, '') AS trait_desc
          FROM trait_based_course_details tcd
          LEFT JOIN personality_traits pt ON pt.id = tcd.trait_id
          WHERE tcd.is_deleted = false
        `,
        format: (r: any) => `COURSE: ${r.course_name}
Recommended for trait: ${r.trait_name}
Trait insight: ${r.trait_desc || 'Not specified'}
Notes: ${r.notes || 'Educational course'}
Compatibility Score: ${r.compatibility_percentage ?? 'N/A'}
Type: Educational program for career development`,
        category: 'course',
      },
      // Programs
      {
        name: 'programs',
        query: `SELECT id, code, name, description, is_demo FROM programs WHERE is_active = true`,
        format: (r: any) => `ASSESSMENT PROGRAM: ${r.name} (${r.code})
Description: ${r.description || 'Career assessment program'}
Type: ${r.is_demo ? 'Demo program' : 'Full assessment'}`,
        category: 'program',
      },
      // Personality
      {
        name: 'personality_traits',
        query: `SELECT id, code, blended_style_name, blended_style_desc FROM personality_traits WHERE is_active = true`,
        format: (r: any) => `PERSONALITY TYPE: ${r.blended_style_name}
Code: ${r.code}
Description: ${r.blended_style_desc || 'Personality assessment category'}`,
        category: 'personality',
      },
      // Departments
      {
        name: 'departments',
        query: `SELECT id, name, short_name, category FROM departments WHERE is_deleted = false`,
        format: (r: any) => `DEPARTMENT: ${r.name} (${r.short_name})
Category: ${r.category || 'Academic'}`,
        category: 'department',
      },
      // Degree mappings for academic context
      {
        name: 'department_degrees',
        query: `
          SELECT
            dd.id,
            d.name AS department_name,
            d.short_name,
            dt.name AS degree_name,
            dt.level AS degree_level
          FROM department_degrees dd
          JOIN departments d ON d.id = dd.department_id AND d.is_deleted = false
          JOIN degree_types dt ON dt.id = dd.degree_type_id AND dt.is_deleted = false
        `,
        format: (r: any) => `ACADEMIC PATHWAY: ${r.department_name} (${r.short_name || '-'})
Degree: ${r.degree_name}
Level: ${r.degree_level || 'General'}
Type: Department to degree mapping`,
        category: 'education',
      },
      // Open Questions
      {
        name: 'open_questions',
        query: `SELECT id, question_type, question_text_en FROM open_questions WHERE is_deleted = false`,
        format: (r: any) => `ASSESSMENT QUESTION: ${r.question_text_en}
Type: ${r.question_type || 'General'}`,
        category: 'question',
      },
      // Assessment Attempts (Summary)
      {
        name: 'assessment_summary',
        query: `SELECT 
                    p.name as program_name, 
                    COUNT(*) as attempt_count,
                    COUNT(CASE WHEN aa.status = 'COMPLETED' THEN 1 END) as completed_count
                FROM assessment_attempts aa
                JOIN programs p ON aa.program_id = p.id
                GROUP BY p.id, p.name`,
        format: (r: any) => `ASSESSMENT STATISTICS: ${r.program_name}
Total Attempts: ${r.attempt_count}
Completed: ${r.completed_count}`,
        category: 'stats',
      },
    ];

    // Note: We used to clear everything, but now we use smart UPSERT.
    // This keeps the knowledge base available 24/7 and only updates changes.
    // try {
    //     await this.dataSource.query('DELETE FROM rag_embeddings');
    //     await this.dataSource.query('DELETE FROM rag_documents');
    // } catch (e) {}

    // Process each table
    for (const source of tableSources) {
      const quota = this.embeddingsService.getQuotaStatus();
      if (quota.coolingDown) {
        const sec = Math.ceil(quota.remainingMs / 1000);
        this.logger.warn(`⏸️ Pausing sync early: embeddings API cooling down (${sec}s remaining)`);
        break;
      }

      try {
        const rows = await this.dataSource.query(source.query);

        if (rows.length === 0) {
          details[source.name] = 0;
          continue;
        }

        const documents = rows.map((row: any) => ({
          content: source.format(row),
          category: source.category,
          metadata: { source: source.name, syncTime: new Date().toISOString() },
          sourceTable: source.name,
          sourceId: row.id,
        }));

        const result =
          await this.embeddingsService.bulkUpsertDocuments(documents);
        total += result.success;
        details[source.name] = result.success;

        this.logger.log(`  ✓ ${source.name}: ${result.success}/${rows.length}`);
      } catch (error) {
        this.logger.warn(`  ✗ ${source.name}: ${error.message}`);
        details[source.name] = 0;
      }
    }

    return { total, details };
  }
}
