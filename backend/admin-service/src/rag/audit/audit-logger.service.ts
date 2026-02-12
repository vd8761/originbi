import { Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry } from '../../common/interfaces/user-context.interface';

/**
 * Audit Logger Service
 * Logs all RAG queries for security auditing and analytics.
 * Provides structured logging for tracking user access patterns.
 */
@Injectable()
export class AuditLoggerService {
    private readonly logger = new Logger('RAG-AUDIT');

    /**
     * Log a successful query execution
     */
    async logQuery(entry: AuditLogEntry): Promise<void> {
        const logMessage = {
            type: 'QUERY',
            timestamp: entry.timestamp.toISOString(),
            userId: entry.userId,
            userRole: entry.userRole,
            userEmail: entry.userEmail,
            corporateId: entry.corporateId || null,
            intent: entry.intent,
            query: entry.query.substring(0, 200), // Truncate for logging
            tablesAccessed: entry.tablesAccessed,
            recordsReturned: entry.recordsReturned,
            accessGranted: entry.accessGranted,
            responseTimeMs: entry.responseTime,
        };

        this.logger.log(JSON.stringify(logMessage));
    }

    /**
     * Log an access denied event
     */
    async logAccessDenied(
        userId: number,
        userRole: string,
        intent: string,
        reason: string,
        query?: string
    ): Promise<void> {
        const logMessage = {
            type: 'ACCESS_DENIED',
            timestamp: new Date().toISOString(),
            userId,
            userRole,
            intent,
            reason,
            query: query?.substring(0, 200),
        };

        this.logger.warn(JSON.stringify(logMessage));
    }

    /**
     * Log a security violation (e.g., attempted cross-tenant access)
     */
    async logSecurityViolation(
        userId: number,
        userRole: string,
        violationType: string,
        details: string
    ): Promise<void> {
        const logMessage = {
            type: 'SECURITY_VIOLATION',
            timestamp: new Date().toISOString(),
            userId,
            userRole,
            violationType,
            details,
            severity: 'HIGH',
        };

        this.logger.error(JSON.stringify(logMessage));
    }

    /**
     * Log report generation
     */
    async logReportGeneration(
        userId: number,
        userRole: string,
        reportType: string,
        targetId: number,
        success: boolean,
        errorMessage?: string
    ): Promise<void> {
        const logMessage = {
            type: 'REPORT_GENERATION',
            timestamp: new Date().toISOString(),
            userId,
            userRole,
            reportType,
            targetId,
            success,
            errorMessage,
        };

        if (success) {
            this.logger.log(JSON.stringify(logMessage));
        } else {
            this.logger.error(JSON.stringify(logMessage));
        }
    }
}
