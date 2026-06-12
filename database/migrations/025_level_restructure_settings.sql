-- ============================================================
-- Migration 025: Split ACI and IAT Gen into separate levels +
--                per-level enable / scope settings.
--
-- New ladder:
--   Level 1 - Behavioral (DISC)   [unchanged]
--   Level 2 - ACI                 [always ACI now; no replacement]
--   Level 3 - IAT Gen             [promoted from a Level-2 replacement]
--   Level 4 - Metaphor            [moved down from Level 3]
--
-- Additive + idempotent. Mutates existing level rows in place (never
-- recreates) so existing attempts' assessment_level_id stays valid.
-- Existing in-flight registrations are NOT backfilled — the new levels
-- apply to NEW registrations only.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Re-number the levels.
--    Order matters:
--      (a) move the existing disabled Level-4 placeholder out to 5,
--      (b) move Metaphor 3 -> 4 (into the freed slot),
--      (c) insert the new IAT Gen row at level_number 3.
-- ------------------------------------------------------------

-- 1pre. A disabled "Level 4" placeholder row exists from migration 017.
--       Bump it to level_number 5 so Metaphor can take slot 4. Skip if the
--       row at 4 is already Metaphor (idempotent re-run) and skip if a row 5
--       already exists.
UPDATE assessment_levels
SET level_number = 5,
    sort_order   = 5,
    updated_at   = NOW()
WHERE level_number = 4
  AND UPPER(COALESCE(pattern_type, '')) <> 'METAPHOR'
  AND LOWER(COALESCE(name, '')) NOT LIKE '%metaphor%'
  AND NOT EXISTS (SELECT 1 FROM assessment_levels WHERE level_number = 5);

-- 1a. Move Metaphor: level 3 -> level 4.
UPDATE assessment_levels
SET level_number = 4,
    sort_order   = 4,
    updated_at   = NOW()
WHERE level_number = 3
  AND (UPPER(COALESCE(pattern_type, '')) = 'METAPHOR'
       OR LOWER(COALESCE(name, '')) LIKE '%metaphor%');

-- 1b. Insert Level 3 = IAT Gen (only if it does not already exist).
--     is_mandatory is false: who-gets-this is now driven by the
--     levels.* settings below, not the global mandatory flag.
INSERT INTO assessment_levels
    (level_number, name, description, pattern_type,
     unlock_after_hours, sort_order, is_mandatory, created_at, updated_at)
SELECT 3, 'IAT Gen',
       'Level 3 — IAT Gen. Implicit Association Test measuring instinctive bias patterns.',
       'IAT_GEN', 0, 3, false, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM assessment_levels
    WHERE level_number = 3
       OR UPPER(COALESCE(pattern_type, '')) = 'IAT_GEN'
);

-- 1c. Normalize the IAT row in case it already existed under another shape.
UPDATE assessment_levels
SET name         = 'IAT Gen',
    pattern_type = 'IAT_GEN',
    level_number = 3,
    sort_order   = 3,
    updated_at   = NOW()
WHERE UPPER(COALESCE(pattern_type, '')) = 'IAT_GEN';

-- ------------------------------------------------------------
-- 2. New settings category 'levels': enable flag + scope rules per level.
--    Scope-rule shape: {"rules":[{ "programIds":[], "departmentDegreeIds":[],
--    "departmentIds":[], "studentBoards":[] }]}. Empty rules + enabled =
--    applies to everyone. A registration matches a rule when the program
--    matches AND at least one selected department / department-degree / board
--    condition matches (see LevelEligibilityService).
-- ------------------------------------------------------------

-- Level 1 — Behavioral
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('levels', 'level1_enabled', 'boolean', true,
        'Level 1 — Behavioral (enabled)', 'Enable the Level 1 Behavioral (DISC) assessment.', 1)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('levels', 'level1_scope_rules', 'json', '{"rules":[]}'::jsonb,
        'Level 1 — Behavioral (scope)',
        'Restrict Level 1 to selected programs / departments / boards. Empty = everyone.', 2)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Level 2 — ACI
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('levels', 'level2_enabled', 'boolean', true,
        'Level 2 — ACI (enabled)', 'Enable the Level 2 ACI assessment.', 3)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('levels', 'level2_scope_rules', 'json', '{"rules":[]}'::jsonb,
        'Level 2 — ACI (scope)',
        'Restrict Level 2 to selected programs / departments / boards. Empty = everyone.', 4)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Level 3 — IAT Gen (off by default; opt-in)
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('levels', 'level3_enabled', 'boolean', false,
        'Level 3 — IAT Gen (enabled)', 'Enable the Level 3 IAT Gen assessment.', 5)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('levels', 'level3_scope_rules', 'json', '{"rules":[]}'::jsonb,
        'Level 3 — IAT Gen (scope)',
        'Restrict Level 3 to selected programs / departments / boards. Empty = everyone.', 6)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Level 4 — Metaphor. Default enabled-state mirrors the metaphor level's
-- current is_mandatory flag so behaviour is preserved.
INSERT INTO originbi_settings (category, setting_key, value_type, value_boolean, label, description, display_order)
VALUES ('levels', 'level4_enabled', 'boolean',
        COALESCE((SELECT is_mandatory FROM assessment_levels
                  WHERE level_number = 4
                     OR UPPER(COALESCE(pattern_type, '')) = 'METAPHOR'
                  LIMIT 1), true),
        'Level 4 — Metaphor (enabled)', 'Enable the Level 4 Metaphor assessment.', 7)
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('levels', 'level4_scope_rules', 'json', '{"rules":[]}'::jsonb,
        'Level 4 — Metaphor (scope)',
        'Restrict Level 4 to selected programs / departments / boards. Empty = everyone.', 8)
ON CONFLICT (category, setting_key) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Behaviour-preserving migration of the old IAT replacement config.
--    If IAT was enabled as a Level-2 replacement, carry those rules onto
--    Level 3 and turn Level 3 on so the same cohorts keep getting IAT —
--    now as its own level instead of replacing ACI.
-- ------------------------------------------------------------
UPDATE originbi_settings dst
SET value_json = src.value_json,
    updated_at = NOW()
FROM originbi_settings src
WHERE dst.category = 'levels'      AND dst.setting_key = 'level3_scope_rules'
  AND src.category = 'iat'         AND src.setting_key = 'level2_replacement_rules'
  AND src.value_json IS NOT NULL
  AND jsonb_array_length(COALESCE(src.value_json->'rules', '[]'::jsonb)) > 0;

UPDATE originbi_settings dst
SET value_boolean = true,
    updated_at = NOW()
FROM originbi_settings src
WHERE dst.category = 'levels' AND dst.setting_key = 'level3_enabled'
  AND src.category = 'iat'    AND src.setting_key = 'enabled'
  AND src.value_boolean = true;

-- 3a. Mark the now-deprecated IAT replacement settings read-only so they
--     can't be edited from the admin UI (kept for audit / rollback).
UPDATE originbi_settings
SET is_readonly = true,
    description = description || ' [DEPRECATED — replaced by the Levels settings in migration 025.]',
    updated_at  = NOW()
WHERE category = 'iat'
  AND setting_key IN ('enabled', 'level2_replacement_rules')
  AND is_readonly = false;
