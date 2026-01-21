# 🚀 RAG Production Setup Guide (Neon DB)

This guide helps you deploy the OriginBI RAG System (Assessment Chatbot) to Production using **Neon DB**.

---

## 🟢 Step 1: Enable Vector Support in Neon DB

Neon DB supports AI Vectors, but you must enable the extension first.

1.  Log in to your **Neon Console**.
2.  Go to **SQL Editor**.
3.  Run this command:
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```
    *(If it says "Success", you are ready!)*

---

## 🔑 Step 2: Configure Environment Variables

In your production environment (Vercel, Railway, AWS, or Render), add these variables:

| Variable | Value Hint | Purpose | Where to Get |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | `gsk_...` | Brain of the Chatbot (Router) | [Groq Console](https://console.groq.com/keys) |
| `JINA_API_KEY` | `jina_...` | Vector Embeddings Generator | [Jina AI](https://jina.ai/embeddings/) |
| `DATABASE_URL` | `postgres://...` | Your Neon DB Connection String | Neon Dashboard |

> **💡 Tip for Neon:** Use the **Pooled Connection String** (usually ends with `?sslmode=require`) for better performance.

---

## 📦 Step 3: Deploy & Release

When you deploy your backend code, the system will automatically:
1.  **Connect** to Neon DB.
2.  **Create Tables**: `rag_documents` and `rag_embeddings` (if `DB_SYNC=true`).
3.  **Start Syncing**: The `SyncService` will start automatically after 1 minute to fetch and index data.

---

## 🕵️ Step 4: Verify It Works (The "Proof")

Once deployed, you can verify everything is working directly from your local machine (connecting to Prod DB) or from the server console:

**Option A: Quick SQL Check (Neon Console)**
Run this in Neon SQL Editor:
```sql
SELECT COUNT(*) FROM rag_embeddings;
```
*If the number is > 0, your data is synced!*

**Option B: Deep Verification (Recommended)**
Run our dedicated script pointing to your PROD DB:

1.  Update your local `.env` file to point to **Production Neon DB**.
2.  Run the verification script:
    ```bash
    npx ts-node src/rag/verify-rag-production.ts
    ```
3.  This script will:
    -   ✅ Check if `pgvector` is on.
    -   ✅ Count your production vectors.
    -   ✅ Perform a real test search (e.g., "python skills").

---

## 🛠️ Appendix: Manual Database Setup
**Only use this if automatic table creation fails (e.g., if you set `DB_SYNC=false`).**

Run these SQL commands in your Neon Console:

```sql
-- 1. Enable Vector Extension (Critical)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    source_table VARCHAR(50),
    source_id INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create Embeddings Table (Vector 1024 dimensions)
CREATE TABLE IF NOT EXISTS rag_embeddings (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES rag_documents(id) ON DELETE CASCADE,
    embedding vector(1024)
);

-- 4. Create Search Index (Optional - Faster Search)
CREATE INDEX ON rag_embeddings USING hnsw (embedding vector_cosine_ops);
```

---

## ❓ Common Questions

**Q: Do I need to manually upload resumes?**
**A:** No. The system automatically reads from your Candidates/Users tables every 30 minutes.

**Q: Does it cost money?**
**A:** 
- **Neon DB:** Storage cost (Vectors take some space).
- **Jina AI:** Embeddings API cost (very cheap, free tier available).
- **Groq:** LLM Inference cost.

**Q: How do I force a sync immediately?**
**A:** Restart the backend service. It always syncs 1 minute after startup.
