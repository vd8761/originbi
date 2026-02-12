-- =============================================
-- Migration 003: Persistent Chat History
-- ChatGPT / Gemini-style conversation memory
-- =============================================

-- 1. Conversations table  (one per "thread")
CREATE TABLE IF NOT EXISTS chat_conversations (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,               -- users.id   (0 = anonymous)
    user_role   VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    title       VARCHAR(255) DEFAULT 'New Chat', -- auto-generated after first exchange
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. Messages table  (ordered within a conversation)
CREATE TABLE IF NOT EXISTS chat_messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,        -- 'user' | 'assistant'
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',          -- intent, searchType, confidence, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast look-ups
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
    ON chat_conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_role
    ON chat_conversations (user_id, user_role, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
    ON chat_messages (conversation_id, created_at ASC);

-- 4. Trigger: auto-update updated_at on chat_conversations
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_msg_update_conv ON chat_messages;
CREATE TRIGGER trg_chat_msg_update_conv
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Done!  Run:  psql -U postgres -d originbi -f database/migrations/003_chat_history.sql
