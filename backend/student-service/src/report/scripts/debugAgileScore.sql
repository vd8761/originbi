-- =======================================================================================
-- SCRIPT: DEBUG AGILE SCORE CALCULATION
-- PURPOSE: Find out WHY a user's agile category scores are exceeding 25.
-- 
-- Possible Reasons:
-- 1. Does the user have MORE than 5 answered questions in a single category? (Duplicate answers)
-- 2. Are the 'score_value' weights for the options they selected higher than expected? (i.e. > 5)
-- 3. Are there overlapping/phantom answered records?
-- =======================================================================================

-- STEP 1: Find the User's Level 2 Assessment Attempt ID
-- (Replace 673 below with your target user_id)
WITH UserAttempt AS (
    SELECT id AS attempt_id
    FROM assessment_attempts 
    WHERE user_id = 673 
      AND assessment_level_id = 2 
      AND status = 'COMPLETED'
    LIMIT 1
)

-- STEP 2: Analyze the exact answers the user provided
-- This query breaks down the score question-by-question so you can spot the anomaly.
SELECT 
    q.category AS agile_category,
    q.id AS question_id,
    q.question_text AS question,
    
    -- Check how many times THIS specific question was answered
    COUNT(a.id) AS times_answered,
    
    -- What option(s) was chosen?
    STRING_AGG(o.option_text, '  |  ') AS selected_options,
    
    -- What score_value was assigned for the option(s) from the database?
    STRING_AGG(COALESCE(CAST(o.score_value AS VARCHAR), 'NULL'), '  |  ') AS raw_score_weights,
    
    -- Total score given for this question (If times_answered > 1, this sums all of them, which is BAD)
    COALESCE(SUM(o.score_value), 0) AS total_score_for_this_question

FROM assessment_answers a
JOIN assessment_questions q ON a.main_question_id = q.id
LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
WHERE a.assessment_attempt_id = (SELECT attempt_id FROM UserAttempt)
  -- Optional: Uncomment the next line to filter down to a single buggy category
  -- AND q.category = 'Courage'
GROUP BY 
    q.category,
    q.id,
    q.question_text
ORDER BY 
    q.category, 
    q.id;


-- =======================================================================================
-- STEP 3: Summary Validation (Optional, to see the exact counts/totals per category)
-- =======================================================================================
WITH UserAttempt AS (
    SELECT id AS attempt_id
    FROM assessment_attempts 
    WHERE user_id = 673 
      AND assessment_level_id = 2 
      AND status = 'COMPLETED'
    LIMIT 1
)
SELECT 
    q.category,
    COUNT(a.id) AS total_answered_questions_in_category,
    COALESCE(SUM(o.score_value), 0) AS raw_category_score
FROM assessment_answers a
JOIN assessment_questions q ON a.main_question_id = q.id
LEFT JOIN assessment_question_options o ON a.main_option_id = o.id
WHERE a.assessment_attempt_id = (SELECT attempt_id FROM UserAttempt)
GROUP BY 
    q.category
ORDER BY 
    q.category;
