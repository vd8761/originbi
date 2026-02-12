/**
 * User Context Interface
 * Represents the authenticated user's context throughout the application
 */
export interface UserContext {
    /** Unique numeric user identifier (from users.id) */
    id: number;

    /** User's email address */
    email: string;

    /** User's role in the system */
    role: 'ADMIN' | 'CORPORATE' | 'STUDENT';

    /** AWS Cognito subject UUID (from users.cognito_sub) */
    cognitoSub?: string;

    /** Corporate account ID — resolved from corporate_accounts.id (only for CORPORATE role) */
    corporateId?: number;

    /** User's display name */
    name?: string;

    /** Group ID if assigned */
    groupId?: number;

    /** Registration ID — resolved from registrations.id (for STUDENT role) */
    registrationId?: number;
}

/**
 * Query interpretation result from LLM
 */
export interface QueryInterpretation {
    intent: string;
    searchTerm: string | null;
    table: string;
    includePersonality: boolean;
}

/**
 * RAG query result
 */
export interface QueryResult {
    answer: string;
    searchType: string;
    confidence: number;
    metadata?: Record<string, any>;
}

/**
 * Audit log entry for tracking all RAG queries
 */
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
