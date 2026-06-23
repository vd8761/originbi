/**
 * Phase 1 validation - Pure Traits.
 * --------------------------------------------------------------------------
 * 1. Applies migration 032_pure_traits.sql (idempotent).
 * 2. Asserts the 4 pure rows exist in personality_traits AND aci_traits.
 * 3. Runs a JS mirror of the Go resolver (disc_trait.go) against the SAME
 *    canonical cases the Go unit test uses - guarantees cross-language parity.
 * 4. Replays the rule over every COMPLETED Level-1 attempt and reports how many
 *    now resolve to a Pure Trait (informational).
 *
 * Exit code 0 = all assertions passed, 1 = a failure.
 *
 * Run from repo root:  node database/scripts/validate_pure_traits.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '..', '..', 'backend', 'node_modules', 'pg'));

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'originbi',
};

// ── JS mirror of backend/exam-engine/internal/service/disc_trait.go ──────────
const PRIORITY = { C: 0, D: 1, I: 2, S: 3 };
function resolveDominantFactor(scores) {
  const list = [];
  let total = 0;
  for (const f of ['D', 'I', 'S', 'C']) {
    if (Object.prototype.hasOwnProperty.call(scores, f) && scores[f] != null) {
      const v = Number(scores[f]);
      list.push({ factor: f, score: v });
      total += v;
    }
  }
  if (list.length === 0) return '';
  list.sort((a, b) =>
    a.score !== b.score ? b.score - a.score : PRIORITY[a.factor] - PRIORITY[b.factor],
  );
  const top = list[0];
  if (list.length === 1) return top.factor;
  if (top.score > 0 && total > 0) {
    if (top.score * 2 >= total) return top.factor;
    if (list.slice(1).every((r) => top.score / 2 > r.score)) return top.factor;
  }
  return top.factor + list[1].factor;
}

// Same table as disc_trait_test.go.
const CASES = [
  ['pure C exactly 50%', { D: 1, I: 12, S: 7, C: 20 }, 'C'],
  ['pure C above 50%', { D: 5, I: 6, S: 6, C: 23 }, 'C'],
  ['pure D exact 50%', { D: 20, I: 10, S: 5, C: 5 }, 'D'],
  ['pure D relative dominance', { D: 18, I: 8, S: 8, C: 6 }, 'D'],
  ['blend DI (att 1888)', { D: 22, I: 16, S: 6, C: 8 }, 'DI'],
  ['blend IS (att 1891)', { D: 6, I: 24, S: 17, C: 7 }, 'IS'],
  ['blend DI (att 1894)', { D: 27, I: 15, S: 9, C: 8 }, 'DI'],
  ['blend SD (att 1897)', { D: 19, I: 6, S: 25, C: 7 }, 'SD'],
  ['blend below boundary', { D: 19, I: 11, S: 5, C: 5 }, 'DI'],
  ['tie D=I -> DI', { D: 10, I: 10, S: 5, C: 5 }, 'DI'],
  ['tie second I=S -> CI', { D: 1, I: 11, S: 11, C: 18 }, 'CI'],
  ['all equal -> CD', { D: 10, I: 10, S: 10, C: 10 }, 'CD'],
  ['single factor', { C: 15 }, 'C'],
  ['empty', {}, ''],
  ['all zero -> CD', { D: 0, I: 0, S: 0, C: 0 }, 'CD'],
  ['missing factor', { I: 12, S: 7, C: 20 }, 'C'],
  ['ignores total key', { D: 22, I: 16, S: 6, C: 8, total: 52 }, 'DI'],
];

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
};

(async () => {
  const client = new Client(cfg);
  await client.connect();
  console.log(`Connected to ${cfg.host}:${cfg.port}/${cfg.database}\n`);

  console.log('1. Apply migration 032_pure_traits.sql (idempotent)');
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '032_pure_traits.sql'),
    'utf8',
  );
  await client.query(sql);
  console.log('   applied.\n');

  console.log('2. DB row assertions');
  // Forbidden: DISC-letter references like "(D)" or the old "Pure Dominance"
  // placeholders. (We never ban a lone "I" - it is also the English pronoun.)
  const BANNED = [/\((?:D|I|S|C)\)/, /\bPure (?:Dominance|Influence|Steadiness|Conscientiousness)\b/, /\bD\/I\/S\/C\b/];
  const scan = (label, text) => {
    const t = text || '';
    const hit = BANNED.find((re) => re.test(t));
    ok(!hit, `no DISC-letter reference in ${label}${hit ? ` (matched ${hit})` : ''}`);
  };

  const pt = await client.query(
    `SELECT code, blended_style_name, blended_style_desc, color_rgb FROM personality_traits
     WHERE code IN ('D','I','S','C') AND is_deleted = false ORDER BY code`,
  );
  ok(pt.rowCount === 4, `personality_traits has 4 pure rows (got ${pt.rowCount})`);
  for (const c of ['C', 'D', 'I', 'S']) {
    const r = pt.rows.find((x) => x.code === c);
    ok(!!r && !!r.blended_style_name && !!r.blended_style_desc && !!r.color_rgb,
      `personality_traits[${c}] populated = ${r ? r.blended_style_name + ' (' + r.color_rgb + ')' : 'MISSING'}`);
    if (r) { scan(`personality_traits[${c}].name`, r.blended_style_name); scan(`personality_traits[${c}].desc`, r.blended_style_desc); }
  }

  const at = await client.query(
    `SELECT trait_code, trait_title, personalized_insight, score_overview_interpretation FROM aci_traits
     WHERE trait_code IN ('D','I','S','C') AND is_deleted = false ORDER BY trait_code`,
  );
  ok(at.rowCount === 4, `aci_traits has 4 pure rows (got ${at.rowCount})`);
  for (const c of ['C', 'D', 'I', 'S']) {
    const r = at.rows.find((x) => x.trait_code === c);
    ok(!!r && !!r.trait_title && !!r.personalized_insight && !!r.score_overview_interpretation,
      `aci_traits[${c}] populated (title + insight + score_overview)`);
    if (r) { scan(`aci_traits[${c}].title`, r.trait_title); scan(`aci_traits[${c}].insight`, r.personalized_insight); scan(`aci_traits[${c}].score_overview`, r.score_overview_interpretation); }
  }

  console.log('\n3. Go/JS resolver parity (same 17 cases as disc_trait_test.go)');
  for (const [name, scores, want] of CASES) {
    const got = resolveDominantFactor(scores);
    ok(got === want, `${name} -> ${JSON.stringify(got)} (want ${JSON.stringify(want)})`);
  }

  console.log('\n4. Replay over COMPLETED Level-1 attempts (informational)');
  const att = await client.query(
    `SELECT metadata->'disc_scores' AS d FROM assessment_attempts
     WHERE status='COMPLETED' AND metadata ? 'disc_scores'`,
  );
  const dist = {};
  let pure = 0;
  for (const row of att.rows) {
    const code = resolveDominantFactor(row.d || {});
    dist[code] = (dist[code] || 0) + 1;
    if (code.length === 1 && code) pure++;
  }
  console.log(`   ${att.rowCount} attempts → ${pure} now resolve to a Pure Trait`);
  console.log('   new code distribution:', JSON.stringify(dist));

  await client.end();
  console.log(`\n${failures === 0 ? 'ALL VALIDATIONS PASSED' : failures + ' VALIDATION(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
