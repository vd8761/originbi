-- ============================================================
-- Migration 030: IAT Module Sets
--
-- A "Module Set" is a named, reusable collection of IAT modules.
--   iat.module_sets:
--     [ { "id": "<uuid>", "name": "Core Bias", "moduleIds": [1,2,3] } ]
--
-- Routing (which scope gets which set) is NOT a separate setting - it is
-- merged into the Level-3 scope rules (levels.level3_scope_rules), where each
-- rule carries an optional "moduleSetId". The same rule that decides WHO gets
-- Level 3 also decides WHICH module set they receive.
-- See IatEligibilityService.filterModulesForRegistration.
--
-- Semantics:
--   - A module in a set referenced by >=1 level-3 rule is "assigned" and only
--     given when a matching rule's set contains it.
--   - A module in no referenced set is "global" (given to everyone).
--   - No rules / no rule names a set => all active modules to everyone.
-- ============================================================

INSERT INTO originbi_settings (category, setting_key, value_type, value_json, label, description, display_order)
VALUES ('iat', 'module_sets', 'json',
        '[]'::jsonb,
        'IAT Module Sets',
        'Named, reusable collections of IAT modules. Each set has a name and a list of module ids. A set is assigned to candidates by picking it on a Level-3 scope rule (Levels settings).',
        39)
ON CONFLICT (category, setting_key) DO NOTHING;

-- Routing moved into levels.level3_scope_rules: remove the standalone setting
-- if a prior version of this migration created it.
DELETE FROM originbi_settings
 WHERE category = 'iat' AND setting_key = 'module_scope_rules';
