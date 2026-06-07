-- ============================================================
-- VERIFY: MBA College Level-1 import
--
-- Run this AFTER mba_college_level1_questions.sql. It returns one row per
-- check with PASS / FAIL — read top-to-bottom, every status should be PASS.
-- Read-only: nothing here mutates data.
-- ============================================================

-- Resolve the program + level once for every check below.
WITH ctx AS (
  SELECT (SELECT id FROM programs           WHERE code = 'COLLEGE_STUDENT')         AS program_id,
         (SELECT id FROM assessment_levels  WHERE level_number = 1)                  AS level_id
),
-- Only the rows produced by THIS import batch.
qs AS (
  SELECT q.*
  FROM assessment_questions q, ctx
  WHERE q.program_id          = ctx.program_id
    AND q.assessment_level_id = ctx.level_id
    AND q.metadata->>'source' = 'mba_xlsx_v1'
    AND q.is_active = true
    AND q.is_deleted = false
),
opts AS (
  SELECT o.*
  FROM assessment_question_options o
  JOIN qs ON o.question_id = qs.id
)
SELECT * FROM (

  -- 1) Total questions = 120
  SELECT 1 AS n, 'total questions = 120' AS check_name,
         CASE WHEN COUNT(*) = 120 THEN 'PASS' ELSE 'FAIL' END AS status,
         COUNT(*)::text AS detail
  FROM qs
  UNION ALL
  -- 2) Total options = 480
  SELECT 2, 'total options = 480',
         CASE WHEN COUNT(*) = 480 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text
  FROM opts
  UNION ALL
  -- 3) Each set has exactly 40 questions
  SELECT 3, 'each set has 40 questions',
         CASE WHEN COUNT(*) FILTER (WHERE c <> 40) = 0 THEN 'PASS' ELSE 'FAIL' END,
         string_agg('set ' || set_number || '=' || c, ', ' ORDER BY set_number)
  FROM (SELECT set_number, COUNT(*) AS c FROM qs GROUP BY set_number) s
  UNION ALL
  -- 4) Every question has exactly 4 options
  SELECT 4, 'every question has 4 options',
         CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END,
         CASE WHEN bad = 0 THEN '0 offenders' ELSE bad::text || ' question(s) with !=4 options' END
  FROM (
    SELECT COUNT(*) AS bad
    FROM (SELECT question_id, COUNT(*) AS c FROM opts GROUP BY question_id) x
    WHERE c <> 4
  ) y
  UNION ALL
  -- 5) Every question's 4 disc_factors are exactly {D,I,S,C}
  SELECT 5, 'every question covers {D,I,S,C}',
         CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END,
         CASE WHEN bad = 0 THEN '0 offenders' ELSE bad::text || ' question(s) missing one of D/I/S/C' END
  FROM (
    SELECT COUNT(*) AS bad
    FROM (
      SELECT question_id, string_agg(disc_factor, '' ORDER BY disc_factor) AS s
      FROM opts
      GROUP BY question_id
    ) x
    WHERE s <> 'CDIS'
  ) y
  UNION ALL
  -- 6) disc_factor is always a single clean letter
  SELECT 6, 'disc_factor is a single D/I/S/C letter',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' bad option(s)'
  FROM opts
  WHERE disc_factor !~ '^[DISC]$'
  UNION ALL
  -- 7) score_value = 1.0 on every option (so DISC tally works)
  SELECT 7, 'score_value = 1.0 everywhere',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' option(s) with wrong score_value'
  FROM opts
  WHERE score_value IS DISTINCT FROM 1.0
  UNION ALL
  -- 8) category is NOT populated for Level 1 (reserved for Level 2 / ACI)
  SELECT 8, 'category is NULL for Level 1 (reserved for L2/ACI)',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' L1 question(s) with category set'
  FROM qs
  WHERE category IS NOT NULL AND category <> ''
  UNION ALL
  -- 9) Tamil columns populated on every question (en already required)
  SELECT 9, 'Tamil populated on every question (context_ta + question_ta as authored)',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' question(s) missing context_text_ta'
  FROM qs
  WHERE context_text_ta IS NULL OR context_text_ta = ''
  UNION ALL
  -- 10) Tamil populated on every option
  SELECT 10, 'Tamil populated on every option',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' option(s) missing option_text_ta'
  FROM opts
  WHERE option_text_ta IS NULL OR option_text_ta = ''
  UNION ALL
  -- 11) display_order on options is 1..4 within each question
  SELECT 11, 'display_order is 1..4 within each question',
         CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END,
         CASE WHEN bad = 0 THEN '0 offenders' ELSE bad::text || ' question(s) with bad display_order' END
  FROM (
    SELECT COUNT(*) AS bad
    FROM (
      SELECT question_id, string_agg(display_order::text, ',' ORDER BY display_order) AS s
      FROM opts GROUP BY question_id
    ) x
    WHERE s <> '1,2,3,4'
  ) y
  UNION ALL
  -- 12) Every option is correctly mapped to a question in THIS batch
  SELECT 12, 'every option maps to a question in this batch',
         CASE WHEN COUNT(*) = 480 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text
  FROM opts o JOIN qs q ON o.question_id = q.id
  UNION ALL
  -- 13) No orphan options pointing at a missing/deleted question
  SELECT 13, 'no orphan options',
         CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' orphan option(s)'
  FROM opts o
  LEFT JOIN assessment_questions q ON o.question_id = q.id
  WHERE q.id IS NULL OR q.is_deleted = true
  UNION ALL
  -- 14) Compound forced-choice factors (e.g. "C over D") survived in option metadata
  SELECT 14, 'Set 1 compound factors preserved in metadata.raw_factor',
         CASE WHEN COUNT(*) >= 14 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' options carry metadata.raw_factor'
  FROM opts o
  JOIN qs q ON o.question_id = q.id
  WHERE q.set_number = 1
    AND o.metadata ? 'raw_factor'

) checks
ORDER BY n;


-- ------------------------------------------------------------
-- Spot-check view: open in a client to eyeball Q -> options mapping.
-- Returns 3 questions (first one of each set) with all 4 options.
-- ------------------------------------------------------------
WITH ctx AS (
  SELECT (SELECT id FROM programs WHERE code = 'COLLEGE_STUDENT') AS program_id,
         (SELECT id FROM assessment_levels WHERE level_number = 1) AS level_id
),
sample AS (
  SELECT q.*
  FROM assessment_questions q, ctx
  WHERE q.program_id          = ctx.program_id
    AND q.assessment_level_id = ctx.level_id
    AND q.metadata->>'source' = 'mba_xlsx_v1'
    AND q.id IN (
      SELECT MIN(id) FROM assessment_questions q2, ctx
      WHERE q2.program_id          = ctx.program_id
        AND q2.assessment_level_id = ctx.level_id
        AND q2.metadata->>'source' = 'mba_xlsx_v1'
      GROUP BY set_number
    )
)
SELECT s.set_number,
       s.id                                   AS question_id,
       s.metadata->>'theme'                   AS theme,
       LEFT(COALESCE(s.context_text_en,''),60) AS context_en_60,
       s.question_text_en,
       o.display_order,
       o.disc_factor,
       o.score_value,
       LEFT(COALESCE(o.option_text_en,''),60) AS option_en_60,
       o.metadata->>'raw_factor'              AS raw_factor
FROM sample s
JOIN assessment_question_options o ON o.question_id = s.id
ORDER BY s.set_number, o.display_order;
