# 🔧 Role-Based Access Implementation Plan

## Overview
This document defines the **rules, conditions, and implementation strategy** for role-based data access in the RAG Chat Assistant.

---

## 1. Database Relationship Analysis

### Key Tables & Columns
| Table | Key Column | Purpose |
|-------|------------|---------|
| `users` | `id` | Primary user identifier |
| `users` | `role` | User role (ADMIN/CORPORATE/STUDENT) |
| `users` | `corporate_id` | Links CORPORATE user to their company |
| `registrations` | `user_id` | Links registration to user account |
| `registrations` | `corporate_account_id` | Links employee to their company |
| `assessment_attempts` | `registration_id` | Links test results to candidate |

### Entity Relationship
```
┌──────────────────┐         ┌──────────────────┐
│     users        │         │  registrations   │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │◄───────│ user_id (FK)     │
│ email            │         │ id               │
│ role             │         │ full_name        │
│ corporate_id ────┼────────►│ corporate_account_id│
└──────────────────┘         └────────┬─────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ assessment_attempts│
                            ├──────────────────┤
                            │ registration_id  │
                            │ total_score      │
                            │ status           │
                            └──────────────────┘
```

---

## 2. Access Rules Definition

### Rule 1: ADMIN - Full Access
| Condition | Value |
|-----------|-------|
| **Filter** | NONE |
| **SQL WHERE** | `is_deleted = false` |
| **Scope** | All companies, all users, all data |

**Example Query:**
```sql
SELECT * FROM registrations WHERE is_deleted = false;
-- Returns ALL candidates from ALL companies
```

---

### Rule 2: CORPORATE - Company-Filtered Access
| Condition | Value |
|-----------|-------|
| **Filter Key** | `corporate_account_id` |
| **Source** | `users.corporate_id` (logged-in user) |
| **SQL WHERE** | `corporate_account_id = :loggedInUserCorporateId` |
| **Scope** | Only employees belonging to their company |

**How to get Corporate ID:**
```typescript
// From authenticated user object
const corporateId = req.user.corporateId;  // e.g., "105"
```

**Example Query:**
```sql
SELECT *
FROM registrations
WHERE corporate_account_id = 105  -- Their company ID
  AND is_deleted = false;
-- Returns ONLY candidates from company 105
```

---

### Rule 3: INDIVIDUAL (STUDENT) - Self-Only Access
| Condition | Value |
|-----------|-------|
| **Filter Key** | `user_id` |
| **Source** | `users.id` (logged-in user) |
| **SQL WHERE** | `user_id = :loggedInUserId` |
| **Scope** | Only their own profile and test results |

**How to get User ID:**
```typescript
// From authenticated user object
const userId = req.user.id;  // e.g., 1234
```

**Example Query:**
```sql
SELECT r.*, aa.total_score, aa.status
FROM registrations r
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE r.user_id = 1234  -- Their user ID
  AND r.is_deleted = false;
-- Returns ONLY this user's own data
```

---

## 3. Implementation Strategy

### Phase 1: Create Role Filter Utility
Create a reusable function that generates the correct WHERE clause based on user role.

**File:** `backend/admin-service/src/rag/utils/role-filter.ts`

```typescript
export interface UserContext {
    id: number;
    email: string;
    role: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    corporateId?: number;
}

export function getDataAccessFilter(
    user: UserContext,
    tableAlias: string = 'r'
): string {
    switch (user.role) {
        case 'ADMIN':
            // Admin sees everything
            return `${tableAlias}.is_deleted = false`;

        case 'CORPORATE':
            // Corporate sees only their company's employees
            if (!user.corporateId) {
                throw new Error('Corporate ID is required for CORPORATE role');
            }
            return `${tableAlias}.is_deleted = false AND ${tableAlias}.corporate_account_id = ${user.corporateId}`;

        case 'STUDENT':
            // Student sees only their own data
            return `${tableAlias}.is_deleted = false AND ${tableAlias}.user_id = ${user.id}`;

        default:
            throw new Error(`Unknown role: ${user.role}`);
    }
}
```

### Phase 2: Update RAG Service Queries
Modify `RagService.executeQuery()` to apply the filter.

**Before (Unsafe):**
```typescript
const sql = `SELECT * FROM registrations WHERE is_deleted = false`;
```

**After (Secure):**
```typescript
import { getDataAccessFilter } from './utils/role-filter';

const filter = getDataAccessFilter(user, 'r');
const sql = `SELECT * FROM registrations r WHERE ${filter}`;
```

### Phase 3: Handle Intent-Based Restrictions
Some intents should be completely blocked for certain roles.

| Intent | ADMIN | CORPORATE | STUDENT |
|--------|-------|-----------|---------|
| `list_users` | ✅ | ❌ Blocked | ❌ Blocked |
| `list_candidates` | ✅ All | ✅ Filtered | ❌ → Own profile |
| `test_results` | ✅ All | ✅ Filtered | ✅ Own only |
| `career_report` | ✅ Any | ✅ Their candidates | ✅ Self only |

---

## 4. Security Checklist

Before starting development, confirm:

- [ ] **Corporate ID is available** in JWT token or session
- [ ] **User ID is available** in JWT token or session
- [ ] **Role is validated** on backend (not trusting frontend)
- [ ] **All queries use parameterized values** (no SQL injection)
- [ ] **Error messages don't leak data** (no "User 123 not found in company 456")

---

## 5. Test Scenarios

### CORPORATE User Tests
1. ✅ "List my candidates" → Shows company's employees
2. ❌ "List all users" → Access denied
3. ❌ Searching for employee from another company → "Not found in your organization"

### STUDENT User Tests
1. ✅ "Show my score" → Shows their score
2. ❌ "List candidates" → Redirects to their own profile
3. ❌ "Show John's score" → "I can only show your own results"

### ADMIN User Tests
1. ✅ "List all candidates" → Shows everyone
2. ✅ "Show John's score" → Shows any user
3. ✅ "Generate report for user 123" → Works for any user

---

## 6. Summary of Key Identifiers

| Role | Filter Column | Source | Example |
|------|---------------|--------|---------|
| **ADMIN** | None | N/A | No filter |
| **CORPORATE** | `corporate_account_id` | `req.user.corporateId` | `WHERE corporate_account_id = 105` |
| **STUDENT** | `user_id` | `req.user.id` | `WHERE user_id = 1234` |

---

*Document Created: February 9, 2026*
*Status: Ready for Development*
