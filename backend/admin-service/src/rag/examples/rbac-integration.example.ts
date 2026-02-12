/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROLE-BASED ACCESS CONTROL - INTEGRATION EXAMPLE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This file demonstrates how to integrate the RBAC system into the existing
 * RAG service. The key changes are:
 * 
 * 1. Import the SecureQueryExecutor instead of using direct SQL
 * 2. Pass the UserContext to query methods
 * 3. Handle redirected responses for unauthorized access
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserContext, QueryResult } from '../../common/interfaces/user-context.interface';
import { AccessPolicyFactory } from '../policies';
import { SecureQueryExecutor } from '../utils';
import type { QueryInterpretation } from '../utils';
import { AuditLoggerService } from '../audit';

/**
 * Example of how to modify the existing RagService.query() method
 * to use role-based access control.
 * 
 * BEFORE (Unsafe):
 * ```typescript
 * async query(question: string, user: any): Promise<QueryResult> {
 *     const interpretation = await this.understandQuery(question);
 *     const data = await this.executeQuery(interpretation); // No filtering!
 *     return { answer: this.formatResponse(data), ... };
 * }
 * ```
 * 
 * AFTER (Secure):
 * ```typescript
 * async query(question: string, user: UserContext): Promise<QueryResult> {
 *     const interpretation = await this.understandQuery(question);
 *     
 *     // Use secure executor with role-based filtering
 *     const result = await this.secureQueryExecutor.executeSecureQuery(
 *         interpretation,
 *         user
 *     );
 *     
 *     // Handle access denied with friendly redirect
 *     if (result.redirected) {
 *         return { answer: result.redirectMessage, ... };
 *     }
 *     
 *     return { answer: this.formatResponse(result.data), ... };
 * }
 * ```
 */

@Injectable()
export class RagServiceIntegrationExample {
    private readonly logger = new Logger('RAG-RBAC-Integration');

    constructor(
        private readonly dataSource: DataSource,
        private readonly policyFactory: AccessPolicyFactory,
        private readonly secureQueryExecutor: SecureQueryExecutor,
        private readonly auditLogger: AuditLoggerService,
    ) { }

    /**
     * EXAMPLE: Secure Query Method
     * This shows the pattern to use in the main RagService.query() method
     */
    async secureQuery(
        question: string,
        user: UserContext
    ): Promise<QueryResult> {
        this.logger.log(`🔒 Secure RAG Query Started`);
        this.logger.log(`👤 User: ${user.email} (${user.role})`);

        // Step 1: Interpret the query (existing logic)
        const interpretation: QueryInterpretation = {
            intent: 'list_candidates', // This would come from LLM
            searchTerm: null,
            table: 'registrations',
            includePersonality: true,
        };

        // Step 2: Execute with RBAC filtering
        const result = await this.secureQueryExecutor.executeSecureQuery(
            interpretation,
            user
        );

        // Step 3: Handle redirect (access denied with friendly message)
        if (result.redirected) {
            this.logger.log(`🚫 Access redirected for role: ${user.role}`);
            return {
                answer: result.redirectMessage || 'I can only show you data you have access to.',
                searchType: 'redirect',
                confidence: 1.0,
            };
        }

        // Step 4: Format and return response
        this.logger.log(`✅ Query successful: ${result.data.length} records`);
        return {
            answer: this.formatData(result.data),
            searchType: interpretation.intent,
            confidence: 0.95,
        };
    }

    /**
     * EXAMPLE: Career Report with Access Check
     * Shows how to verify access before generating a report
     */
    async generateCareerReport(
        user: UserContext,
        registrationId: number
    ): Promise<{ success: boolean; message: string; reportUrl?: string }> {

        // Step 1: Check if user can access this registration
        const canAccess = await this.secureQueryExecutor.canAccessRegistration(
            user,
            registrationId
        );

        if (!canAccess) {
            // Log the denied access
            await this.auditLogger.logAccessDenied(
                user.id,
                user.role,
                'career_report',
                `Registration ${registrationId} not in user's scope`
            );

            // Return friendly message based on role
            const policy = this.policyFactory.createPolicy(user);
            const message = policy.getAccessDeniedMessage('career_report');

            return {
                success: false,
                message,
            };
        }

        // Step 2: Get candidate data (already filtered)
        const candidate = await this.secureQueryExecutor.getSecureCandidate(
            user,
            registrationId
        );

        if (!candidate) {
            return {
                success: false,
                message: 'Could not find the candidate details.',
            };
        }

        // Step 3: Generate report (existing logic)
        // ... report generation code ...

        // Step 4: Log successful report generation
        await this.auditLogger.logReportGeneration(
            user.id,
            user.role,
            'CAREER_REPORT',
            registrationId,
            true
        );

        return {
            success: true,
            message: `Career report generated for ${candidate.full_name}`,
            reportUrl: '/reports/generated/career-report.pdf',
        };
    }

    /**
     * Simple data formatter for demonstration
     */
    private formatData(data: any[]): string {
        if (!data.length) {
            return 'No data found.';
        }

        return `Found ${data.length} records:\n` +
            data.slice(0, 5).map(row =>
                `• ${row.full_name || row.email || 'Unknown'}`
            ).join('\n');
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KEY CHANGES REQUIRED IN rag.service.ts:
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. Add constructor injection:
 *    ```typescript
 *    constructor(
 *        private readonly secureQueryExecutor: SecureQueryExecutor,
 *        private readonly policyFactory: AccessPolicyFactory,
 *        private readonly auditLogger: AuditLoggerService,
 *        // ... existing dependencies
 *    ) {}
 *    ```
 * 
 * 2. Update the query() method signature:
 *    ```typescript
 *    async query(question: string, user: UserContext): Promise<QueryResult>
 *    ```
 * 
 * 3. Replace executeQuery calls:
 *    ```typescript
 *    // OLD:
 *    const data = await this.executeQuery(interpretation);
 *    
 *    // NEW:
 *    const result = await this.secureQueryExecutor.executeSecureQuery(
 *        interpretation,
 *        user
 *    );
 *    if (result.redirected) {
 *        return { answer: result.redirectMessage, ... };
 *    }
 *    const data = result.data;
 *    ```
 * 
 * 4. Update report generation methods to check access first:
 *    ```typescript
 *    const canAccess = await this.secureQueryExecutor.canAccessRegistration(
 *        user,
 *        registrationId
 *    );
 *    if (!canAccess) {
 *        return { answer: 'Access denied', ... };
 *    }
 *    ```
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */
