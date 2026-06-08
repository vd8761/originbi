-- ============================================================
-- VERIFY: Level 3 metaphor import (run after migrations 015 + 016).
-- All checks should read PASS. Read-only.
-- ============================================================
WITH q AS (
  SELECT * FROM metaphor_questions
  WHERE metadata->>'source' = 'metaphor_l3_v1' AND is_active = true AND is_deleted = false
)
SELECT * FROM (
  SELECT 1 AS n, 'total questions = 100' AS check_name,
         CASE WHEN COUNT(*) = 100 THEN 'PASS' ELSE 'FAIL' END AS status, COUNT(*)::text AS detail FROM q
  UNION ALL
  SELECT 2, '5 sets, 20 each',
         CASE WHEN COUNT(*) = 5 AND COUNT(*) FILTER (WHERE c <> 20) = 0 THEN 'PASS' ELSE 'FAIL' END,
         string_agg('set ' || set_number || '=' || c, ', ' ORDER BY set_number)
  FROM (SELECT set_number, COUNT(*) c FROM q GROUP BY set_number) s
  UNION ALL
  SELECT 3, 'question_number 1..20 within each set',
         CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END, bad::text || ' set(s) not 1..20'
  FROM (SELECT COUNT(*) bad FROM (
          SELECT set_number, MIN(question_number) mn, MAX(question_number) mx, COUNT(*) c
          FROM q GROUP BY set_number) x WHERE mn <> 1 OR mx <> 20 OR c <> 20) y
  UNION ALL
  SELECT 4, 'image_url matches /assets/images/<set>.<q>.webp',
         CASE WHEN COUNT(*) FILTER (WHERE image_url <> '/assets/images/' || set_number || '.' || question_number || '.webp') = 0
              THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE image_url <> '/assets/images/' || set_number || '.' || question_number || '.webp')::text || ' mismatched' FROM q
  UNION ALL
  SELECT 5, 'image_url unique (no collisions)',
         CASE WHEN COUNT(*) = COUNT(DISTINCT image_url) THEN 'PASS' ELSE 'FAIL' END,
         (COUNT(*) - COUNT(DISTINCT image_url))::text || ' duplicate(s)' FROM q
  UNION ALL
  SELECT 6, 'English fields present (desc/context/question)',
         CASE WHEN COUNT(*) FILTER (WHERE COALESCE(image_description_en,'')='' OR COALESCE(context_text_en,'')='' OR COALESCE(question_text_en,'')='') = 0
              THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE COALESCE(image_description_en,'')='' OR COALESCE(context_text_en,'')='' OR COALESCE(question_text_en,'')='')::text || ' missing' FROM q
  UNION ALL
  SELECT 7, 'Tamil fields present (desc/context/question)',
         CASE WHEN COUNT(*) FILTER (WHERE COALESCE(image_description_ta,'')='' OR COALESCE(context_text_ta,'')='' OR COALESCE(question_text_ta,'')='') = 0
              THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE COALESCE(image_description_ta,'')='' OR COALESCE(context_text_ta,'')='' OR COALESCE(question_text_ta,'')='')::text || ' missing' FROM q
  UNION ALL
  SELECT 8, 'metadata.dimension populated',
         CASE WHEN COUNT(*) FILTER (WHERE COALESCE(metadata->>'dimension','')='') = 0 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*) FILTER (WHERE COALESCE(metadata->>'dimension','')='')::text || ' missing' FROM q
  UNION ALL
  SELECT 9, 'metaphor settings present (incl image_base_url)',
         CASE WHEN COUNT(*) >= 11 THEN 'PASS' ELSE 'FAIL' END,
         COUNT(*)::text || ' setting rows' FROM originbi_settings WHERE category = 'metaphor'
) checks ORDER BY n;

-- Sample: final image URLs as the exam will build them (base + path).
SELECT q.set_number, q.question_number, q.image_url AS stored_path,
       COALESCE(NULLIF((SELECT value_string FROM originbi_settings WHERE category='metaphor' AND setting_key='image_base_url'), ''), '(blank -> relative)')
         || q.image_url AS final_url_preview
FROM metaphor_questions q
WHERE q.metadata->>'source' = 'metaphor_l3_v1'
ORDER BY q.set_number, q.question_number
LIMIT 3;
