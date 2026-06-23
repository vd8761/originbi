-- ============================================================
-- Migration 031: Corporate-bias IAT modules (set of 6)
--
-- Adds Modules: Leadership Potential, Performance Reputation,
-- Diversity & Inclusion, Communication Style, Authority & Challenge,
-- Innovation & Change. Each module has two TARGET categories and two
-- ATTRIBUTE categories (5 flash-words each), mapped onto the existing
-- iat_modules / iat_stimuli structure (see migration 020).
--
-- For each module the "compatible" pairing is the stereotype-consistent
-- association; the trial generator derives the 7-part block sequence from
-- left/right_concept_key + compatible_left/right_keys.
--
-- module_order 7..12 (continues after the migration-020 set).
-- is_active = true so they appear in the IAT Module Sets picker; until they
-- are routed via iat.module_scope_rules they are "global" (given to everyone).
--
-- Re-runnable: modules upsert by code; stimuli are cleared for these codes
-- before re-insert.
-- ============================================================
BEGIN;

INSERT INTO iat_modules
    (code, name, display_name, module_order, left_concept_key, right_concept_key,
     compatible_left_keys, compatible_right_keys, incompatible_left_keys, incompatible_right_keys,
     slowed_on_description)
VALUES
    ('leadership_potential', 'Leadership Potential Bias', 'Leadership Potential', 7,
     'emerging', 'established',
     '["emerging","operational_cap"]', '["established","strategic_cap"]',
     '["established","operational_cap"]', '["emerging","strategic_cap"]',
     'emerging leaders + strategic capability pairings'),

    ('performance_reputation', 'Performance Reputation Bias', 'Performance Reputation', 8,
     'low_visibility', 'high_visibility',
     '["low_visibility","average_performance"]', '["high_visibility","high_performance"]',
     '["high_visibility","average_performance"]', '["low_visibility","high_performance"]',
     'low visibility + high performance pairings'),

    ('diversity_inclusion', 'Diversity & Inclusion Bias', 'Diversity & Inclusion', 9,
     'female', 'male',
     '["female","support_functions"]', '["male","exec_leadership"]',
     '["male","support_functions"]', '["female","exec_leadership"]',
     'female professionals + executive leadership pairings'),

    ('communication_style', 'Communication Style Bias', 'Communication Style', 10,
     'reserved', 'assertive',
     '["reserved","technical_expertise"]', '["assertive","leadership_traits"]',
     '["assertive","technical_expertise"]', '["reserved","leadership_traits"]',
     'reserved communicators + leadership traits pairings'),

    ('authority_challenge', 'Authority & Challenge Bias', 'Authority & Challenge', 11,
     'team_contributors', 'senior_authority',
     '["team_contributors","open_to_feedback"]', '["senior_authority","always_correct"]',
     '["senior_authority","open_to_feedback"]', '["team_contributors","always_correct"]',
     'senior authority + open to feedback pairings'),

    ('innovation_change', 'Innovation & Change Bias', 'Innovation & Change', 12,
     'innovation', 'stability',
     '["innovation","business_risk"]', '["stability","business_success"]',
     '["stability","business_risk"]', '["innovation","business_success"]',
     'innovation + business success pairings')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    module_order = EXCLUDED.module_order,
    left_concept_key = EXCLUDED.left_concept_key,
    right_concept_key = EXCLUDED.right_concept_key,
    compatible_left_keys = EXCLUDED.compatible_left_keys,
    compatible_right_keys = EXCLUDED.compatible_right_keys,
    incompatible_left_keys = EXCLUDED.incompatible_left_keys,
    incompatible_right_keys = EXCLUDED.incompatible_right_keys,
    slowed_on_description = EXCLUDED.slowed_on_description,
    is_active = true,
    is_deleted = false,
    updated_at = NOW();

-- Idempotency: clear any prior stimuli for these modules before re-seeding.
DELETE FROM iat_stimuli
 WHERE module_id IN (
   SELECT id FROM iat_modules WHERE code IN (
     'leadership_potential','performance_reputation','diversity_inclusion',
     'communication_style','authority_challenge','innovation_change'
   )
 );

WITH seed(code, concept_key, words) AS (
    VALUES
    -- Module 1 - Leadership Potential Bias
    ('leadership_potential','emerging',ARRAY['High-Potential','Successor','Innovator','Change-Agent','Growth-Mindset']),
    ('leadership_potential','established',ARRAY['Executive','Veteran','Senior-Leader','Director','Authority']),
    ('leadership_potential','strategic_cap',ARRAY['Visionary','Influential','Decisive','Architect','Transformational']),
    ('leadership_potential','operational_cap',ARRAY['Executor','Coordinator','Maintainer','Administrator','Supporter']),
    -- Module 2 - Performance Reputation Bias
    ('performance_reputation','high_visibility',ARRAY['Presenter','Stakeholder-Facing','Influencer','Networked','Recognised']),
    ('performance_reputation','low_visibility',ARRAY['Specialist','Analyst','Contributor','Technical','Individual']),
    ('performance_reputation','high_performance',ARRAY['Exceptional','Impactful','Valuable','Strategic','Elite']),
    ('performance_reputation','average_performance',ARRAY['Routine','Standard','Adequate','Replaceable','Baseline']),
    -- Module 3 - Diversity & Inclusion Bias
    ('diversity_inclusion','female',ARRAY['Priya','Ananya','Kavya','Deepika','Meera']),
    ('diversity_inclusion','male',ARRAY['Rahul','Arjun','Vikram','Amit','Karan']),
    ('diversity_inclusion','exec_leadership',ARRAY['Boardroom','Strategy','Ownership','Expansion','Governance']),
    ('diversity_inclusion','support_functions',ARRAY['Coordination','Assistance','Administration','Documentation','Facilitation']),
    -- Module 4 - Communication Style Bias
    ('communication_style','assertive',ARRAY['Persuasive','Confident','Vocal','Influential','Charismatic']),
    ('communication_style','reserved',ARRAY['Reflective','Thoughtful','Quiet','Deliberate','Measured']),
    ('communication_style','leadership_traits',ARRAY['Strategic','Visionary','Decisive','Authority','Executive']),
    ('communication_style','technical_expertise',ARRAY['Analyst','Engineer','Specialist','Architect','Researcher']),
    -- Module 5 - Authority & Challenge Bias
    ('authority_challenge','senior_authority',ARRAY['CEO','Vice-President','Director','Executive','Chairman']),
    ('authority_challenge','team_contributors',ARRAY['Associate','Specialist','Coordinator','Analyst','Consultant']),
    ('authority_challenge','always_correct',ARRAY['Infallible','Final','Absolute','Certain','Unquestionable']),
    ('authority_challenge','open_to_feedback',ARRAY['Discussed','Challenged','Reviewed','Debated','Improved']),
    -- Module 6 - Innovation & Change Bias
    ('innovation_change','innovation',ARRAY['Transformation','Disruption','Experimentation','Agility','Reinvention']),
    ('innovation_change','stability',ARRAY['Consistency','Predictability','Governance','Process','Control']),
    ('innovation_change','business_success',ARRAY['Growth','Competitive-Advantage','Opportunity','Expansion','Value']),
    ('innovation_change','business_risk',ARRAY['Failure','Uncertainty','Exposure','Loss','Disruption'])
)
INSERT INTO iat_stimuli (module_id, concept_key, word, display_order)
SELECT m.id, seed.concept_key, word, ord
FROM seed
JOIN iat_modules m ON m.code = seed.code
CROSS JOIN LATERAL unnest(seed.words) WITH ORDINALITY AS w(word, ord);

COMMIT;
