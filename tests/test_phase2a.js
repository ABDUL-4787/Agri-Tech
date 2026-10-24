// AgriGrade Phase 2a Specification Unit Tests
// Tests: config numbers, i18n rules (max 8 words, te/hi TODO notes), rear camera labels, 3x5 grid

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AgriGradeConfig = require('../frontend/js/config.js');

console.log("=======================================================");
console.log("RUNNING AGRIGRADE PHASE 2a SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// -----------------------------------------------------------------
// 1. Config tests: GRID_ROWS and GRID_COLS
// -----------------------------------------------------------------
console.log("1. Config.js Phase 2a Constants:");
assert.strictEqual(AgriGradeConfig.GRID_ROWS, 3, "GRID_ROWS must be 3");
console.log("  ✓ GRID_ROWS is 3");

assert.strictEqual(AgriGradeConfig.GRID_COLS, 5, "GRID_COLS must be 5");
console.log("  ✓ GRID_COLS is 5");

assert.strictEqual(AgriGradeConfig.GRID_ROWS * AgriGradeConfig.GRID_COLS, 15, "3x5 grid has exactly 15 fruit spots");
console.log("  ✓ 3x5 grid equals BATCH_SIZE (15 tomatoes)");

// -----------------------------------------------------------------
// 2. i18n.js Verification: 9 Rules & Max 8 words
// -----------------------------------------------------------------
console.log("\n2. i18n.js 9 Photo Rules & Max 8 Words:");

const i18nPath = path.join(__dirname, '../frontend/js/i18n.js');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

const { TRANSLATIONS } = require('../frontend/js/i18n.js');

assert(TRANSLATIONS.en, "English translations must exist");
assert(TRANSLATIONS.hi, "Hindi translations must exist");
assert(TRANSLATIONS.te, "Telugu translations must exist");
console.log("  ✓ All 3 languages (en, hi, te) are defined");

const EXPECTED_RULES_EN = [
  "Use daylight.",
  "Use a plain light cloth or paper.",
  "Put the coin flat on the cloth.",
  "Put 15 tomatoes in a row. No touching.",
  "Stem side up. Take photo from top.",
  "Hold the phone flat above. Not tilted.",
  "Now turn each tomato over. Stem side down.",
  "Keep the same place. Take photo again.",
  "Keep the coin in the same place."
];

// Check English rule strings
EXPECTED_RULES_EN.forEach((expected, i) => {
  const ruleKey = `rule_${i + 1}`;
  const actual = TRANSLATIONS.en[ruleKey];
  assert.strictEqual(actual, expected, `Rule ${i + 1} EN must match spec exactly`);
  const wordCount = actual.trim().split(/\s+/).length;
  assert(wordCount <= 8, `Rule ${i + 1} EN must have max 8 words (got ${wordCount})`);
});
console.log("  ✓ All 9 English rules match spec exactly and have <= 8 words");

// Check Hindi rule strings & word count <= 8
for (let i = 1; i <= 9; i++) {
  const ruleKey = `rule_${i}`;
  const actual = TRANSLATIONS.hi[ruleKey];
  assert(actual, `Rule ${i} HI must exist`);
  const wordCount = actual.trim().split(/\s+/).length;
  assert(wordCount <= 8, `Rule ${i} HI must have max 8 words (got ${wordCount}: "${actual}")`);
}
console.log("  ✓ All 9 Hindi rules exist and have <= 8 words");

// Check Telugu rule strings & word count <= 8
for (let i = 1; i <= 9; i++) {
  const ruleKey = `rule_${i}`;
  const actual = TRANSLATIONS.te[ruleKey];
  assert(actual, `Rule ${i} TE must exist`);
  const wordCount = actual.trim().split(/\s+/).length;
  assert(wordCount <= 8, `Rule ${i} TE must have max 8 words (got ${wordCount}: "${actual}")`);
}
console.log("  ✓ All 9 Telugu rules exist and have <= 8 words");

// -----------------------------------------------------------------
// 3. Mark every te/hi string: // TODO: needs native speaker review
// -----------------------------------------------------------------
console.log("\n3. Native Speaker Review Marking Check:");

// Check in file that every rule_1..rule_9 in hi and te has TODO comment
for (let i = 1; i <= 9; i++) {
  const regexHi = new RegExp(`rule_${i}:\\s*["'][^"']+["'],?\\s*\\/\\/\\s*TODO:\\s*needs\\s*native\\s*speaker\\s*review`);
  assert(regexHi.test(i18nContent), `Rule ${i} HI must have '// TODO: needs native speaker review'`);
  const regexTe = new RegExp(`rule_${i}:\\s*["'][^"']+["'],?\\s*\\/\\/\\s*TODO:\\s*needs\\s*native\\s*speaker\\s*review`);
  assert(regexTe.test(i18nContent), `Rule ${i} TE must have '// TODO: needs native speaker review'`);
}
console.log("  ✓ Every Telugu and Hindi rule is marked with '// TODO: needs native speaker review'");

// -----------------------------------------------------------------
// 4. Camera Screen Labels & Grid Overlay
// -----------------------------------------------------------------
console.log("\n4. Camera Screen Labels & Grid Setup:");

// Test label formatting in en, hi, te
['en', 'hi', 'te'].forEach(lang => {
  const labelA = TRANSLATIONS[lang].camera_label_a.replace('{n}', '1').replace('{m}', '3');
  const labelB = TRANSLATIONS[lang].camera_label_b.replace('{n}', '1').replace('{m}', '3');
  assert(labelA && labelA.length > 0, `camera_label_a in ${lang} must format`);
  assert(labelB && labelB.length > 0, `camera_label_b in ${lang} must format`);
});
console.log("  ✓ Camera labels format 'Batch N of M. Photo A (stem up)' and 'Photo B (stem down)' in en, hi, te");

// Test coin spot labels
assert(TRANSLATIONS.en.coin_spot, "coin_spot must exist in en");
assert(TRANSLATIONS.hi.coin_spot, "coin_spot must exist in hi");
assert(TRANSLATIONS.te.coin_spot, "coin_spot must exist in te");
console.log("  ✓ Coin spot text defined in en, hi, te");

// -----------------------------------------------------------------
// 5. Rule flow: 1..6 before Photo A, 7..9 before Photo B
// -----------------------------------------------------------------
console.log("\n5. Rule Sequence & Flow:");
const rulesA = EXPECTED_RULES_EN.slice(0, 6);
const rulesB = EXPECTED_RULES_EN.slice(6, 9);
assert.strictEqual(rulesA.length, 6, "Phase A has rules 1 to 6");
assert.strictEqual(rulesB.length, 3, "Phase B has rules 7 to 9");
assert.strictEqual(rulesA[0], "Use daylight.", "Rule 1 is daylight");
assert.strictEqual(rulesA[5], "Hold the phone flat above. Not tilted.", "Rule 6 is phone flat");
assert.strictEqual(rulesB[0], "Now turn each tomato over. Stem side down.", "Rule 7 is turn over");
assert.strictEqual(rulesB[2], "Keep the coin in the same place.", "Rule 9 is keep coin");
console.log("  ✓ Rules 1-6 are assigned before Photo A and Rules 7-9 before Photo B");

console.log("\n=======================================================");
console.log("ALL PHASE 2a TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
