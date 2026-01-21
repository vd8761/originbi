-- OriginBI RAG Vector Store Migration
-- This creates the pgvector extension and tables for RAG functionality

-- Enable pgvector extension (requires superuser or extension installed on server)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the main embeddings table for RAG knowledge base
CREATE TABLE IF NOT EXISTS rag_embeddings (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1024),  -- Jina v3 uses 1024 dimensions
    metadata JSONB DEFAULT '{}',
    category VARCHAR(100),
    source_table VARCHAR(100),
    source_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS rag_embeddings_embedding_idx 
ON rag_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS rag_embeddings_category_idx ON rag_embeddings(category);
CREATE INDEX IF NOT EXISTS rag_embeddings_source_idx ON rag_embeddings(source_table, source_id);

-- Table to store indexed employee profiles for RAG
CREATE TABLE IF NOT EXISTS rag_employee_profiles (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id),
    full_name VARCHAR(255),
    profile_summary TEXT,
    total_score DECIMAL(5,2),
    suitability_level VARCHAR(50),
    suitable_roles TEXT[],
    embedding vector(1024),
    indexed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(registration_id)
);

-- Create index for employee embedding search
CREATE INDEX IF NOT EXISTS rag_employee_profiles_embedding_idx 
ON rag_employee_profiles 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Table to store role requirements for matching
CREATE TABLE IF NOT EXISTS rag_role_requirements (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    min_score INTEGER DEFAULT 70,
    required_traits TEXT[],
    embedding vector(1024),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_name)
);

-- Create index for role embedding search
CREATE INDEX IF NOT EXISTS rag_role_requirements_embedding_idx 
ON rag_role_requirements 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);

-- Function to update timestamp on modification
CREATE OR REPLACE FUNCTION update_rag_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS rag_embeddings_updated ON rag_embeddings;
CREATE TRIGGER rag_embeddings_updated
    BEFORE UPDATE ON rag_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_timestamp();

-- View to get employees with their assessment scores for RAG indexing
CREATE OR REPLACE VIEW rag_employee_data AS
SELECT 
    r.id as registration_id,
    r.full_name,
    r.mobile_number,
    r.email,
    ca.company_name,
    g.name as group_name,
    aa.total_score,
    aa.sincerity_index,
    aa.status as assessment_status,
    aa.completed_at,
    CASE 
        WHEN aa.total_score >= 85 THEN 'Highly Suitable'
        WHEN aa.total_score >= 75 THEN 'Suitable'
        WHEN aa.total_score >= 65 THEN 'Moderate Fit'
        ELSE 'Needs Development'
    END as suitability_level,
    CASE
        WHEN aa.total_score >= 75 THEN ARRAY['Team Lead', 'Project Manager', 'Senior Role']
        WHEN aa.total_score >= 70 THEN ARRAY['Software Engineer', 'Business Analyst', 'Technical Role']
        WHEN aa.total_score >= 65 THEN ARRAY['Customer Support', 'Operations', 'Administrative']
        ELSE ARRAY['Training', 'Entry Level']
    END as suggested_roles
FROM registrations r
LEFT JOIN assessment_attempts aa ON aa.registration_id = r.id AND aa.status = 'COMPLETED'
LEFT JOIN corporate_accounts ca ON r.corporate_account_id = ca.id
LEFT JOIN groups g ON r.group_id = g.id
WHERE r.full_name IS NOT NULL;

-- Insert default role requirements
INSERT INTO rag_role_requirements (role_name, role_description, min_score) VALUES
('Team Lead', 'Leadership role requiring strong decision-making and team motivation skills', 75),
('Software Engineer', 'Technical role requiring analytical thinking and problem-solving', 70),
('Sales Manager', 'Client-facing role requiring communication and influence skills', 80),
('Project Manager', 'Organizational role requiring planning and consistency', 75),
('HR Manager', 'People-focused role requiring interpersonal skills', 72),
('Marketing Manager', 'Creative role requiring communication and strategic thinking', 78),
('Data Scientist', 'Analytical role requiring attention to detail and logical reasoning', 72),
('Operations Manager', 'Process-focused role requiring organization and efficiency', 74),
('Customer Support', 'Service role requiring patience and steady performance', 65),
('Business Analyst', 'Analytical role requiring both technical and communication skills', 75)
ON CONFLICT (role_name) DO NOTHING;
