-- ============================================================
-- Migration 017: turn the Level 3 placeholder into the Metaphor level
-- and enable it.
--
-- NOTE: is_mandatory is a GLOBAL flag - once true, EVERY new registration
-- (all programs) gets a Level 3 attempt. For a cohort trial, turn it on
-- before the cohort registers and off afterwards. The generation is gated
-- and non-fatal, so toggling it never breaks Level 1/2.
-- ============================================================

UPDATE assessment_levels
SET name              = 'Metaphor',
    description        = 'Level 3 - Metaphor. Image-based, voice-answered assessment.',
    pattern_type      = 'METAPHOR',
    duration_minutes  = 20,
    unlock_after_hours = 0,   -- unlock immediately after the previous level completes
    is_mandatory      = true,
    updated_at        = NOW()
WHERE level_number = 3;

-- Level 4 stays a disabled placeholder (untouched).
