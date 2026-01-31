/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    MITHRA CONVERSATION SERVICE                            ║
 * ║           Intelligent Memory & Context Management for MITHRA             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  FEATURES:                                                                ║
 * ║  • Session-based conversation memory                                      ║
 * ║  • Context-aware follow-up detection                                      ║
 * ║  • Smart entity tracking (who/what was discussed)                        ║
 * ║  • Proactive suggestion engine                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

interface ConversationMessage {
    role: 'user' | 'mithra';
    content: string;
    timestamp: Date;
    intent?: string;
    entities?: string[];
}

interface ConversationSession {
    sessionId: string;
    messages: ConversationMessage[];
    currentContext: ConversationContext;
    createdAt: Date;
    lastActivity: Date;
}

interface ConversationContext {
    lastPersonMentioned?: string;
    lastReportType?: string;
    lastIntent?: string;
    entitiesDiscussed: string[];
    topicsDiscussed: string[];
}

@Injectable()
export class ConversationService {
    private readonly logger = new Logger(ConversationService.name);
    private sessions: Map<string, ConversationSession> = new Map();

    // Session timeout in milliseconds (30 minutes)
    private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

    // Max messages to keep in context
    private readonly MAX_CONTEXT_MESSAGES = 10;

    /**
     * Get or create a conversation session
     */
    getSession(sessionId: string): ConversationSession {
        let session = this.sessions.get(sessionId);

        // Check if session exists and is not expired
        if (session) {
            const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
            if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
                // Session expired, create new one
                this.logger.log(`🔄 Session ${sessionId} expired, creating new session`);
                session = this.createSession(sessionId);
            }
        } else {
            session = this.createSession(sessionId);
        }

        return session;
    }

    /**
     * Create a new conversation session
     */
    private createSession(sessionId: string): ConversationSession {
        const session: ConversationSession = {
            sessionId,
            messages: [],
            currentContext: {
                entitiesDiscussed: [],
                topicsDiscussed: [],
            },
            createdAt: new Date(),
            lastActivity: new Date(),
        };
        this.sessions.set(sessionId, session);
        this.logger.log(`✨ Created new session: ${sessionId}`);
        return session;
    }

    /**
     * Add a user message to the session
     */
    addUserMessage(sessionId: string, content: string, intent?: string, entities?: string[]): void {
        const session = this.getSession(sessionId);

        session.messages.push({
            role: 'user',
            content,
            timestamp: new Date(),
            intent,
            entities,
        });

        // Update context
        if (intent) {
            session.currentContext.lastIntent = intent;
            if (!session.currentContext.topicsDiscussed.includes(intent)) {
                session.currentContext.topicsDiscussed.push(intent);
            }
        }

        if (entities && entities.length > 0) {
            session.currentContext.lastPersonMentioned = entities[0];
            entities.forEach(entity => {
                if (!session.currentContext.entitiesDiscussed.includes(entity)) {
                    session.currentContext.entitiesDiscussed.push(entity);
                }
            });
        }

        session.lastActivity = new Date();

        // Trim messages if too many
        if (session.messages.length > this.MAX_CONTEXT_MESSAGES * 2) {
            session.messages = session.messages.slice(-this.MAX_CONTEXT_MESSAGES);
        }
    }

    /**
     * Add MITHRA's response to the session
     */
    addMithraResponse(sessionId: string, content: string, intent?: string): void {
        const session = this.getSession(sessionId);

        session.messages.push({
            role: 'mithra',
            content,
            timestamp: new Date(),
            intent,
        });

        if (intent === 'career_report' || intent === 'overall_report') {
            session.currentContext.lastReportType = intent;
        }

        session.lastActivity = new Date();
    }

    /**
     * Detect if the current query is a follow-up question
     */
    isFollowUp(sessionId: string, question: string): boolean {
        const q = question.toLowerCase();

        // Follow-up indicators
        const followUpPatterns = [
            /^(and|also|what about|how about|tell me more|more about)/,
            /^(that|this|the same|those|these)/,
            /^(yes|yeah|yep|okay|ok|sure|please)/,
            /^(their|his|her|its)/,
            /^(compare|versus|vs)/,
            /\b(again|another|else|other)\b/,
            /\?$/,  // Just a short question
        ];

        // Check if short question that might be follow-up
        if (q.split(' ').length <= 3 && this.getSession(sessionId).messages.length > 0) {
            return true;
        }

        return followUpPatterns.some(pattern => pattern.test(q));
    }

    /**
     * Resolve pronouns and references to actual entities
     */
    resolveReferences(sessionId: string, question: string): string {
        const session = this.getSession(sessionId);
        const context = session.currentContext;

        let resolved = question;

        // Replace pronouns with last mentioned person
        if (context.lastPersonMentioned) {
            const pronounPatterns = [
                { pattern: /\b(their|his|her)\b/gi, replacement: `${context.lastPersonMentioned}'s` },
                { pattern: /\b(them|him|her)\b/gi, replacement: context.lastPersonMentioned },
                { pattern: /\b(they|he|she)\b/gi, replacement: context.lastPersonMentioned },
                { pattern: /\bthat person\b/gi, replacement: context.lastPersonMentioned },
                { pattern: /\bthe same person\b/gi, replacement: context.lastPersonMentioned },
            ];

            pronounPatterns.forEach(({ pattern, replacement }) => {
                resolved = resolved.replace(pattern, replacement);
            });
        }

        return resolved;
    }

    /**
     * Get conversation context for LLM
     */
    /**
     * Get conversation context formatted for LLM Prompt
     */
    getHistoryForLLM(sessionId: string): string {
        const session = this.getSession(sessionId);

        if (session.messages.length === 0) {
            return '';
        }

        // Get last 10 messages for deeper context
        const recentMessages = session.messages.slice(-10);

        let history = '--- CONVERSATION HISTORY ---\n';
        recentMessages.forEach(msg => {
            const roleLabel = msg.role === 'user' ? 'User' : 'MITHRA';
            // Clean content to avoid massive prompts if message is huge (e.g. previous report)
            let content = msg.content;
            if (content.length > 500) {
                content = content.substring(0, 500) + '... [content truncated]';
            }
            history += `${roleLabel}: ${content}\n`;
        });
        history += '--- CURRENT INTERACTION ---\n';

        return history;
    }

    /**
     * Generate proactive suggestions based on conversation
     */
    getProactiveSuggestions(sessionId: string): string[] {
        const session = this.getSession(sessionId);
        const context = session.currentContext;
        const suggestions: string[] = [];

        // If we just discussed a person, suggest related actions
        if (context.lastPersonMentioned) {
            if (context.lastIntent !== 'career_report') {
                suggestions.push(`Generate career report for ${context.lastPersonMentioned}`);
            }
            suggestions.push(`Compare ${context.lastPersonMentioned} with other candidates`);
        }

        // Based on last intent
        switch (context.lastIntent) {
            case 'test_results':
                suggestions.push('Show top performers');
                suggestions.push('Filter by score range');
                break;
            case 'list_users':
                suggestions.push('Show active users only');
                suggestions.push('Count total users');
                break;
            case 'career_report':
                suggestions.push('Generate overall placement report');
                suggestions.push('Find similar candidates');
                break;
            case 'list_candidates':
                suggestions.push('Show assessment results');
                suggestions.push('Generate overall report');
                break;
        }

        // Always have some fallback suggestions
        if (suggestions.length === 0) {
            suggestions.push('Show test results');
            suggestions.push('List all candidates');
            suggestions.push('Generate overall report');
        }

        return suggestions.slice(0, 3);
    }

    /**
     * Clear a session
     */
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.logger.log(`🗑️ Cleared session: ${sessionId}`);
    }

    /**
     * Get session statistics
     */
    getSessionStats(sessionId: string): { messageCount: number; topics: string[]; duration: number } {
        const session = this.getSession(sessionId);
        return {
            messageCount: session.messages.length,
            topics: session.currentContext.topicsDiscussed,
            duration: Date.now() - session.createdAt.getTime(),
        };
    }

    /**
     * Cleanup expired sessions (call periodically)
     */
    cleanupExpiredSessions(): number {
        const now = Date.now();
        let cleaned = 0;

        this.sessions.forEach((session, sessionId) => {
            if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            this.logger.log(`🧹 Cleaned up ${cleaned} expired sessions`);
        }

        return cleaned;
    }
}
