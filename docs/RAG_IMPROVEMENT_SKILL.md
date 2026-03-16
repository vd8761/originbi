---
name: rag-improvement-diagnosis
description: >
  Step-by-step workflow for diagnosing RAG (Retrieval-Augmented Generation)
  performance problems and implementing targeted improvements. Use this skill
  when a chat assistant fails on complex questions, gives wrong SQL, retrieves
  irrelevant context, or performs inconsistently. Covers LLM selection,
  retrieval strategy, query decomposition, and re-ranking.
applyTo: "backend/admin-service/src/rag/**"
---

# RAG Improvement Diagnosis Skill

## When to Use This Skill
- The chat assistant gives wrong or incomplete answers to complex questions
- Text-to-SQL generates invalid queries for multi-join / multi-condition questions
- Retrieved documents are irrelevant to the user intent
- Answers are inconsistent between runs on the same question
- The assistant handles simple questions well but fails on compound queries

---

## Step 1 — Classify the Failure Type

Before making any change, identify WHICH layer is failing.

Run the question mentally or with logging through each stage:

| Symptom | Likely Broken Layer | Go to Step |
|---|---|---|
| SQL is syntactically wrong | LLM (SQL generation) | Step 3 |
| SQL is correct but returns wrong rows | Schema context or RBAC injection | Step 4 |
| Answer ignores retrieved chunks | LLM (response synthesis) | Step 3 |
| Retrieved chunks are irrelevant | Retrieval / Embeddings | Step 5 |
| Multi-part question only answers one part | No query decomposition | Step 6 |
| Rate limit errors or slow responses | LLM provider limits | Step 2 |
| Right data, wrong format/narrative | Formatter LLM | Step 3 |

---

## Step 2 — Evaluate the LLM Provider

### Decision: Is the current model good enough?

Check `text-to-sql.service.ts` and `rag.service.ts` for `model:` field.

**Current**: `llama-3.3-70b-versatile` via Groq (free tier, 14 RPM limit)

**Upgrade path by priority:**
1. **Claude 3.5 Haiku** (Anthropic) — Best at structured system prompts, Text-to-SQL, following complex rules. Cheapest Anthropic model. Use `@anthropic-ai/sdk`.
2. **GPT-4o-mini** (OpenAI) — Excellent at multi-join SQL, reliable JSON output. Use `@langchain/openai`.
3. **Gemini 1.5 Flash** (Google) — Already using Gemini for embeddings; easy integration. 1M context window.
4. **Groq llama-3.3-70b** — Keep for fast/cheap tasks; move complex SQL to a stronger model.

**Implementation pattern** (dual-model strategy):
```typescript
// Use fast/cheap model for intent classification
private getFastLlm(): ChatGroq { model: 'llama-3.1-8b-instant' }

// Use strong model only for complex SQL/synthesis
private getStrongLlm(): ChatAnthropic { model: 'claude-haiku-3-5' }
```

**Rate limit mitigation (if staying on Groq free tier):**
- Add exponential backoff in the LLM call wrapper
- Cache classification results aggressively (current: 1 hour)
- Route simple questions (intent: greet, help, count) to the fast 8b model

---

## Step 3 — Fix SQL Generation Quality

### Check: Is the schema context complete and accurate?

Open `rag.service.ts` → `COMPLETE_SCHEMA` constant.

Verify:
- [ ] Every table the LLM needs is listed
- [ ] Foreign key relationships are correct
- [ ] Common vocabulary aliases are mapped (e.g. "resource" = registrations)
- [ ] Column data types are noted for numeric comparisons

### Improvement: Add few-shot SQL examples

In `text-to-sql.service.ts`, add examples of complex successful queries to the system prompt:

```
Example: "Top 5 candidates by score in Engineering"
SQL: SELECT r.full_name, aa.total_score FROM registrations r
     JOIN assessment_attempts aa ON aa.registration_id = r.id
     JOIN corporate_accounts ca ON r.corporate_account_id = ca.id
     WHERE ca.sector_code = 'ENGINEERING'
     ORDER BY aa.total_score DESC LIMIT 5;
```

### Improvement: Use retry-with-error-feedback (already partially implemented)
- Confirm `MAX_SQL_RETRIES = 2` is feeding the PostgreSQL error back to the LLM exactly
- Add the FAILED query + error message in the retry prompt, not just the error

---

## Step 4 — Fix RBAC and Schema Filtering

### Check: Does the SQL validator inject the right WHERE clauses?

Open `utils/sql-validator.service.ts`. Verify:
- [ ] Corporate admin sees only their `corporate_account_id` subset
- [ ] Student sees only their own `registration_id`
- [ ] Super admin has no WHERE injection

### Common bug: RBAC injection breaks complex subqueries

If the WHERE injection inserts into a subquery context incorrectly, add a WITH (CTE) wrapper to isolate RBAC filtering:

```sql
-- RBAC-safe pattern: wrap in CTE
WITH scoped_registrations AS (
  SELECT * FROM registrations WHERE corporate_account_id = $corporateId
)
SELECT ... FROM scoped_registrations ...
```

---

## Step 5 — Fix Retrieval Quality

### Current state
- Single-pass cosine similarity via pgvector
- `gemini-embedding-001` 1536d (good quality)

### Improvement 1: Hybrid Search (semantic + keyword)

Add BM25/trigram keyword search alongside vector search in `embeddings.service.ts`:

```sql
-- Combine semantic and keyword scores
SELECT *,
  (0.7 * (1 - (embedding <=> query_vec)) + 0.3 * ts_rank(to_tsvector(content), plainto_tsquery($query))) AS combined_score
FROM rag_vector_store
ORDER BY combined_score DESC
LIMIT 10;
```

Requires: `pg_trgm` or `tsvector` column on `rag_vector_store`.

### Improvement 2: Re-ranking (highest impact on retrieval quality)

After getting top-20 vector results, re-rank with:
- **Cohere Rerank API** (external, very accurate): `POST /v1/rerank`
- **Cross-encoder local re-ranker**: use `cross-encoder/ms-marco-MiniLM-L-6-v2` via HuggingFace Inference API
- **LLM-as-reranker**: ask the LLM to score 1-10 relevance for each chunk (expensive but no extra dependency)

Only pass top-5 reranked chunks to the final synthesis LLM.

### Improvement 3: HyDE (Hypothetical Document Embeddings)

For factual questions, generate a hypothetical answer first, embed that, then search:

```typescript
// 1. Generate hypothetical answer
const hypothetical = await llm.invoke([
  new SystemMessage('Generate a plausible answer to this question as if you knew the data'),
  new HumanMessage(userQuery)
]);
// 2. Embed the HYPOTHETICAL answer (not the question)
const hydeEmbedding = await embeddingsService.embedQuery(hypothetical.content);
// 3. Search with the hypothetical embedding
const results = await vectorStore.similaritySearch(hydeEmbedding);
```

---

## Step 6 — Add Query Decomposition for Complex Questions

### When to apply
Questions with AND/OR compound conditions, multiple entities, or implicit multi-step reasoning.

**Pattern: Decompose → Execute sub-queries → Merge**

```typescript
async function decomposedQuery(userQuestion: string) {
  // Step 1: LLM decomposes into sub-questions
  const subQuestions = await llm.invoke(
    `Break this question into 1-3 simpler sub-questions that each can be answered independently:\n${userQuestion}`
  );

  // Step 2: Run each sub-question through text-to-sql independently
  const subResults = await Promise.all(
    subQuestions.map(q => textToSqlService.query(q, userContext))
  );

  // Step 3: LLM synthesizes a final answer from sub-results
  const finalAnswer = await synthesizerLlm.invoke(
    `Combine these partial answers into one coherent response:\n${subResults.join('\n')}`
  );
  return finalAnswer;
}
```

---

## Step 7 — Add Self-Evaluation (Corrective RAG)

After generating an answer, ask the LLM to grade it before returning:

```typescript
const evaluation = await llm.invoke([
  new SystemMessage(`Grade this answer 1-5 for accuracy and completeness.
    If grade < 4, explain what is wrong and what additional data is needed.
    Return JSON: { grade: number, issues: string[], retry: boolean }`),
  new HumanMessage(`Question: ${userQuery}\nAnswer: ${generatedAnswer}`)
]);

if (evaluation.retry) {
  // Trigger a second retrieval pass with refined query
}
```

---

## Decision Tree: Which Improvement to Make First?

```
Is the LLM giving wrong SQL? ─────────────────── YES → Step 3 (few-shot examples first)
         │
         NO
         │
Is the retrieved context irrelevant? ─────────── YES → Step 5 (hybrid search + rerank)
         │
         NO
         │
Does complex question only partially answer? ──── YES → Step 6 (query decomposition)
         │
         NO
         │
Is the answer format bad / narrative wrong? ───── YES → Step 3 (formatter LLM prompt)
         │
         NO
         │
Are there rate limit / latency errors? ─────────── YES → Step 2 (dual model strategy)
```

---

## Quality Checks (Definition of Done)

Before declaring an improvement successful:
- [ ] Test with 5 simple questions (should still work as before)
- [ ] Test with 3 multi-join SQL questions (e.g. "top candidates in sector X with score > 80")
- [ ] Test with 1 compound question (e.g. "who scored highest in Engineering AND hasn't completed assessment")
- [ ] Test RBAC: corporate admin gets only their candidates
- [ ] Check response time is < 8 seconds for 90% of queries
- [ ] Verify no SQL injection vectors in new prompts

---

## Related Files in This Workspace

| File | Purpose |
|---|---|
| [text-to-sql.service.ts](../backend/admin-service/src/rag/text-to-sql.service.ts) | SQL generation + retry logic |
| [embeddings.service.ts](../backend/admin-service/src/rag/embeddings.service.ts) | Vector embeddings (Gemini) |
| [rag.service.ts](../backend/admin-service/src/rag/rag.service.ts) | Main orchestration + intent routing |
| [schema-introspector.service.ts](../backend/admin-service/src/rag/schema-introspector.service.ts) | Live schema for SQL context |
| [utils/sql-validator.service.ts](../backend/admin-service/src/rag/utils/sql-validator.service.ts) | RBAC injection + SQL safety |
| [rag-cache.service.ts](../backend/admin-service/src/rag/rag-cache.service.ts) | Query result caching |

---

## Provider Integration Cheat Sheet

### Add Claude (Anthropic)
```bash
npm install @anthropic-ai/sdk @langchain/anthropic
```
```typescript
import { ChatAnthropic } from '@langchain/anthropic';
const claude = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-haiku-3-5',  // cheap + fast
  // model: 'claude-sonnet-4-5', // for hardest questions
  temperature: 0,
  maxTokens: 1024,
});
```

### Add OpenAI
```bash
npm install @langchain/openai
```
```typescript
import { ChatOpenAI } from '@langchain/openai';
const gpt = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  temperature: 0,
});
```

### Add Gemini Chat (you already have Gemini embeddings)
```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
const gemini = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-1.5-flash',
  temperature: 0,
});
```

### Add Cohere Reranker
```bash
npm install cohere-ai
```
```typescript
import { CohereClient } from 'cohere-ai';
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
const reranked = await cohere.rerank({
  query: userQuery,
  documents: topKChunks.map(c => c.content),
  model: 'rerank-multilingual-v3.0',
  topN: 5,
});
```
