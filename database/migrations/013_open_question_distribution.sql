-- ============================================================
-- Migration 013: Open Question Distribution (Level 1)
--
-- Adds an admin-configurable setting that controls how the
-- non-DISC "open" questions are selected for each Level-1
-- assessment, replacing the previously hard-coded "20 random
-- open questions" rule that lived in three separate services.
--
-- The value is a JSON array of groups. Each group:
--   questionType : open_questions.question_type to draw from
--                  (null/omitted = any active open question)
--   count        : how many questions to pick from this group
--   selection    : "random"         -> shuffled (ORDER BY RANDOM())
--                  "set_sequential" -> fixed order, no shuffle
--                                      (for linked/survey sets)
--
-- The questions picked across all groups are interleaved with the
-- DISC "main" questions in the existing 2 main : 1 open pattern.
--
-- DEFAULT below reproduces the LEGACY behaviour exactly
-- (20 random open questions, any type) so applying this migration
-- changes nothing until an admin edits it. To enable the MBA
-- "10 open + 10 survey" split, update this setting (UI or SQL), e.g.
--   [
--     {"questionType":"OPEN",  "count":10,"selection":"random"},
--     {"questionType":"SURVEY","count":10,"selection":"set_sequential"}
--   ]
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('assessment', 'open_question_distribution', 'json',
        '[{"questionType":null,"count":20,"selection":"random"}]'::jsonb,
        'Open Question Distribution (Level 1)',
        'How the non-DISC open questions are picked per Level-1 assessment. A list of groups: questionType (open_questions.question_type to draw from; null = any), count (how many to pick - this is the configurable count that appears in the exam), selection ("random" = shuffled, "set_sequential" = fixed order for linked survey sets). Picked questions are interleaved 2 main : 1 open. Example 10 + 10: [{"questionType":"OPEN","count":10,"selection":"random"},{"questionType":"SURVEY","count":10,"selection":"set_sequential"}].',
        10)
ON CONFLICT (category, setting_key) DO NOTHING;
