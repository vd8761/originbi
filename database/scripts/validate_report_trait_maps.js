/**
 * Validates that the report content maps cover all 16 trait codes (12 blends + 4
 * pure) with no silent `|| 'DC'` fallback, that the 4 pure entries are
 * well-formed, and that no banned DISC-letter copy leaks into a pure entry.
 * Transpiles the real .ts constants (they have no imports).
 *
 * Covers: employee + cxo BLENDED_STYLE_MAPPING and school
 * SCHOOL_BLENDED_STYLE_MAPPING — the three headline-archetype maps that gained
 * pure keys. (School's IDENTITY_MAP / CAREER_DOMAIN_MAP / DUAL_ARCHETYPE and the
 * college CONTENT map stay top-two-blend / single-primary keyed by design and so
 * need no pure keys.)
 *
 * Run from repo root:  node database/scripts/validate_report_trait_maps.js
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

const SRC = path.join(ROOT, 'backend', 'student-service', 'src', 'report');
const { resolveDominantFactor } = loadTs(path.join(SRC, 'helpers', 'discTrait.ts'));

const BLENDS = ['DI', 'DS', 'DC', 'ID', 'IS', 'IC', 'SD', 'SI', 'SC', 'CD', 'CI', 'CS'];
const PURE = ['D', 'I', 'S', 'C'];
const ALL16 = [...PURE, ...BLENDS];

// Copy that must never appear inside a pure entry (no DISC letters / framework
// jargon in any title, description, or list item).
const BANNED = [
  /\((?:D|I|S|C)\)/,
  /\bPure (?:Dominance|Influence|Steadiness|Conscientiousness)\b/,
];

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
};

const EMP_FIELDS = ['style_name', 'style_desc', 'nature_suggestions', 'key_behaviours', 'typical_scenarios', 'trait_combinations'];
const SCHOOL_FIELDS = ['style_name', 'style_desc', 'nature_suggestions', 'key_behaviours', 'typical_scenarios', 'trait_mapping1', 'trait_mapping2'];

// Each map to validate: [label, file, export name, required pure-entry fields].
const MAPS = [
  ['employee BLENDED_STYLE_MAPPING', path.join(SRC, 'reports', 'employee', 'employeeConstants.ts'), 'BLENDED_STYLE_MAPPING', EMP_FIELDS],
  ['cxo BLENDED_STYLE_MAPPING', path.join(SRC, 'reports', 'cxo', 'cxoConstants.ts'), 'BLENDED_STYLE_MAPPING', EMP_FIELDS],
  ['school SCHOOL_BLENDED_STYLE_MAPPING', path.join(SRC, 'reports', 'school', 'schoolConstants.ts'), 'SCHOOL_BLENDED_STYLE_MAPPING', SCHOOL_FIELDS],
];

const loadedMaps = [];
for (const [label, file, exportName, fields] of MAPS) {
  console.log(`\n${label}`);
  const map = loadTs(file)[exportName];
  ok(!!map, `${exportName} is exported`);
  if (!map) continue;
  loadedMaps.push([label, map]);

  // 1. all 16 codes present
  for (const code of ALL16) ok(!!map[code], `has key ${code}`);

  // 2. pure entries well-formed + no DISC-letter leak anywhere in the entry
  for (const code of PURE) {
    const e = map[code] || {};
    for (const f of fields) {
      const v = e[f];
      const filled = Array.isArray(v) ? v.length > 0 : !!v;
      ok(filled, `${code}.${f} populated`);
    }
    const name = typeof e.style_name === 'string' ? e.style_name.replace(/^You are\s+/, '') : '';
    ok(!!name && !/\(?[DISC]\)/.test(name), `${code}.style_name has no DISC-letter ("${e.style_name}")`);
    const blob = JSON.stringify(e);
    for (const re of BANNED) ok(!re.test(blob), `${code} entry free of banned pattern ${re}`);
  }
}

// 3. resolver coverage: representative inputs (incl. pure-resolving) hit a key in
//    EVERY headline map (so no profile can fall through to a missing archetype).
console.log('\nresolver → map coverage (no missing keys, all maps)');
const SAMPLES = [
  { D: 1, I: 12, S: 7, C: 20 }, // -> C (pure)
  { D: 20, I: 10, S: 5, C: 5 }, // -> D (pure)
  { D: 5, I: 23, S: 6, C: 6 }, // -> I (pure)
  { D: 6, I: 7, S: 21, C: 6 }, // -> S (pure)
  { D: 22, I: 16, S: 6, C: 8 }, // -> DI (blend)
  { D: 6, I: 24, S: 17, C: 7 }, // -> IS (blend)
  { D: 5, I: 5, S: 12, C: 13 }, // -> CS (blend)
];
for (const [label, map] of loadedMaps) {
  for (const s of SAMPLES) {
    const code = resolveDominantFactor(s);
    ok(!!map[code], `[${label}] resolve(${JSON.stringify(s)}) = ${code} → key exists`);
  }
}

console.log(`\n${failures === 0 ? 'ALL MAP COVERAGE TESTS PASSED' : failures + ' FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
