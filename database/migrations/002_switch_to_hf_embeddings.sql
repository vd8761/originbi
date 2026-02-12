-- =============================================
-- Migration: Switch from Jina (1024d) to HuggingFace all-MiniLM-L6-v2 (384d)
-- =============================================
-- IMPORTANT: Old embeddings are incompatible with the new model.
-- This migration deletes existing embeddings and recreates columns with 384 dimensions.
-- Re-index your data after running this migration.

-- 1. Drop old indexes (they reference the old vector dimension)
DROP INDEX IF EXISTS idx_rag_embeddings_vector;
DROP INDEX IF EXISTS rag_embeddings_embedding_idx;
DROP INDEX IF EXISTS rag_employee_profiles_embedding_idx;
DROP INDEX IF EXISTS rag_role_requirements_embedding_idx;

-- 2. Delete existing embedding data (incompatible dimensions)
DELETE FROM rag_embeddings WHERE embedding IS NOT NULL;

-- 3. Alter vector columns from 1024 → 384
-- rag_embeddings table (from 001_rag_pgvector.sql)
ALTER TABLE rag_embeddings
  ALTER COLUMN embedding TYPE vector(384);

-- rag_embeddings table (from rag_vector_store.sql, if it exists with different schema)
-- This is safe even if the column was already altered above.

-- rag_employee_profiles (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_employee_profiles') THEN
    DELETE FROM rag_employee_profiles WHERE embedding IS NOT NULL;
    ALTER TABLE rag_employee_profiles ALTER COLUMN embedding TYPE vector(384);
  END IF;
END $$;

-- rag_role_requirements (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_role_requirements') THEN
    DELETE FROM rag_role_requirements WHERE embedding IS NOT NULL;
    ALTER TABLE rag_role_requirements ALTER COLUMN embedding TYPE vector(384);
  END IF;
END $$;

-- 4. Update default model name
ALTER TABLE rag_embeddings
  ALTER COLUMN model SET DEFAULT 'all-MiniLM-L6-v2';

-- 5. Recreate IVFFlat indexes with new dimension
-- Note: IVFFlat requires at least (lists * 10) rows to build.
-- Using lists=50 (lower than before) since we start empty.
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_vector
ON rag_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_employee_profiles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS rag_employee_profiles_embedding_idx
      ON rag_employee_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rag_role_requirements') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS rag_role_requirements_embedding_idx
      ON rag_role_requirements USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20)';
  END IF;
END $$;

-- 6. Update the semantic_search helper function to use 384 dimensions
CREATE OR REPLACE FUNCTION semantic_search(
    query_embedding vector(384),
    match_count INT DEFAULT 5,
    filter_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    document_id INT,
    content TEXT,
    metadata JSONB,
    category VARCHAR(50),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        d.category,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM rag_embeddings e
    JOIN rag_documents d ON d.id = e.document_id
    WHERE (filter_category IS NULL OR d.category = filter_category)
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Done! Now restart the backend and re-index your data.
