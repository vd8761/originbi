/**
 * Validates the PLACEMENT / Level-1 family pure-trait surfaces:
 *   - specializationConstants.SPEC_MAP        (College Level-1 page 2 + cohort grid)
 *   - specializationConstants.HIGH_FACTOR_TEXT (cohort "High-Factor Trait Profiles")
 *   - collegeConstants.blendedTraits          (College Level-1 hero archetype)
 *   - specializationConstants.calculateDiscProfile  (cohort per-student code)
 *
 * Asserts: all 16 codes present; the 4 pure entries use the CANONICAL archetype
 * names (Bold Driver / Inspiring Motivator / Steadfast Anchor / Precise
 * Perfectionist) with NO DISC-letter copy; and that calculateDiscProfile is now a
 * thin delegate of the single-source resolver (the dynamic 50%-of-total rule),
 * NOT the old hardcoded `>= 20`.
 *
 * These modules import discTrait, so they are loaded from the COMPILED dist
 * (run `npx nest build` first), not transpiled from source.
 *
 * Run from repo root:  node database/scripts/validate_placement_trait_maps.js
 */
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIST = path.join(ROOT, 'backend', 'student-service', 'dist', 'report');

let spec, college, discTrait;
try {
  spec = require(path.join(DIST, 'reports', 'college', 'specializationConstants.js'));
  college = require(path.join(DIST, 'reports', 'college', 'collegeConstants.js'));
  discTrait = require(path.join(DIST, 'helpers', 'discTrait.js'));
} catch (e) {
  console.error('Could not load dist modules - run `npx nest build` in backend/student-service first.');
  console.error(e.message);
  process.exit(1);
}

const { SPEC_MAP, HIGH_FACTOR_TEXT, calculateDiscProfile } = spec;
const { blendedTraits } = college;
const { resolveDominantFactor } = discTrait;

const BLENDS = ['DI', 'DS', 'DC', 'ID', 'IS', 'IC', 'SD', 'SI', 'SC', 'CD', 'CI', 'CS'];
const PURE = ['D', 'I', 'S', 'C'];
const ALL16 = [...PURE, ...BLENDS];
const CANON = { D: 'Bold Driver', I: 'Inspiring Motivator', S: 'Steadfast Anchor', C: 'Precise Perfectionist' };
const BANNED = [/\((?:D|I|S|C)\)/, /\bPure (?:Dominance|Influence|Steadiness|Conscientiousness)\b/];

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
};
const noBanned = (label, blob) => {
  for (const re of BANNED) ok(!re.test(blob), `${label} free of banned pattern ${re}`);
};

console.log('SPEC_MAP (specialization fit)');
for (const code of ALL16) ok(!!SPEC_MAP[code], `has key ${code}`);
for (const code of PURE) {
  ok(SPEC_MAP[code] && SPEC_MAP[code].trait === CANON[code], `${code}.trait = "${CANON[code]}" (got "${SPEC_MAP[code] && SPEC_MAP[code].trait}")`);
  noBanned(`${code} SPEC_MAP entry`, JSON.stringify(SPEC_MAP[code] || {}));
}

console.log('\nHIGH_FACTOR_TEXT (cohort high-factor profiles)');
for (const code of PURE) {
  const t = HIGH_FACTOR_TEXT[code] || '';
  ok(t.startsWith(CANON[code]), `${code} text leads with "${CANON[code]}"`);
  noBanned(`${code} HIGH_FACTOR_TEXT`, t);
}

console.log('\nblendedTraits (Level-1 hero archetype)');
for (const code of ALL16) ok(!!blendedTraits[code], `has key ${code}`);
for (const code of PURE) {
  ok(blendedTraits[code] && blendedTraits[code].name === CANON[code], `${code}.name = "${CANON[code]}" (got "${blendedTraits[code] && blendedTraits[code].name}")`);
  noBanned(`${code} blendedTraits entry`, JSON.stringify(blendedTraits[code] || {}));
}

console.log('\ncalculateDiscProfile == single-source resolver (dynamic 50% rule, not >=20)');
const CASES = [
  { D: 1, I: 12, S: 7, C: 20 },   // pure C
  { D: 20, I: 10, S: 5, C: 5 },   // pure D (exact 50%)
  { D: 22, I: 16, S: 6, C: 8 },   // blend DI
  { D: 11, I: 10, S: 1, C: 0 },   // pure D under dynamic rule (11<20, 22>=22) - the OLD >=20 would have said "DI"
  { D: 6, I: 24, S: 17, C: 7 },   // blend IS
  { D: 10, I: 10, S: 10, C: 10 }, // blend CD (all equal)
];
for (const s of CASES) {
  const got = calculateDiscProfile(s);
  const want = resolveDominantFactor(s);
  ok(got === want, `calculateDiscProfile(${JSON.stringify(s)}) = ${got} == resolver ${want}`);
}
// explicit guard: the discriminating case must resolve PURE now
ok(calculateDiscProfile({ D: 11, I: 10, S: 1, C: 0 }) === 'D', 'dynamic rule active: 11/10/1/0 -> pure D (old hardcoded >=20 gave "DI")');

console.log(`\n${failures === 0 ? 'ALL PLACEMENT MAP TESTS PASSED' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
