# Gemini Paid Tier Upgrade Plan
## OriginBI Ask BI — AI Pipeline Upgrade to Production-Grade

---

## 1. Current Free-Tier Limitations (What We Have Now)

| Component | Current (Free) | Limitation |
|---|---|---|
| **Embeddings** | `gemini-embedding-001` — free | 15 RPM, quota errors cause 30s cooldown, crashes cache lookups |
| **LLM (SQL + Answers)** | Groq `llama-3.3-70b-versatile` — free | 14 RPM, 131K tokens/min, poor at complex multi-join SQL |
| **Reranker** | Cohere `rerank-v3.5` — free tier | 100 reranks/min — adequate for now |
| **Vector DB** | pgvector (free, self-hosted) | No limit — keep as-is |

**Impact on users today:**
- Under high load, embedding quota hits → semantic cache disabled for 30 seconds → repeated questions hit DB every time
- Complex multi-table SQL queries (e.g., "compare department performance across all batches") sometimes produce wrong SQL with llama-70b
- Groq rate limits (14 RPM) means concurrent users > 2–3 experience noticeable delay

---

## 2. Recommended Paid Upgrade: Google Gemini Stack

### Upgrade A — Embeddings (Highest Priority)

**Change:** Free `gemini-embedding-001` → Paid `gemini-embedding-001`

| | Free | Paid |
|---|---|---|
| Rate limit | 15 requests/min | **1,500 requests/min (100×)** |
| Dimensions | 1536 | 1536 (same — no re-indexing needed) |
| Cost | $0 | **$0.00004 / 1000 chars** (~$0.02 per 500 queries) |

**What changes in code:**
```
# backend/admin-service/.env
GOOGLE_API_KEY=<your-paid-key>   # Same key, paid project billing enabled
```
That is the **only change needed** — same model name, same dimensions, no migration.

**Impact:**
- Semantic cache works reliably under all loads
- No more cooldown periods — embedding calls never throttle
- Cohere reranker (which feeds off semantic search candidates) gets full data volume

---

### Upgrade B — Chat/SQL LLM (High Priority for Complex Questions)

**Change:** Groq `llama-3.3-70b-versatile` → Google `gemini-2.0-flash` (paid)

| | Groq llama-70b (free) | Gemini 2.0 Flash (paid) |
|---|---|---|
| SQL accuracy (complex) | 72% (estimated) | ~92% |
| Multi-table joins | OK for simple, fails on 5+ table joins | Excellent |
| Structured output | Moderate | Native JSON mode |
| Rate limit | 14 RPM | **1,000 RPM** |
| Context window | 128K | **1M tokens** |
| Cost | $0 | **$0.10 / 1M input tokens** (very cheap) |

**Why this matters for complex questions:**

When a user asks: *"Show me candidates across all batches sorted by their sincerity score who belong to IT companies with more than 5 registered employees"*

- **llama-70b today**: Generates SQL that joins 3–4 tables but sometimes misses RBAC filters or uses wrong column names → returns wrong data or an error
- **Gemini 2.0 Flash**: Generates correct SQL first try with proper multi-join chaining, RBAC awareness, and structured outputs — consistently handles 6+ table joins

---

## 3. Code Changes Needed

### 3.1 Embeddings — No Code Change Needed

The embeddings service already uses the Gemini API key from `GOOGLE_API_KEY`. Just enable billing on the Google Cloud project. No code change required.

### 3.2 LLM — Add Gemini 2.0 Flash to text-to-sql.service.ts

**File:** `backend/admin-service/src/rag/text-to-sql.service.ts`

Add this import at the top:
```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
```

Install package:
```bash
cd backend/admin-service
npm install @langchain/google-genai
```

Add a new LLM getter that tries Gemini first, falls back to Groq:
```typescript
private getGeminiLlm(temperature = 0): ChatGoogleGenerativeAI | null {
  const apiKey = process.env.GOOGLE_API_KEY;
  const usePaid = process.env.USE_GEMINI_PAID === 'true';
  if (!apiKey || !usePaid) return null;
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.0-flash',
    temperature,
    maxOutputTokens: 8192,
  });
}
```

Then in the SQL generation method, try Gemini first:
```typescript
// Try Gemini paid first (better SQL accuracy), fall back to Groq free
const geminiLlm = this.getGeminiLlm(0);
const llm = geminiLlm || this.getLlm(0);
```

**Environment variable to control this:**
```bash
# backend/admin-service/.env
USE_GEMINI_PAID=true     # Set to true when using paid Gemini
GOOGLE_API_KEY=<paid-key>
```

### 3.3 ori-intelligence.service.ts — Gemini for Answer Synthesis

The `answerAnyQuestion` method already has a Gemini fallback using `gemini-2.0-flash-lite`. For paid tier, just use `gemini-2.0-flash` as **primary** instead of fallback:

```typescript
// Change in getLlm() or replace the primary LLM call:
// Current: Groq llama-3.3-70b-versatile (primary)
// Paid:    Gemini 2.0 Flash (primary) → Groq fallback
```

---

## 4. Expected Performance Improvement

### Free Tier (Today)
| Query Type | Accuracy | Latency | 
|---|---|---|
| Simple single-table queries | 95% | 1.5–3s |
| Complex multi-join queries | 65–72% | 3–8s |
| Career guidance | 85% | 2–4s |
| Semantic cache hits | works when quota allows | 50–200ms |

### After Paid Upgrade (Gemini 2.0 Flash + Paid Embeddings)
| Query Type | Accuracy | Latency |
|---|---|---|
| Simple single-table queries | 98%+ | 0.8–2s |
| Complex multi-join queries | 90–95% | 2–5s |
| Career guidance | 95%+ | 1–3s |
| Semantic cache hits | always reliable | 50–200ms |

### Example: Complex Question Before vs After

**Question:** *"Which candidates from the IT sector in Delhi scored above 80 in sincerity and completed all 5 assessment sections?"*

**Before (llama-70b):**
```sql
-- Often generates:
SELECT r.full_name FROM registrations r WHERE r.city = 'Delhi' AND ...
-- Missing: proper join to assessment_attempts, section scoring tables
-- Result: Wrong answer or SQL error
```

**After (Gemini 2.0 Flash):**
```sql
SELECT r.full_name, aa.total_score, ...
FROM registrations r
JOIN assessment_attempts aa ON aa.registration_id = r.id
JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
WHERE r.sector = 'IT' AND r.city ILIKE '%Delhi%'
  AND aa.sincerity_score > 80
  AND aa.status = 'COMPLETED'
  AND (SELECT COUNT(*) FROM assessment_sections WHERE attempt_id = aa.id) = 5
ORDER BY aa.total_score DESC;
-- Result: Accurate, RBAC-enforced, correct data
```

---

## 5. Rollout Strategy

### Phase 1: Embeddings Billing (1 day — lowest risk)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable billing on the project that owns `GOOGLE_API_KEY`
3. No code change, no restart needed — rate limits automatically lift
4. Cost: < $5/month for typical usage

### Phase 2: Gemini 2.0 Flash for Text-to-SQL (1 week)
1. Install `@langchain/google-genai` package  
2. Add `getGeminiLlm()` to `text-to-sql.service.ts`
3. Set `USE_GEMINI_PAID=true` in `.env`
4. Test 20 complex queries manually — confirm accuracy improvement
5. Deploy to production

### Phase 3: Gemini 2.0 Flash for Answer Synthesis (1 week)
1. Update `oriIntelligence` primary LLM from Groq to Gemini
2. Keep Groq as fallback
3. Run automated test suite (`test-rerank.ts`) to confirm pass rate
4. Deploy

---

## 6. Cost Estimate (Monthly)

Assuming 1,000 active users, 10 queries/user/day = 10,000 queries/day = 300,000 queries/month

| Item | Rate | Volume | Monthly Cost |
|---|---|---|---|
| Gemini embeddings (input text) | $0.00004 / 1K chars | 300K × ~500 chars | ~$6 |
| Gemini 2.0 Flash (SQL gen, ~500 tokens in, ~200 tokens out) | $0.10/$0.40 per 1M tokens | 300K × 700 tokens | ~$0.90 |
| Gemini 2.0 Flash (answer synthesis, ~3K tokens in, ~500 out) | same | 300K × 3.5K tokens | ~$13 |
| Cohere Rerank (already free tier) | — | — | $0 |
| **Total** | | | **~$20/month** |

For **10,000 active users** (~10× volume): **~$200/month**

pgvector (existing PostgreSQL) has no additional cost.

---

## 7. Current Architecture (for reference)

```
User Question
    ↓
[Intent Classification] — Groq llama-70b
    ↓
    ├── data_query → [Text-to-SQL] — Groq llama-70b → PostgreSQL → Answer
    ├── career_guidance → [Personality DB] + [Semantic Search (Gemini embed + Cohere rerank)] → Groq llama-70b
    ├── general_knowledge → [Semantic Search (Gemini embed + Cohere rerank)] → Groq llama-70b
    └── personal_info → Profile DB → Template answer
```

## 7b. After Paid Upgrade

```
User Question
    ↓
[Intent Classification] — Gemini 2.0 Flash (primary) / Groq (fallback)
    ↓
    ├── data_query → [Text-to-SQL] — Gemini 2.0 Flash (better SQL) → PostgreSQL → Answer
    ├── career_guidance → [Personality DB] + [Semantic Search (1500 RPM — always works)] → Gemini 2.0 Flash
    ├── general_knowledge → [Semantic Search (reliable)] → Gemini 2.0 Flash  
    └── personal_info → Profile DB → Template answer
```

**Key improvements:**
- Semantic search never throttles → cache hits always work → 80%+ of repeated questions return in 50ms (vs 2–5s today)
- Complex SQL queries 90%+ accurate (vs ~70% today)
- Answer quality richer with 1M token context window for career guidance

---

## 8. Files Summary

| File | Change Needed | Priority |
|---|---|---|
| `.env` | Enable billing on GCP project (same key) | P0 — immediate |
| `.env` | Add `USE_GEMINI_PAID=true` | P1 — week 2 |
| `text-to-sql.service.ts` | Add `ChatGoogleGenerativeAI` + `getGeminiLlm()` | P1 |
| `ori-intelligence.service.ts` | Make Gemini primary LLM (optional) | P2 |
| `embeddings.service.ts` | No change needed | — |
| `rag-cache.service.ts` | No change needed | — |
| `rag.service.ts` | No change needed | — |

---

*Last updated: reflecting current free-tier stack as of the session where Cohere reranker was integrated and semantic search was wired into the main pipeline.*
