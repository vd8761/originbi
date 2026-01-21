-- =============================================
-- pgvector RAG Tables for OriginBI
-- =============================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. RAG Documents Table
-- Stores raw text chunks for retrieval
-- =============================================
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    category VARCHAR(50),          -- 'candidate', 'role', 'course', 'question'
    source_table VARCHAR(100),     -- Original table name (e.g., 'registrations')
    source_id BIGINT,              -- Original row ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. RAG Embeddings Table
-- Stores vector embeddings (1024 dimensions for Jina v3)
-- =============================================
CREATE TABLE IF NOT EXISTS rag_embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
    embedding vector(1024),        -- Jina embeddings v3 dimension
    model VARCHAR(100) DEFAULT 'jina-embeddings-v3',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. Indexes for Fast Search
-- =============================================
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_vector 
ON rag_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_rag_documents_category ON rag_documents(category);

-- Index for source lookup
CREATE INDEX IF NOT EXISTS idx_rag_documents_source ON rag_documents(source_table, source_id);

-- =============================================
-- 4. Helper Function: Semantic Search
-- =============================================
CREATE OR REPLACE FUNCTION semantic_search(
    query_embedding vector(1024),
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

-- =============================================
-- 5. Sample Data Categories (Reference)
-- =============================================
-- Categories to use:
-- 'candidate' - Employee/Candidate profiles from registrations
-- 'role' - Career roles from career_roles table
-- 'course' - Courses from trait_based_course_details
-- 'question' - Assessment questions
-- 'tool' - Tools from career_role_tools
