# 🏗️ Enterprise Role-Based Access Control (RBAC) Architecture

## Executive Summary
This document outlines a **production-grade, enterprise-level** methodology for implementing Role-Based Access Control in the RAG Chat Assistant using industry best practices and design patterns.

---

## 1. 🎯 Architecture Overview

### Design Principles
| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility** | Each class handles one concern |
| **Open/Closed** | Extend behavior without modifying core |
| **Dependency Injection** | All dependencies are injectable |
| **Defense in Depth** | Multiple security layers |

### Layer Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │ Controller  │──│ Guards      │──│ Role Decorator          │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                               │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │ RAG Service │──│ Access      │──│ Query Builder           │ │
│   │             │  │ Policy      │  │ (Strategy Pattern)      │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      DATA ACCESS LAYER                           │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │ Repository  │──│ Row-Level   │──│ Audit Logger            │ │
│   │             │  │ Security    │  │                         │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      DATABASE LAYER                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ PostgreSQL + pgvector + RLS Policies                    │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔐 Security Layer Implementation

### 2.1 Custom Role Decorator
**File:** `backend/admin-service/src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export enum UserRole {
    ADMIN = 'ADMIN',
    CORPORATE = 'CORPORATE',
    STUDENT = 'STUDENT',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Usage: @Roles(UserRole.ADMIN, UserRole.CORPORATE)
```

### 2.2 Role Guard (NestJS Guard with Reflector)
**File:** `backend/admin-service/src/common/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No roles required, allow access
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Insufficient permissions for this operation');
        }

        return true;
    }
}
```

### 2.3 User Context Extractor
**File:** `backend/admin-service/src/common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../interfaces/user-context.interface';

export const CurrentUser = createParamDecorator(
    (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as UserContext;

        if (!user) {
            throw new Error('User not authenticated');
        }

        return data ? user[data] : user;
    },
);
```

---

## 3. 📊 Strategy Pattern for Query Building

### 3.1 Access Policy Interface
**File:** `backend/admin-service/src/rag/policies/access-policy.interface.ts`

```typescript
export interface IAccessPolicy {
    /**
     * Get SQL WHERE clause for this policy
     */
    getFilter(tableAlias?: string): string;

    /**
     * Get allowed intents for this policy
     */
    getAllowedIntents(): string[];

    /**
     * Check if a specific record is accessible
     */
    canAccessRecord(record: any): boolean;

    /**
     * Get error message when access is denied
     */
    getAccessDeniedMessage(intent: string): string;
}
```

### 3.2 Admin Access Policy
**File:** `backend/admin-service/src/rag/policies/admin-access.policy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IAccessPolicy } from './access-policy.interface';

@Injectable()
export class AdminAccessPolicy implements IAccessPolicy {
    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false`;
    }

    getAllowedIntents(): string[] {
        return ['*']; // All intents allowed
    }

    canAccessRecord(_record: any): boolean {
        return true; // Admin can access everything
    }

    getAccessDeniedMessage(_intent: string): string {
        return ''; // Admin never gets access denied
    }
}
```

### 3.3 Corporate Access Policy
**File:** `backend/admin-service/src/rag/policies/corporate-access.policy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

@Injectable()
export class CorporateAccessPolicy implements IAccessPolicy {
    private corporateId: number;

    constructor(user: UserContext) {
        if (!user.corporateId) {
            throw new Error('Corporate ID is required');
        }
        this.corporateId = user.corporateId;
    }

    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false AND ${tableAlias}.corporate_account_id = ${this.corporateId}`;
    }

    getAllowedIntents(): string[] {
        return [
            'greeting', 'help', 'list_candidates', 'test_results',
            'person_lookup', 'career_report', 'best_performer', 'career_guidance'
        ];
    }

    canAccessRecord(record: any): boolean {
        return record.corporate_account_id === this.corporateId ||
               record.corporateAccountId === this.corporateId;
    }

    getAccessDeniedMessage(intent: string): string {
        const messages: Record<string, string> = {
            'list_users': "I can only show you candidates from your organization. Try 'list my candidates' instead.",
            'default': "You can only access data from your organization."
        };
        return messages[intent] || messages['default'];
    }
}
```

### 3.4 Student Access Policy
**File:** `backend/admin-service/src/rag/policies/student-access.policy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IAccessPolicy } from './access-policy.interface';
import { UserContext } from '../../common/interfaces/user-context.interface';

@Injectable()
export class StudentAccessPolicy implements IAccessPolicy {
    private userId: number;
    private userName: string;

    constructor(user: UserContext) {
        this.userId = user.id;
        this.userName = user.name || 'Student';
    }

    getFilter(tableAlias: string = 'r'): string {
        return `${tableAlias}.is_deleted = false AND ${tableAlias}.user_id = ${this.userId}`;
    }

    getAllowedIntents(): string[] {
        return [
            'greeting', 'help', 'test_results', 'career_report',
            'career_guidance', 'job_eligibility', 'skill_development'
        ];
    }

    canAccessRecord(record: any): boolean {
        return record.user_id === this.userId || record.userId === this.userId;
    }

    getAccessDeniedMessage(intent: string): string {
        const messages: Record<string, string> = {
            'list_candidates': `Hi ${this.userName}! I can share your personal assessment results. Would you like to see your profile?`,
            'list_users': `I can only show your own information, ${this.userName}. Let me get your profile.`,
            'person_lookup': `I can only access your personal data. Would you like to see your assessment results instead?`,
            'best_performer': `I can show you how you're performing! Want to see your scores and career guidance?`,
            'default': `I can help you with your personal career guidance. What would you like to know about yourself?`
        };
        return messages[intent] || messages['default'];
    }
}
```

### 3.5 Policy Factory
**File:** `backend/admin-service/src/rag/policies/access-policy.factory.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { UserContext } from '../../common/interfaces/user-context.interface';
import { IAccessPolicy } from './access-policy.interface';
import { AdminAccessPolicy } from './admin-access.policy';
import { CorporateAccessPolicy } from './corporate-access.policy';
import { StudentAccessPolicy } from './student-access.policy';

@Injectable()
export class AccessPolicyFactory {
    createPolicy(user: UserContext): IAccessPolicy {
        switch (user.role) {
            case 'ADMIN':
                return new AdminAccessPolicy();
            case 'CORPORATE':
                return new CorporateAccessPolicy(user);
            case 'STUDENT':
                return new StudentAccessPolicy(user);
            default:
                throw new Error(`Unknown role: ${user.role}`);
        }
    }
}
```

---

## 4. 🔄 Secure Query Builder

### 4.1 Type-Safe Query Builder
**File:** `backend/admin-service/src/rag/utils/secure-query-builder.ts`

```typescript
import { IAccessPolicy } from '../policies/access-policy.interface';

export interface QueryOptions {
    intent: string;
    searchTerm?: string;
    includePersonality?: boolean;
    limit?: number;
}

export class SecureQueryBuilder {
    private policy: IAccessPolicy;
    private tableAlias: string;

    constructor(policy: IAccessPolicy, tableAlias: string = 'r') {
        this.policy = policy;
        this.tableAlias = tableAlias;
    }

    /**
     * Build a secure SELECT query with role-based filtering
     */
    buildCandidateQuery(options: QueryOptions): string {
        const { limit = 15 } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);

        return `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                ${this.tableAlias}.status,
                aa.total_score,
                pt.blended_style_name
            FROM registrations ${this.tableAlias}
            LEFT JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
            ORDER BY ${this.tableAlias}.created_at DESC
            LIMIT ${limit}
        `;
    }

    /**
     * Build a secure search query with name filter
     */
    buildSearchQuery(searchTerm: string, options: QueryOptions): string {
        const { limit = 10 } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);
        const sanitizedTerm = this.sanitizeSearchTerm(searchTerm);

        return `
            SELECT 
                ${this.tableAlias}.id,
                ${this.tableAlias}.full_name,
                ${this.tableAlias}.gender,
                aa.total_score,
                pt.blended_style_name
            FROM registrations ${this.tableAlias}
            LEFT JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND ${this.tableAlias}.full_name ILIKE '%${sanitizedTerm}%'
            ORDER BY ${this.tableAlias}.created_at DESC
            LIMIT ${limit}
        `;
    }

    /**
     * Build a secure test results query
     */
    buildTestResultsQuery(options: QueryOptions): string {
        const { limit = 15 } = options;
        const baseFilter = this.policy.getFilter(this.tableAlias);

        return `
            SELECT 
                ${this.tableAlias}.full_name,
                aa.total_score,
                aa.status,
                aa.completed_at,
                pt.blended_style_name,
                pt.blended_style_desc
            FROM registrations ${this.tableAlias}
            INNER JOIN assessment_attempts aa ON aa.registration_id = ${this.tableAlias}.id
            LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
            WHERE ${baseFilter}
              AND aa.status = 'COMPLETED'
            ORDER BY aa.total_score DESC
            LIMIT ${limit}
        `;
    }

    /**
     * Sanitize user input to prevent SQL injection
     */
    private sanitizeSearchTerm(term: string): string {
        return term.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }
}
```

---

## 5. 📝 Audit Logging System

### 5.1 Audit Logger Interface
**File:** `backend/admin-service/src/rag/audit/audit-logger.interface.ts`

```typescript
export interface AuditLogEntry {
    timestamp: Date;
    userId: number;
    userRole: string;
    userEmail: string;
    corporateId?: number;
    action: string;
    intent: string;
    query: string;
    tablesAccessed: string[];
    recordsReturned: number;
    accessGranted: boolean;
    responseTime: number;
    ipAddress?: string;
}
```

### 5.2 Audit Logger Service
**File:** `backend/admin-service/src/rag/audit/audit-logger.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry } from './audit-logger.interface';

@Injectable()
export class AuditLoggerService {
    private readonly logger = new Logger('RAG-AUDIT');

    async logQuery(entry: AuditLogEntry): Promise<void> {
        const logMessage = {
            ...entry,
            timestamp: entry.timestamp.toISOString(),
        };

        // Log to console (structured logging)
        this.logger.log(JSON.stringify(logMessage));

        // TODO: Persist to database/analytics service
        // await this.persistToDatabase(entry);
    }

    async logAccessDenied(
        userId: number,
        userRole: string,
        intent: string,
        reason: string
    ): Promise<void> {
        this.logger.warn(`ACCESS_DENIED | User: ${userId} | Role: ${userRole} | Intent: ${intent} | Reason: ${reason}`);
    }
}
```

---

## 6. 🔌 Integration in RAG Service

### 6.1 Updated RAG Service Pattern
**File:** `backend/admin-service/src/rag/rag.service.ts` (Updated Pattern)

```typescript
import { Injectable } from '@nestjs/common';
import { AccessPolicyFactory } from './policies/access-policy.factory';
import { SecureQueryBuilder } from './utils/secure-query-builder';
import { AuditLoggerService } from './audit/audit-logger.service';
import { UserContext } from '../common/interfaces/user-context.interface';

@Injectable()
export class RagService {
    constructor(
        private readonly policyFactory: AccessPolicyFactory,
        private readonly auditLogger: AuditLoggerService,
        private readonly dataSource: DataSource,
    ) {}

    async query(question: string, user: UserContext): Promise<QueryResult> {
        const startTime = Date.now();
        
        // Step 1: Create role-specific access policy
        const policy = this.policyFactory.createPolicy(user);
        
        // Step 2: Interpret the query
        const interpretation = await this.understandQuery(question);
        
        // Step 3: Check if intent is allowed
        const allowedIntents = policy.getAllowedIntents();
        if (!allowedIntents.includes('*') && !allowedIntents.includes(interpretation.intent)) {
            // Return friendly redirect message
            const message = policy.getAccessDeniedMessage(interpretation.intent);
            await this.auditLogger.logAccessDenied(user.id, user.role, interpretation.intent, 'Intent not allowed');
            return { answer: message, searchType: 'redirect', confidence: 1.0 };
        }
        
        // Step 4: Build secure query with policy filter
        const queryBuilder = new SecureQueryBuilder(policy);
        const sql = this.buildQueryForIntent(queryBuilder, interpretation);
        
        // Step 5: Execute query
        const data = await this.dataSource.query(sql);
        
        // Step 6: Log the access
        await this.auditLogger.logQuery({
            timestamp: new Date(),
            userId: user.id,
            userRole: user.role,
            userEmail: user.email,
            corporateId: user.corporateId,
            action: 'RAG_QUERY',
            intent: interpretation.intent,
            query: question,
            tablesAccessed: ['registrations', 'assessment_attempts'],
            recordsReturned: data.length,
            accessGranted: true,
            responseTime: Date.now() - startTime,
        });
        
        // Step 7: Format and return response
        const answer = this.formatResponse(interpretation, data);
        return { answer, searchType: interpretation.intent, confidence: 0.95 };
    }

    private buildQueryForIntent(builder: SecureQueryBuilder, interpretation: any): string {
        switch (interpretation.intent) {
            case 'list_candidates':
                return builder.buildCandidateQuery({ intent: interpretation.intent });
            case 'person_lookup':
                return builder.buildSearchQuery(interpretation.searchTerm, { intent: interpretation.intent });
            case 'test_results':
            case 'best_performer':
                return builder.buildTestResultsQuery({ intent: interpretation.intent });
            default:
                return builder.buildCandidateQuery({ intent: interpretation.intent, limit: 10 });
        }
    }
}
```

---

## 7. 📁 File Structure

```
backend/admin-service/src/
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts          # @Roles() decorator
│   │   └── current-user.decorator.ts   # @CurrentUser() decorator
│   ├── guards/
│   │   └── roles.guard.ts              # RolesGuard
│   └── interfaces/
│       └── user-context.interface.ts   # UserContext type
├── rag/
│   ├── policies/
│   │   ├── access-policy.interface.ts  # IAccessPolicy interface
│   │   ├── access-policy.factory.ts    # PolicyFactory
│   │   ├── admin-access.policy.ts      # Admin policy
│   │   ├── corporate-access.policy.ts  # Corporate policy
│   │   └── student-access.policy.ts    # Student policy
│   ├── utils/
│   │   └── secure-query-builder.ts     # Type-safe query builder
│   ├── audit/
│   │   ├── audit-logger.interface.ts   # Audit log types
│   │   └── audit-logger.service.ts     # Audit logging service
│   ├── rag.service.ts                  # Main RAG service
│   ├── rag.controller.ts               # API endpoints
│   └── rag.module.ts                   # Module configuration
```

---

## 8. 🧪 Testing Strategy

### Unit Test Example
```typescript
describe('CorporateAccessPolicy', () => {
    it('should filter by corporate_account_id', () => {
        const user = { id: 1, role: 'CORPORATE', corporateId: 105 };
        const policy = new CorporateAccessPolicy(user);
        
        expect(policy.getFilter('r')).toBe(
            'r.is_deleted = false AND r.corporate_account_id = 105'
        );
    });

    it('should deny list_users intent', () => {
        const user = { id: 1, role: 'CORPORATE', corporateId: 105 };
        const policy = new CorporateAccessPolicy(user);
        
        expect(policy.getAllowedIntents()).not.toContain('list_users');
    });
});
```

---

## 9. ✅ Implementation Checklist

### Phase 1: Core Infrastructure (Day 1)
- [ ] Create `user-context.interface.ts`
- [ ] Create `roles.decorator.ts`
- [ ] Create `roles.guard.ts`
- [ ] Create `current-user.decorator.ts`

### Phase 2: Access Policies (Day 2)
- [ ] Create `access-policy.interface.ts`
- [ ] Implement `AdminAccessPolicy`
- [ ] Implement `CorporateAccessPolicy`
- [ ] Implement `StudentAccessPolicy`
- [ ] Create `AccessPolicyFactory`

### Phase 3: Query Builder (Day 3)
- [ ] Create `SecureQueryBuilder`
- [ ] Add query methods for all intents
- [ ] Add SQL sanitization

### Phase 4: Audit System (Day 4)
- [ ] Create `AuditLoggerService`
- [ ] Integrate with RAG Service
- [ ] Add structured logging

### Phase 5: Integration & Testing (Day 5)
- [ ] Update `RagService` to use policies
- [ ] Update `RagController` with guards
- [ ] Write unit tests
- [ ] Write integration tests

---

*Architecture Version: 2.0*
*Pattern: Enterprise RBAC with Strategy + Factory*
*Status: Ready for Professional Implementation*
