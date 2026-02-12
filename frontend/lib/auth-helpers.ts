/**
 * Auth Helpers — Centralized authentication utility for all frontend components.
 *
 * Provides consistent auth header generation for API calls.
 * Uses sessionStorage (tab-scoped) to prevent cross-tab identity leaks
 * when different users are logged in simultaneously.
 */

export interface StoredUser {
    id: number;
    email: string;
    name?: string;
    role: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    corporateId?: number;
}

const DEFAULT_USER: StoredUser = {
    id: 0,
    email: '',
    role: 'STUDENT',
    name: 'Anonymous',
};

/**
 * Snapshot the current localStorage user into this tab's sessionStorage.
 * Call this once on component mount so each tab keeps its own identity
 * even if another tab logs in as a different user.
 */
export function snapshotUserToSession(): void {
    const lsUser = localStorage.getItem('user');
    if (lsUser) {
        // Always refresh: if the user just logged in on this tab, localStorage
        // is the freshest source. Subsequent reads prefer sessionStorage.
        sessionStorage.setItem('user', lsUser);
    }
}

/**
 * Get the stored user — prefers tab-scoped sessionStorage, falls back to localStorage.
 */
export function getStoredUser(): StoredUser {
    try {
        const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                id: Number(parsed.id) || 0,
                email: parsed.email || '',
                name: parsed.name || parsed.full_name || '',
                role: normalizeRole(parsed.role),
                corporateId: parsed.corporateId ? Number(parsed.corporateId) : undefined,
            };
        }
    } catch {
        // Silently fail — return default
    }
    return { ...DEFAULT_USER };
}

/**
 * Get auth headers for API calls.
 * Sends both the Cognito ID token (if available) and user context.
 */
export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Try to get the Cognito ID token (set at login time)
    const idToken =
        sessionStorage.getItem('idToken') ||
        sessionStorage.getItem('originbi_id_token') ||
        localStorage.getItem('originbi_id_token') ||
        localStorage.getItem('accessToken');

    if (idToken && idToken.length > 20) {
        headers['Authorization'] = `Bearer ${idToken}`;
    }

    // Always include X-User-Context as fallback (validated by backend via DB)
    const user = getStoredUser();
    if (user.id > 0) {
        headers['X-User-Context'] = JSON.stringify(user);
    }

    return headers;
}

/**
 * Normalize role string to valid enum.
 */
function normalizeRole(role: string | undefined): 'ADMIN' | 'CORPORATE' | 'STUDENT' {
    const upper = (role || '').toUpperCase().trim();
    if (upper === 'ADMIN' || upper === 'SUPER_ADMIN') return 'ADMIN';
    if (upper === 'CORPORATE') return 'CORPORATE';
    return 'STUDENT';
}
