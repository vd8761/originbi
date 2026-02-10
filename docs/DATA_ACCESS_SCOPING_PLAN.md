# Data Access Scoping Plan — Refined & Production-Ready

## Problem Statement

Before starting development, we need crystal-clear rules for **who can see what data**, based on the **actual database relationships** found in the codebase.

---

## 1. Real Database Relationships (Verified from Code)

### The Chain of Ownership

```
┌─────────────────────────────┐
│          users               │
│─────────────────────────────│
│ id (PK)                     │
│ email                       │
│ role = ADMIN|CORPORATE|     │
│        STUDENT              │
│ corporate_id (nullable)     │◄──── string, links to corporate
│ cognito_sub                 │◄──── AWS Cognito user UUID
└──────┬───────────┬──────────┘
       │           │
       │ 1:1       │ 1:N
       ▼           ▼
┌──────────────┐  ┌──────────────────────────┐
│ corporate_   │  │     registrations         │
│ accounts     │  │──────────────────────────│
│──────────────│  │ id (PK)                  │
│ id (PK)      │◄─│ corporate_account_id (FK)│  ← THE KEY LINK
│ user_id (FK) │  │ user_id (FK → users)     │
│ company_name │  │ full_name                │
│ total_credits│  │ status                   │
│ avail_credits│  │ is_deleted               │
└──────────────┘  └──────────┬───────────────┘
                             │ 1:N
                             ▼
                  ┌──────────────────────────┐
                  │   assessment_attempts     │
                  │──────────────────────────│
                  │ id (PK)                  │
                  │ registration_id (FK)     │
                  │ user_id (FK → users)     │
                  │ total_score              │
                  │ status                   │
                  │ dominant_trait_id (FK)    │
                  └──────────┬───────────────┘
                             │ 1:N
                             ▼
                  ┌──────────────────────────┐
                  │   assessment_answers      │
                  │──────────────────────────│
                  │ assessment_attempt_id(FK)│
                  │ registration_id          │
                  │ answer_score             │
                  └──────────────────────────┘
```

### How Corporate Ownership Works in the DB

```
Step 1: Corporate user logs in
        → users table: { id: 50, role: 'CORPORATE', cognito_sub: 'abc-123' }

Step 2: Find their company
        → corporate_accounts table: { id: 105, user_id: 50, company_name: 'TechCorp' }

Step 3: Find their employees/candidates
        → registrations table: WHERE corporate_account_id = 105
        (Every registration created under this company has corporate_account_id = 105)

Step 4: Find test results of those employees
        → assessment_attempts table: WHERE registration_id IN (registrations from step 3)
        OR directly: WHERE user_id IN (SELECT user_id FROM registrations WHERE corporate_account_id = 105)
```

### How Individual (Student) Ownership Works

```
Step 1: Student logs in
        → users table: { id: 300, role: 'STUDENT', cognito_sub: 'xyz-789' }

Step 2: Find their registration(s)
        → registrations table: WHERE user_id = 300

Step 3: Find their test results
        → assessment_attempts table: WHERE user_id = 300
        OR: WHERE registration_id IN (SELECT id FROM registrations WHERE user_id = 300)
```

---

## 2. The Three Access Rules (Refined)

### Rule 1: ADMIN — Full Unrestricted Access

| Property | Value |
|----------|-------|
| **Who** | Users with `role = 'ADMIN'` |
| **Can See** | ALL data across all tables, all companies, all users |
| **SQL Filter** | `WHERE is_deleted = false` (soft-delete only) |
| **Blocked Intents** | None |

```sql
-- Admin: Show all candidates
SELECT r.* FROM registrations r WHERE r.is_deleted = false;

-- Admin: Show all test results
SELECT r.full_name, aa.total_score, aa.status
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE r.is_deleted = false;

-- Admin: View any company's data
SELECT r.* FROM registrations r
WHERE r.corporate_account_id = 105 AND r.is_deleted = false;
```

---

### Rule 2: CORPORATE — Company-Scoped Access Only

| Property | Value |
|----------|-------|
| **Who** | Users with `role = 'CORPORATE'` |
| **Can See** | ONLY employees/candidates belonging to their `corporate_account_id` |
| **Common Key** | `registrations.corporate_account_id = corporate_accounts.id` |
| **How to Get Corporate ID** | `SELECT id FROM corporate_accounts WHERE user_id = :loggedInUserId` |
| **SQL Filter** | `WHERE corporate_account_id = :corporateAccountId AND is_deleted = false` |
| **Blocked Intents** | `list_users` (system-wide user list), accessing other company data |

#### How to Resolve the Corporate Account ID at Login

```
Login (Cognito) → Get cognito_sub
        ↓
DB Lookup: SELECT id, role, corporate_id FROM users WHERE cognito_sub = :sub
        ↓
If role = 'CORPORATE':
    DB Lookup: SELECT id FROM corporate_accounts WHERE user_id = :userId
        ↓
    Store corporateAccountId in UserContext
```

**This is critical because:**
- The JWT token from Cognito only has `sub`, `email`, `custom:role`
- It does NOT have the numeric `users.id` or `corporate_accounts.id`
- We MUST do a DB lookup after token verification to enrich the UserContext

#### Scoping Queries

```sql
-- Corporate: Show MY candidates only
SELECT r.full_name, r.status, r.gender
FROM registrations r
WHERE r.corporate_account_id = 105   -- ← their corporate_accounts.id
  AND r.is_deleted = false;

-- Corporate: Show MY candidates' test results
SELECT r.full_name, aa.total_score, aa.status, pt.blended_style_name
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE r.corporate_account_id = 105
  AND r.is_deleted = false
  AND aa.status = 'COMPLETED';

-- Corporate: Search for a candidate BY NAME (within their company only)
SELECT r.full_name, aa.total_score
FROM registrations r
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id
WHERE r.corporate_account_id = 105
  AND r.full_name ILIKE '%john%'
  AND r.is_deleted = false;

-- Corporate: View groups (also scoped)
SELECT g.* FROM groups g
WHERE g.corporate_account_id = 105;

-- Corporate: View credit ledger (also scoped)
SELECT cl.* FROM corporate_credit_ledger cl
WHERE cl.corporate_account_id = 105;

-- Corporate: View counselling sessions (also scoped)
SELECT cs.* FROM counselling_sessions cs
WHERE cs.corporate_account_id = 105;
```

#### Tables That Need Corporate Scoping

| Table | Filter Column | Filter Value |
|-------|--------------|--------------|
| `registrations` | `corporate_account_id` | `corporateAccounts.id` |
| `assessment_attempts` | Via `registration_id` JOIN | Cascaded from registrations |
| `assessment_answers` | Via `registration_id` JOIN | Cascaded from registrations |
| `assessment_sessions` | Via `registration_id` JOIN | Cascaded from registrations |
| `groups` | `corporate_account_id` | `corporateAccounts.id` |
| `group_assessments` | `corporate_account_id` | `corporateAccounts.id` |
| `corporate_credit_ledger` | `corporate_account_id` | `corporateAccounts.id` |
| `counselling_sessions` | `corporate_account_id` | `corporateAccounts.id` |
| `corporate_counselling_access` | `corporate_account_id` | `corporateAccounts.id` |

---

### Rule 3: STUDENT / INDIVIDUAL — Self-Only Access

| Property | Value |
|----------|-------|
| **Who** | Users with `role = 'STUDENT'` |
| **Can See** | ONLY their own profile, their own test results, their own reports |
| **Common Key** | `registrations.user_id = users.id` |
| **SQL Filter** | `WHERE user_id = :loggedInUserId AND is_deleted = false` |
| **Blocked Intents** | `list_candidates`, `list_users`, `best_performer`, `person_lookup` (others) |
| **Redirect Behavior** | Blocked queries get a friendly message redirecting to their own data |

#### Scoping Queries

```sql
-- Student: Show MY profile
SELECT r.full_name, r.gender, r.status
FROM registrations r
WHERE r.user_id = 300   -- ← their users.id
  AND r.is_deleted = false;

-- Student: Show MY test results
SELECT r.full_name, aa.total_score, aa.status, aa.completed_at,
       pt.blended_style_name, pt.blended_style_desc
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE r.user_id = 300
  AND r.is_deleted = false;

-- Student: MY career report
SELECT aa.total_score, pt.blended_style_name, pt.blended_style_desc
FROM assessment_attempts aa
LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE aa.user_id = 300
  AND aa.status = 'COMPLETED';
```

---

## 3. Intent Permission Matrix

| Intent | ADMIN | CORPORATE | STUDENT | Notes |
|--------|:-----:|:---------:|:-------:|-------|
| `greeting` | ✅ | ✅ | ✅ | No DB access |
| `help` | ✅ | ✅ | ✅ | No DB access |
| `list_users` | ✅ All | ❌ Denied | ❌ Denied | System-wide, admin only |
| `list_candidates` | ✅ All | ✅ Own company | ❌ → Own profile | Scoped by corporate_account_id |
| `test_results` | ✅ All | ✅ Own company | ✅ Own only | Scoped appropriately |
| `person_lookup` | ✅ Any | ✅ Own company only | ❌ → Own profile | Name search scoped |
| `career_report` | ✅ Any | ✅ Own candidates | ✅ Own only | Report generation scoped |
| `overall_report` | ✅ Any | ✅ Own candidates | ✅ Own only | Report generation scoped |
| `best_performer` | ✅ All | ✅ Own company | ❌ → Own scores | Ranking scoped |
| `count` | ✅ All | ✅ Own company | ❌ → Own count | Count scoped |
| `career_guidance` | ✅ | ✅ | ✅ Own only | LLM-based, may use scores |
| `job_eligibility` | ❌ N/A | ❌ N/A | ✅ Own only | Student-specific |
| `skill_development` | ❌ N/A | ❌ N/A | ✅ Own only | Student-specific |
| `custom_report` | ✅ Any | ✅ Own company | ✅ Own only | Dynamic report scoped |

---

## 4. The Critical Gap: Cognito → UserContext Enrichment

### Current State (Problem)

```
Cognito ID Token contains:
{
  "sub": "abc-123-def",          ← Cognito UUID (string)
  "email": "hr@techcorp.com",
  "custom:role": "CORPORATE"
}

But RBAC needs:
{
  "id": 50,                      ← Numeric DB user ID
  "email": "hr@techcorp.com",
  "role": "CORPORATE",
  "corporateId": 105,            ← corporate_accounts.id (numeric)
  "name": "HR Manager"           ← Display name
}
```

### Required Fix: Auth Middleware Enrichment

After verifying the Cognito token, we need a middleware/guard step that:

```
1. Verify Cognito token → get { sub, email, custom:role }
2. DB lookup: SELECT id, role, corporate_id FROM users WHERE cognito_sub = :sub
3. If role = 'CORPORATE':
     DB lookup: SELECT id FROM corporate_accounts WHERE user_id = :userId
     → Set corporateAccountId
4. Build UserContext:
     {
       id: users.id,
       email: users.email,
       role: users.role,
       cognitoSub: users.cognito_sub,
       corporateAccountId: corporate_accounts.id (if CORPORATE),
       name: users.full_name or registrations.full_name
     }
5. Attach to request.user
```

**This enrichment step is the foundation of everything.** Without the numeric `corporateAccountId`, we cannot scope corporate queries. Without the numeric `userId`, we cannot scope student queries.

---

## 5. Security Rules Summary

| # | Rule | Implementation |
|---|------|----------------|
| 1 | **Never trust the frontend** | Role & IDs come from server-side DB lookup, not from request body |
| 2 | **Always use parameterized queries** | `WHERE corporate_account_id = $1` not string interpolation |
| 3 | **Fail closed** | If role is unknown or corporateId is missing → deny access |
| 4 | **Scope at query level** | Every SQL query must include the role-based WHERE clause |
| 5 | **Audit everything** | Log who queried what, with what role, and how many records returned |
| 6 | **Friendly denials** | Students don't get "Access Denied" — they get "Let me show your results instead" |
| 7 | **No data leakage in errors** | Never expose other user IDs or corporate IDs in error messages |

---

## 6. Development Pre-Conditions Checklist

Before writing any code, these must be confirmed:

| # | Pre-Condition | Status | Action Needed |
|---|--------------|--------|---------------|
| 1 | Cognito ID token has `custom:role` attribute | ✅ Verified | Already set in Cognito user pool |
| 2 | `users.cognito_sub` column exists & populated | ✅ Verified | Column exists in entity |
| 3 | `registrations.corporate_account_id` links to `corporate_accounts.id` | ✅ Verified | This is the scoping key |
| 4 | `registrations.user_id` links to `users.id` | ✅ Verified | This is the student scoping key |
| 5 | Auth middleware enriches `request.user` with DB IDs | ⚠️ GAP | **Must implement** — current guard only puts raw Cognito payload |
| 6 | `UserContext` interface has `corporateAccountId` field | ✅ Exists | In `user-context.interface.ts` (as `corporateId`) |
| 7 | Access policies exist for all 3 roles | ✅ Created | In `rag/policies/` directory |
| 8 | `rag.service.ts` uses policies in `executeQuery()` | ⚠️ PARTIAL | Inline RBAC exists but needs cleanup for parameterized queries |

---

## 7. Implementation Order

```
Phase 0: Auth Enrichment (MUST DO FIRST)
├── Create UserContext enrichment middleware
├── After Cognito verify → DB lookup for userId + corporateAccountId
├── Attach enriched UserContext to request.user
└── All downstream code can trust request.user.id and request.user.corporateAccountId

Phase 1: Secure Query Execution
├── Update executeQuery() to use parameterized queries ($1, $2...)
├── Apply role-based WHERE clause using AccessPolicy
├── Ensure all JOIN tables are also scoped
└── Test: Corporate user CANNOT see other company's data

Phase 2: Intent Gating
├── Check intent against role permissions before query execution
├── Return friendly redirects for blocked intents
└── Test: Student asking "list candidates" → sees own profile instead

Phase 3: Report Scoping
├── Career reports: verify registration belongs to user/company
├── Overall reports: scope aggregate queries
└── Test: Corporate user CANNOT generate report for employee of another company

Phase 4: Audit & Monitoring
├── Log all queries with role, intent, record count
├── Alert on suspicious patterns (e.g., many failed access attempts)
└── Test: Audit log captures denied access attempts
```

---

## 8. Quick Reference Card

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS QUICK REFERENCE                    │
├──────────────┬──────────────────┬───────────────────────────────┤
│    ROLE      │   FILTER KEY     │   WHERE CLAUSE                │
├──────────────┼──────────────────┼───────────────────────────────┤
│ ADMIN        │ None             │ is_deleted = false            │
│ CORPORATE    │ corporate_       │ corporate_account_id = $1     │
│              │ account_id       │ AND is_deleted = false        │
│ STUDENT      │ user_id          │ user_id = $1                  │
│              │                  │ AND is_deleted = false        │
├──────────────┼──────────────────┼───────────────────────────────┤
│              │ SOURCE OF $1     │                               │
├──────────────┼──────────────────┼───────────────────────────────┤
│ CORPORATE    │ corporate_       │ Resolved from:                │
│              │ accounts.id      │ users(cognito_sub) →          │
│              │                  │ corporate_accounts(user_id)   │
│ STUDENT      │ users.id         │ Resolved from:                │
│              │                  │ users(cognito_sub) → users.id │
└──────────────┴──────────────────┴───────────────────────────────┘
```

---

*Document Created: February 9, 2026*
*Status: READY — All pre-conditions documented, gaps identified, implementation order defined*
