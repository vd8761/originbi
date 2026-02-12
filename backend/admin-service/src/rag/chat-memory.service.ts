/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                 MITHRA  CHAT  MEMORY  SERVICE                            ║
 * ║         DB-persisted conversations  ·  ChatGPT-style history            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  • Create / list / delete conversations                                   ║
 * ║  • Append messages (user + assistant)                                     ║
 * ║  • Build LLM-ready history window from a conversation                    ║
 * ║  • Auto-generate conversation titles from the first exchange             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/* ────────── Interfaces ────────── */
export interface Conversation {
  id: number;
  userId: number;
  userRole: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  /** Optional: last message preview (for sidebar) */
  lastMessage?: string;
  messageCount?: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class ChatMemoryService {
  private readonly logger = new Logger('ChatMemory');

  /** How many past messages to include in the LLM context window */
  private readonly LLM_HISTORY_WINDOW = 20;

  /** Max character length per message for the LLM context (to keep prompt lean) */
  private readonly MSG_TRUNCATE_LEN = 600;

  private tablesExist = false;

  constructor(private readonly dataSource: DataSource) {
    this.ensureTables();
  }

  /* ═══════════════════════════════════════════════════════════
     BOOTSTRAP – make sure the tables exist (idempotent)
     ═══════════════════════════════════════════════════════════ */
  private async ensureTables(): Promise<void> {
    try {
      await this.dataSource.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations'`,
      );
      const r = await this.dataSource.query(
        `SELECT 1 FROM chat_conversations LIMIT 1`,
      );
      this.tablesExist = true;
      this.logger.log('✅ Chat history tables ready');
    } catch {
      this.logger.warn(
        '⚠️ chat_conversations table not found – run migration 003_chat_history.sql',
      );
      this.tablesExist = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CONVERSATIONS  CRUD
     ═══════════════════════════════════════════════════════════ */

  /** Create a new conversation thread */
  async createConversation(
    userId: number,
    userRole: string,
    title = 'New Chat',
  ): Promise<Conversation> {
    if (!this.tablesExist) await this.ensureTables();
    const rows = await this.dataSource.query(
      `INSERT INTO chat_conversations (user_id, user_role, title)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, userRole, title],
    );
    const row = rows[0];
    return this.mapConversation(row);
  }

  /** List conversations for a user (most recent first) */
  async listConversations(
    userId: number,
    _userRole?: string,
    limit = 50,
    includeArchived = false,
  ): Promise<Conversation[]> {
    if (!this.tablesExist) await this.ensureTables();
    if (!this.tablesExist) return [];
    const rows = await this.dataSource.query(
      `SELECT c.*,
              (SELECT content FROM chat_messages
               WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
                AS last_message,
              (SELECT COUNT(*)::int FROM chat_messages WHERE conversation_id = c.id)
                AS message_count
       FROM chat_conversations c
       WHERE c.user_id = $1
         ${includeArchived ? '' : 'AND c.is_archived = FALSE'}
       ORDER BY c.updated_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return rows.map((r: any) => this.mapConversation(r));
  }

  /** Get a single conversation (with auth check) */
  async getConversation(
    conversationId: number,
    userId: number,
  ): Promise<Conversation | null> {
    if (!this.tablesExist) return null;
    const rows = await this.dataSource.query(
      `SELECT * FROM chat_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    return rows.length > 0 ? this.mapConversation(rows[0]) : null;
  }

  /** Rename a conversation */
  async renameConversation(
    conversationId: number,
    userId: number,
    title: string,
  ): Promise<boolean> {
    if (!this.tablesExist) return false;
    const r = await this.dataSource.query(
      `UPDATE chat_conversations SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [title, conversationId, userId],
    );
    return r[1] > 0;
  }

  /** Archive (soft-delete) a conversation */
  async archiveConversation(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    if (!this.tablesExist) return false;
    const r = await this.dataSource.query(
      `UPDATE chat_conversations SET is_archived = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    return r[1] > 0;
  }

  /** Hard-delete a conversation and all its messages */
  async deleteConversation(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    if (!this.tablesExist) return false;
    const r = await this.dataSource.query(
      `DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, userId],
    );
    return r[1] > 0;
  }

  /* ═══════════════════════════════════════════════════════════
     MESSAGES
     ═══════════════════════════════════════════════════════════ */

  /** Append a message to a conversation */
  async addMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<ChatMessage> {
    if (!this.tablesExist) await this.ensureTables();
    const rows = await this.dataSource.query(
      `INSERT INTO chat_messages (conversation_id, role, content, metadata)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [conversationId, role, content, JSON.stringify(metadata)],
    );
    return this.mapMessage(rows[0]);
  }

  /** Get all messages in a conversation (oldest first) */
  async getMessages(
    conversationId: number,
    userId: number,
    limit = 200,
  ): Promise<ChatMessage[]> {
    if (!this.tablesExist) return [];
    // Verify ownership
    const conv = await this.getConversation(conversationId, userId);
    if (!conv) return [];

    const rows = await this.dataSource.query(
      `SELECT * FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, limit],
    );
    return rows.map((r: any) => this.mapMessage(r));
  }

  /* ═══════════════════════════════════════════════════════════
     LLM CONTEXT BUILDER
     ═══════════════════════════════════════════════════════════ */

  /**
   * Build a prompt-ready conversation history string.
   * Returns the last N messages formatted for injection into the LLM prompt.
   */
  async buildLlmHistory(conversationId: number): Promise<string> {
    if (!this.tablesExist) return '';
    const rows = await this.dataSource.query(
      `SELECT role, content FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, this.LLM_HISTORY_WINDOW],
    );

    if (!rows || rows.length === 0) return '';

    // Reverse to chronological order
    rows.reverse();

    let history = '--- CONVERSATION HISTORY ---\n';
    for (const row of rows) {
      const label = row.role === 'user' ? 'User' : 'MITHRA';
      let content: string = row.content || '';
      if (content.length > this.MSG_TRUNCATE_LEN) {
        content = content.slice(0, this.MSG_TRUNCATE_LEN) + '… [truncated]';
      }
      history += `${label}: ${content}\n`;
    }
    history += '--- CURRENT INTERACTION ---\n';
    return history;
  }

  /* ═══════════════════════════════════════════════════════════
     AUTO  TITLE  GENERATION
     ═══════════════════════════════════════════════════════════ */

  /**
   * Generate a short conversation title from the first user message.
   * Called automatically after the first exchange.
   */
  async autoGenerateTitle(conversationId: number, userId: number): Promise<void> {
    if (!this.tablesExist) return;
    try {
      const rows = await this.dataSource.query(
        `SELECT content FROM chat_messages
         WHERE conversation_id = $1 AND role = 'user'
         ORDER BY created_at ASC LIMIT 1`,
        [conversationId],
      );
      if (!rows || rows.length === 0) return;

      const firstMsg: string = rows[0].content || '';
      // Create a short title from the first message
      let title = firstMsg.replace(/\n/g, ' ').trim();
      if (title.length > 60) {
        title = title.slice(0, 57) + '...';
      }
      if (!title) title = 'New Chat';

      await this.dataSource.query(
        `UPDATE chat_conversations SET title = $1 WHERE id = $2 AND user_id = $3 AND title = 'New Chat'`,
        [title, conversationId, userId],
      );
    } catch (err) {
      this.logger.warn(`Auto-title failed for conv ${conversationId}: ${err}`);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */

  private mapConversation(row: any): Conversation {
    return {
      id: row.id,
      userId: row.user_id,
      userRole: row.user_role,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isArchived: row.is_archived,
      lastMessage: row.last_message || undefined,
      messageCount: row.message_count ? Number(row.message_count) : undefined,
    };
  }

  private mapMessage(row: any): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
      createdAt: new Date(row.created_at),
    };
  }
}
