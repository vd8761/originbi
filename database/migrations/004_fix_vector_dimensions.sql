-- Migration: Upgrade vector dimensions to 1536 for Google Gemini
-- Date: February 11, 2026
-- Note: 1536d provides excellent quality while maintaining IVFFlat compatibility

-- 1. Enable vector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Modify rag_embeddings table
-- Note: We must drop indexes first, then cast the column, then recreate indexes
DROP INDEX IF EXISTS idx_rag_embeddings_vector;
DROP INDEX IF EXISTS rag_embeddings_embedding_idx;

-- We TRUNCATE because old embeddings are incompatible dimensions
-- This forces the system to re-generate them on next demand/batch
TRUNCATE TABLE rag_embeddings CASCADE;

ALTER TABLE rag_embeddings 
ALTER COLUMN embedding TYPE vector(1536);

-- Recreate index (try HNSW first, fallback to IVFFlat)
-- HNSW: Better for high-dimensional vectors
CREATE INDEX idx_rag_embeddings_vector 
ON rag_embeddings USING hnsw (embedding vector_cosine_ops);

-- 3. Modify rag_employee_profiles if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rag_employee_profiles') THEN
        DROP INDEX IF EXISTS rag_employee_profiles_embedding_idx;
        TRUNCATE TABLE rag_employee_profiles;
        ALTER TABLE rag_employee_profiles ALTER COLUMN embedding TYPE vector(1536);
        CREATE INDEX rag_employee_profiles_embedding_idx ON rag_employee_profiles USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;

-- 4. Modify rag_role_requirements if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rag_role_requirements') THEN
        DROP INDEX IF EXISTS rag_role_requirements_embedding_idx;
        TRUNCATE TABLE rag_role_requirements;
        ALTER TABLE rag_role_requirements ALTER COLUMN embedding TYPE vector(1536);
        CREATE INDEX rag_role_requirements_embedding_idx ON rag_role_requirements USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;

-- 5. Update semantic_search function
CREATE OR REPLACE FUNCTION semantic_search(
    query_embedding vector(1536),
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
