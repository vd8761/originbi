-- ============================================================
-- Migration 014: Survey support on open_questions
--
-- Adds set grouping + optional context to open_questions so the
-- new SURVEY question_type can be delivered set-based:
--   * set_number      : which survey set (1..5) a question belongs to
--   * context_text_en : optional scenario shown above the question (EN)
--   * context_text_ta : optional scenario shown above the question (TA)
--
-- Also switches the open-question distribution setting to the new
-- SURVEY rule: pick ONE random set, then N random questions from it
-- ("set_random"), scattered among the main questions.
-- ============================================================

ALTER TABLE open_questions
  ADD COLUMN IF NOT EXISTS set_number      smallint,
  ADD COLUMN IF NOT EXISTS context_text_en text,
  ADD COLUMN IF NOT EXISTS context_text_ta text;

COMMENT ON COLUMN open_questions.set_number IS 'Survey set this question belongs to (1..N). One set is chosen per assessment.';
COMMENT ON COLUMN open_questions.context_text_en IS 'Optional scenario/context shown above the question in the exam (English). NULL = no context block.';
COMMENT ON COLUMN open_questions.context_text_ta IS 'Optional scenario/context shown above the question in the exam (Tamil).';

-- Helps the per-set random pick.
CREATE INDEX IF NOT EXISTS idx_open_questions_type_set
  ON open_questions (question_type, set_number)
  WHERE is_active = true AND is_deleted = false;

-- Switch the distribution to the new SURVEY set-based rule.
-- count stays admin-configurable; selection 'set_random' = pick one random
-- set, then `count` random questions from that set.
UPDATE originbi_settings
SET value_json = '[{"questionType":"SURVEY","count":10,"selection":"set_random"}]'::jsonb,
    description = 'How the open (SURVEY) questions are picked per assessment. A list of groups: questionType (open_questions.question_type), count (how many appear in the exam — configurable), selection ("random" = N random of the type; "set_random" = pick ONE random set then N random within it; "set_sequential" = one set in fixed order). Picked questions are scattered among the main questions.',
    updated_at = NOW()
WHERE category = 'assessment' AND setting_key = 'open_question_distribution';
