/**
 * Validates the TypeScript DISC resolver
 * (backend/student-service/src/report/helpers/discTrait.ts) by transpiling the
 * REAL source and running the same canonical cases as the Go unit test
 * (disc_trait_test.go) — guaranteeing Go ⇄ TS parity.
 *
 * Why not jest? student-service pins jest@30 + ts-jest@29, which are
 * incompatible (jest rejects the ts-jest transformer), so `.spec.ts` files
 * cannot run today. This node script needs no transformer and runs anywhere.
 * If ts-jest is upgraded to a jest-30-compatible release, these cases can move
 * into a `discTrait.spec.ts` unchanged.
 *
 * Run from repo root:  node database/scripts/validate_disc_trait_ts.js
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..', '..');
const ts = require(path.join(ROOT, 'backend', 'node_modules', 'typescript'));

function loadTs(file) {
  const src = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: { module: 'CommonJS', target: 'ES2019', esModuleInterop: true },
    fileName: file,
  }).outputText;
  const m = new Module(file, module);
  m.filename = file;
  m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(out, file);
  return m.exports;
}

const {
  resolveDominantFactor,
  resolveHeadlineFromReportData,
  topTwoBlend,
  careerLookupCode,
  isPureTrait,
  splitTrait,
  PURE_CAREER_ROWS_AVAILABLE,
} = loadTs(
  path.join(ROOT, 'backend', 'student-service', 'src', 'report', 'helpers', 'discTrait.ts'),
);

const CASES = [
  ['pure C at exactly 50%', { D: 1, I: 12, S: 7, C: 20 }, 'C'],
  ['pure C above 50%', { D: 5, I: 6, S: 6, C: 23 }, 'C'],
  ['pure D at exact 50%', { D: 20, I: 10, S: 5, C: 5 }, 'D'],
  ['pure D via relative dominance', { D: 18, I: 8, S: 8, C: 6 }, 'D'],
  ['blend DI (att 1888)', { D: 22, I: 16, S: 6, C: 8 }, 'DI'],
  ['blend IS (att 1891)', { D: 6, I: 24, S: 17, C: 7 }, 'IS'],
  ['blend DI (att 1894)', { D: 27, I: 15, S: 9, C: 8 }, 'DI'],
  ['blend SD (att 1897)', { D: 19, I: 6, S: 25, C: 7 }, 'SD'],
  ['blend just below 50% boundary', { D: 19, I: 11, S: 5, C: 5 }, 'DI'],
  ['tie D=I -> DI', { D: 10, I: 10, S: 5, C: 5 }, 'DI'],
  ['tie on second I=S -> CI', { D: 1, I: 11, S: 11, C: 18 }, 'CI'],
  ['all equal -> CD', { D: 10, I: 10, S: 10, C: 10 }, 'CD'],
  ['single factor', { C: 15 }, 'C'],
  ['empty', {}, ''],
  ['all zero -> CD', { D: 0, I: 0, S: 0, C: 0 }, 'CD'],
  ['missing factor', { I: 12, S: 7, C: 20 }, 'C'],
  ['ignores extra total key', { D: 22, I: 16, S: 6, C: 8, total: 52 }, 'DI'],
];

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
};

console.log('resolveDominantFactor — 17 parity cases (mirror of disc_trait_test.go)');
for (const [name, scores, want] of CASES) {
  const got = resolveDominantFactor(scores);
  ok(got === want, `${name} -> ${JSON.stringify(got)} (want ${JSON.stringify(want)})`);
}

console.log('\ntopTwoBlend — always the 2-letter blend (career/compat lookups)');
const BLEND = [
  ['pure-C profile still blends to CI', { D: 1, I: 12, S: 7, C: 20 }, 'CI'],
  ['pure-D profile still blends to DI', { D: 20, I: 10, S: 5, C: 5 }, 'DI'],
  ['blend stays the blend', { D: 22, I: 16, S: 6, C: 8 }, 'DI'],
  ['single factor', { C: 15 }, 'C'],
  ['empty', {}, ''],
  ['all equal -> CD', { D: 10, I: 10, S: 10, C: 10 }, 'CD'],
];
for (const [name, scores, want] of BLEND) {
  ok(topTwoBlend(scores) === want, `${name} -> ${JSON.stringify(topTwoBlend(scores))} (want ${JSON.stringify(want)})`);
}

console.log('\ncareerLookupCode — pure students borrow their top-two blend (flag off)');
ok(PURE_CAREER_ROWS_AVAILABLE === false, 'PURE_CAREER_ROWS_AVAILABLE is false (fallback active)');
ok(careerLookupCode('C', { D: 1, I: 12, S: 7, C: 20 }) === 'CI', "careerLookupCode('C', ...) -> 'CI' (pure borrows top-two)");
ok(careerLookupCode('D', { D: 20, I: 10, S: 5, C: 5 }) === 'DI', "careerLookupCode('D', ...) -> 'DI'");
ok(careerLookupCode('DI', { D: 22, I: 16, S: 6, C: 8 }) === 'DI', "careerLookupCode('DI', ...) -> 'DI' (blend unchanged)");

console.log('\nresolveHeadlineFromReportData — engine code wins, then raw sums, then scores');
// 1. stored engine code is authoritative (even a pure code, even if scores disagree)
ok(
  resolveHeadlineFromReportData({ dominant_trait_code: 'D', score_D: 1, score_I: 99, score_S: 1, score_C: 1 }) === 'D',
  'stored dominant_trait_code wins over recompute',
);
// 2. no code -> resolve from the raw sums in most_answered_answer_type (engine input)
ok(
  resolveHeadlineFromReportData({
    most_answered_answer_type: [
      { ANSWER_TYPE: 'D', COUNT: 20 }, { ANSWER_TYPE: 'I', COUNT: 10 },
      { ANSWER_TYPE: 'S', COUNT: 5 }, { ANSWER_TYPE: 'C', COUNT: 5 },
    ],
  }) === 'D',
  'no code, raw sums 20/10/5/5 -> pure D (matches engine rule)',
);
ok(
  resolveHeadlineFromReportData({
    most_answered_answer_type: [
      { ANSWER_TYPE: 'D', COUNT: 22 }, { ANSWER_TYPE: 'I', COUNT: 16 },
      { ANSWER_TYPE: 'S', COUNT: 6 }, { ANSWER_TYPE: 'C', COUNT: 8 },
    ],
  }) === 'DI',
  'no code, raw sums 22/16/6/8 -> blend DI',
);
// 3. no code, <4 counts -> last-resort score path (ordering preserved)
ok(
  resolveHeadlineFromReportData({
    most_answered_answer_type: [{ ANSWER_TYPE: 'D', COUNT: 15 }, { ANSWER_TYPE: 'I', COUNT: 12 }],
    score_D: 85, score_I: 65, score_S: 25, score_C: 40,
  }) === 'DI',
  'no code, 2 counts -> falls back to scores -> DI (existing sample behaviour)',
);

console.log('\nisPureTrait / splitTrait helpers');
ok(isPureTrait('D') === true, "isPureTrait('D') === true");
ok(isPureTrait('DI') === false, "isPureTrait('DI') === false");
ok(isPureTrait('') === false, "isPureTrait('') === false");
ok(JSON.stringify(splitTrait('DI')) === JSON.stringify(['D', 'I']), "splitTrait('DI') === ['D','I']");
ok(JSON.stringify(splitTrait('D')) === JSON.stringify(['D', '']), "splitTrait('D') === ['D','']");

console.log(`\n${failures === 0 ? 'ALL TS RESOLVER TESTS PASSED' : failures + ' TEST(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
