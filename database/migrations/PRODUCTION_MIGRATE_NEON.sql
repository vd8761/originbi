-- =============================================
-- Production Migration Script for Neon DB
-- Run this on your Neon database before deploying new code
-- =============================================

-- Step 1: Enable pgvector (should already be enabled on Neon)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Backup check - verify current state
DO $$ 
BEGIN
    RAISE NOTICE '=== Current Vector Dimension ===';
END $$;

SELECT 
    'rag_embeddings' as table_name,
    atttypmod as current_dimension,
    (SELECT COUNT(*) FROM rag_embeddings) as row_count
FROM pg_attribute
WHERE attrelid = 'rag_embeddings'::regclass AND attname = 'embedding';

-- Step 3: Drop old indexes
DROP INDEX IF EXISTS idx_rag_embeddings_vector CASCADE;
DROP INDEX IF EXISTS rag_embeddings_embedding_idx CASCADE;

-- Step 4: Clear incompatible data (768d embeddings won't work with 1536d)
TRUNCATE TABLE rag_embeddings CASCADE;

-- Step 5: Alter column to 1536 dimensions
ALTER TABLE rag_embeddings 
ALTER COLUMN embedding TYPE vector(1536);

-- Step 6: Create HNSW index (best for 1536d, Neon supports this)
CREATE INDEX idx_rag_embeddings_vector 
ON rag_embeddings USING hnsw (embedding vector_cosine_ops);

-- Step 7: Update semantic_search function
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

-- Step 8: Migrate rag_employee_profiles if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rag_employee_profiles') THEN
        DROP INDEX IF EXISTS rag_employee_profiles_embedding_idx;
        TRUNCATE TABLE rag_employee_profiles;
        ALTER TABLE rag_employee_profiles ALTER COLUMN embedding TYPE vector(1536);
        CREATE INDEX rag_employee_profiles_embedding_idx 
        ON rag_employee_profiles USING hnsw (embedding vector_cosine_ops);
        RAISE NOTICE '✅ rag_employee_profiles migrated to 1536d';
    END IF;
END $$;

-- Step 9: Migrate rag_role_requirements if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rag_role_requirements') THEN
        DROP INDEX IF EXISTS rag_role_requirements_embedding_idx;
        TRUNCATE TABLE rag_role_requirements;
        ALTER TABLE rag_role_requirements ALTER COLUMN embedding TYPE vector(1536);
        CREATE INDEX rag_role_requirements_embedding_idx 
        ON rag_role_requirements USING hnsw (embedding vector_cosine_ops);
        RAISE NOTICE '✅ rag_role_requirements migrated to 1536d';
    END IF;
END $$;

-- Step 10: Verification
DO $$ 
BEGIN
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE '✅ Vector dimension: 1536';
    RAISE NOTICE '✅ Index type: HNSW';
    RAISE NOTICE '⚠️  All old embeddings cleared (will regenerate on demand)';
END $$;

-- Final verification query
SELECT 
    'rag_embeddings' as table_name,
    atttypmod as new_dimension,
    (SELECT COUNT(*) FROM rag_embeddings) as row_count,
    (SELECT indexdef FROM pg_indexes WHERE tablename = 'rag_embeddings' AND indexname = 'idx_rag_embeddings_vector') as index_definition
FROM pg_attribute
WHERE attrelid = 'rag_embeddings'::regclass AND attname = 'embedding';
