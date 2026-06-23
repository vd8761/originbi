/**
 * Read-only DB explorer for the Pure-Trait rollout.
 * ------------------------------------------------------
 * Dumps the trait-related tables and the Level-1 DISC score scale so we can
 * design the dynamic "pure trait" threshold. SELECT-only; never writes.
 *
 * Run from repo root:
 *   node --experimental-vm-modules database/scripts/explore_traits_db.js
 * (pg is resolved from backend/node_modules via NODE_PATH below.)
 */
const path = require('path');
// Resolve `pg` from the backend workspace where it is installed.
const { Client } = require(path.join(
  __dirname,
  '..',
  '..',
  'backend',
  'node_modules',
  'pg',
));

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'originbi',
};

function hr(title) {
  console.log('\n' + '═'.repeat(78) + '\n  ' + title + '\n' + '═'.repeat(78));
}

async function q(client, label, sql, params = []) {
  try {
    const res = await client.query(sql, params);
    console.log(`\n• ${label}  (${res.rowCount} rows)`);
    console.table(res.rows);
    return res.rows;
  } catch (e) {
    console.log(`\n• ${label} → ERROR: ${e.message}`);
    return [];
  }
}

(async () => {
  const client = new Client(cfg);
  await client.connect();
  console.log(`Connected to ${cfg.host}:${cfg.port}/${cfg.database} (read-only use)`);

  hr('1. personality_traits (drives dashboard + dominant_trait_id lookup)');
  await q(
    client,
    'all rows',
    `SELECT id, code, blended_style_name, color_rgb, is_active, is_deleted,
            jsonb_object_keys_count(metadata) AS meta_keys
     FROM (
       SELECT *, (SELECT count(*) FROM jsonb_object_keys(metadata)) AS _ FROM personality_traits
     ) t` ,
  ).catch(() => {});
  // Fallback simple select (the fancy one may fail if metadata is null)
  await q(
    client,
    'all rows (simple)',
    `SELECT id, code, blended_style_name, color_rgb, is_active, is_deleted
     FROM personality_traits ORDER BY id`,
  );
  await q(
    client,
    'sample metadata (first 3)',
    `SELECT code, jsonb_pretty(metadata) AS metadata FROM personality_traits
     WHERE metadata IS NOT NULL AND metadata::text <> '{}' ORDER BY id LIMIT 3`,
  );

  hr('2. aci_traits (the table you pointed me to)');
  await q(
    client,
    'all rows',
    `SELECT id, trait_code, trait_title,
            length(short_summary) AS summary_len,
            length(detailed_overview) AS overview_len,
            length(personalized_insight) AS insight_len,
            length(score_overview_interpretation) AS score_interp_len,
            is_active, is_deleted
     FROM aci_traits ORDER BY id`,
  );

  hr('3. aci_values (the 5 ACI dimensions)');
  await q(client, 'all rows', `SELECT * FROM aci_values ORDER BY display_order`);

  hr('4. assessment_levels (find Level 1 / DISC)');
  await q(
    client,
    'levels',
    `SELECT id, name, level_number, pattern_type, total_questions, is_active
     FROM assessment_levels ORDER BY level_number`,
  ).catch(() => {});
  // schema may differ - try a loose select
  await q(
    client,
    'levels (loose)',
    `SELECT * FROM assessment_levels ORDER BY 1 LIMIT 20`,
  );

  hr('5. DISC option score scale (is score_value ~1 per pick?)');
  await q(
    client,
    'distinct score_value on options',
    `SELECT score_value, count(*) AS options
     FROM assessment_question_options
     GROUP BY score_value ORDER BY score_value`,
  );
  await q(
    client,
    'distinct disc_factor on options',
    `SELECT disc_factor, count(*) AS options
     FROM assessment_question_options
     GROUP BY disc_factor ORDER BY 1`,
  );

  hr('6. Real disc_scores ranges from COMPLETED Level-1 attempts');
  await q(
    client,
    'disc total distribution',
    `SELECT
        count(*) AS attempts,
        min((metadata->'disc_scores'->>'total')::numeric) AS min_total,
        round(avg((metadata->'disc_scores'->>'total')::numeric),1) AS avg_total,
        max((metadata->'disc_scores'->>'total')::numeric) AS max_total
     FROM assessment_attempts
     WHERE status='COMPLETED' AND metadata ? 'disc_scores'
       AND metadata->'disc_scores' ? 'total'`,
  );
  await q(
    client,
    'sample disc_scores (10)',
    `SELECT id, dominant_trait_id,
            metadata->'disc_scores' AS disc_scores,
            max_score_snapshot
     FROM assessment_attempts
     WHERE status='COMPLETED' AND metadata ? 'disc_scores'
     ORDER BY completed_at DESC NULLS LAST LIMIT 10`,
  );

  hr('7. How many DISC answers per attempt (real question count)');
  await q(
    client,
    'answers-per-attempt distribution (Level-1 attempts, top 20)',
    `SELECT a.assessment_attempt_id, count(*) AS answers
     FROM assessment_answers a
     JOIN assessment_attempts at ON at.id = a.assessment_attempt_id
     WHERE at.metadata ? 'disc_scores'
     GROUP BY a.assessment_attempt_id
     ORDER BY a.assessment_attempt_id DESC LIMIT 20`,
  );

  hr('8. Current dominant_trait_id spread (any single-letter codes already?)');
  await q(
    client,
    'dominant trait code usage',
    `SELECT pt.code, count(*) AS attempts
     FROM assessment_attempts at
     JOIN personality_traits pt ON pt.id = at.dominant_trait_id
     WHERE at.dominant_trait_id IS NOT NULL
     GROUP BY pt.code ORDER BY attempts DESC`,
  );

  await client.end();
  console.log('\nDone. (no writes performed)');
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
