-- ============================================================
-- Migration 026: Rename the stale "Level 4 (TBD)" placeholder.
--
-- Migration 025 moved the old disabled Level-4 placeholder to
-- level_number 5 (to free slot 4 for Metaphor), but left its name as
-- "Level 4 (TBD)". That is now misleading — Level 4 is Metaphor. Rename
-- the placeholder to match its actual level number. Cosmetic + idempotent.
-- ============================================================

UPDATE assessment_levels
SET name        = 'Level 5 (TBD)',
    description = 'Placeholder for Level 5.',
    sort_order  = 5,
    updated_at  = NOW()
WHERE level_number = 5
  AND UPPER(COALESCE(pattern_type, '')) = 'TBD';
