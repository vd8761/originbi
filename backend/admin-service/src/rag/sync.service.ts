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
  ) {}

  async onModuleInit() {
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

    // Define all tables to index with contextual formatting
    const tableSources = [
      // Career & Skills
      {
        name: 'career_roles',
        query: `SELECT id, career_role_name, short_description, is_active FROM career_roles WHERE is_deleted = false`,
        format: (r: any) => `CAREER ROLE: ${r.career_role_name}
Description: ${r.short_description || 'Professional role'}
Status: ${r.is_active ? 'Active' : 'Inactive'}
Type: Career opportunity in this field`,
        category: 'career',
      },
      {
        name: 'career_role_tools',
        query: `SELECT DISTINCT tool_name FROM career_role_tools WHERE is_deleted = false LIMIT 500`,
        format: (r: any) => `PROFESSIONAL TOOL: ${r.tool_name}
Type: Technology/Software tool used in IT and software development careers
Category: Technical skill`,
        category: 'tool',
      },
      // Courses & Education
      {
        name: 'courses',
        query: `SELECT id, course_name, notes, compatibility_percentage FROM trait_based_course_details WHERE is_deleted = false`,
        format: (r: any) => `COURSE: ${r.course_name}
Notes: ${r.notes || 'Educational course'}
Compatibility Score: ${r.compatibility_percentage}%
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
      // Users
      {
        name: 'users',
        query: `SELECT id, email, role, is_active, is_blocked, login_count FROM users`,
        format: (r: any) => `USER: ${r.email}
Role: ${r.role || 'User'}
Status: ${r.is_active ? 'Active' : 'Inactive'}${r.is_blocked ? ' (Blocked)' : ''}
Logins: ${r.login_count || 0}`,
        category: 'user',
      },
      // Registrations (Candidates)
      {
        name: 'registrations',
        query: `SELECT id, full_name, gender, status, mobile_number FROM registrations WHERE is_deleted = false LIMIT 1000`,
        format: (r: any) => `CANDIDATE: ${r.full_name}
Gender: ${r.gender || 'Not specified'}
Status: ${r.status || 'Registered'}
Contact: ${r.mobile_number || 'N/A'}`,
        category: 'candidate',
      },
      // Corporate Accounts
      {
        name: 'corporate_accounts',
        query: `SELECT id, company_name, sector_code, total_credits, available_credits FROM corporate_accounts WHERE is_deleted = false`,
        format: (r: any) => `CORPORATE ACCOUNT: ${r.company_name}
Sector: ${r.sector_code || 'General'}
Credits: ${r.available_credits}/${r.total_credits}`,
        category: 'corporate',
      },
      // Groups
      {
        name: 'groups',
        query: `SELECT id, code, name FROM groups WHERE is_deleted = false`,
        format: (r: any) => `GROUP: ${r.name}
Code: ${r.code}
Type: Candidate assessment group`,
        category: 'group',
      },
      // Departments
      {
        name: 'departments',
        query: `SELECT id, name, short_name, category FROM departments WHERE is_deleted = false`,
        format: (r: any) => `DEPARTMENT: ${r.name} (${r.short_name})
Category: ${r.category || 'Academic'}`,
        category: 'department',
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
                    AVG(CASE WHEN aa.score IS NOT NULL THEN aa.score ELSE 0 END) as avg_score
                FROM assessment_attempts aa
                JOIN programs p ON aa.program_id = p.id
                GROUP BY p.id, p.name`,
        format: (r: any) => `ASSESSMENT STATISTICS: ${r.program_name}
Total Attempts: ${r.attempt_count}
Average Score: ${parseFloat(r.avg_score || 0).toFixed(1)}%`,
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
