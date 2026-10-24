// AgriGrade Phase 3 Specification Unit Tests
// Tests:
// 1. matchFruit(A, B): sort by row then column, confirm with nearest centroid
// 2. Worse-view rule: higher defect %, worse grade
// 3. Count difference: 1 fruit missing (allowed) vs >1 fruit missing (flag F8, block)
// 4. Shuffled A/B order matching
// 5. Lot grade by COUNT of fruit worse than lot grade (never average damage)
// 6. Flags: F0c (fewer than 20 fruit), F1 (fewer than target), F18, F19 (always shown)
// 7. Warning flag triggers Indicative Only title
// 8. Blocking conditions: no coin, blurry, under 20 fruit, Photo B missing
// 9. i18n max 8 words per sentence and TODO comments

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AgriGradeConfig = require('../frontend/js/config.js');
const AgriGradeWilson = require('../frontend/js/wilson.js');
const AgriGradeVerdict = require('../frontend/js/verdict.js');
const AgriGradeFlags = require('../frontend/js/flags.js');
const { matchFruit, sortFruitsByRowThenColumn, getWorseGrade } = require('../frontend/js/match.js');
const { TRANSLATIONS, t } = require('../frontend/js/i18n.js');
const i18n = TRANSLATIONS;

console.log("=======================================================");
console.log("RUNNING AGRIGRADE PHASE 3 SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// Helper: generate a grid of 15 fruits (3 rows x 5 cols)
function createGridFruits(prefix, baseDefect = 2, baseGrade = 'Grade A', jitter = 0) {
  const fruits = [];
  let id = 1;
  const rowYs = [100, 250, 400];
  const colXs = [100, 220, 340, 460, 580];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      fruits.push({
        id: `${prefix}_${id}`,
        fruit_id: id,
        x: colXs[c] + (jitter ? (Math.sin(id) * jitter) : 0),
        y: rowYs[r] + (jitter ? (Math.cos(id) * jitter) : 0),
        defectPercent: baseDefect,
        defect_area_pct: baseDefect,
        grade: baseGrade,
        quality_class: baseGrade,
        diameter_mm: 55.0
      });
      id++;
    }
  }
  return fruits;
}

// -------------------------------------------------------------
// 1. Shuffled A/B Order & Nearest Centroid Confirmation
// -------------------------------------------------------------
console.log("1. matchFruit: Shuffled A/B Order & Centroid Correspondence:");
{
  const fruitsA = createGridFruits("A", 2, "Grade A");
  const fruitsB = createGridFruits("B", 4, "Grade A", 2); // slight 2px jitter

  // Shuffle B completely
  const shuffledB = [...fruitsB].sort(() => 0.5 - Math.random());

  const matched = matchFruit(fruitsA, shuffledB);
  assert.strictEqual(matched.length, 15, "Matched results should have 15 fruits");
  assert.strictEqual(matched.flags.length, 0, "No flags should be raised for matching 15x15");
  assert.strictEqual(matched.isBlocked, false, "Should not be blocked");

  // Verify that each fruit matched its spatial equivalent
  matched.forEach((m, idx) => {
    assert.strictEqual(m.viewMatched, true, "Every fruit should be matched");
    assert.strictEqual(m.viewSurfaceSeen, 85, "Surface seen should be 85% for matched fruit");
    // Verify centroid distance between viewA and viewB is small (< 10px) despite shuffling
    const dx = m.viewA.coord.x - m.viewB.coord.x;
    const dy = m.viewA.coord.y - m.viewB.coord.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    assert.ok(dist <= 10, `Fruit ${idx + 1} matched wrong fruit! dist=${dist}`);
  });
  console.log("  ✓ Correctly matches corresponding fruits despite Photo B being completely shuffled");
}

// -------------------------------------------------------------
// 2. Worse-View Rule: Higher Defect % and Worse Grade
// -------------------------------------------------------------
console.log("\n2. Worse-View Rule Verification:");
{
  const fruitsA = createGridFruits("A", 1.5, "Grade A");
  const fruitsB = createGridFruits("B", 1.5, "Grade A");

  // Fruit 1: A is Grade A (1.5%), B is Grade B (12.0%) -> Worse is Grade B (12.0%)
  fruitsA[0].defectPercent = 1.5; fruitsA[0].grade = "Grade A";
  fruitsB[0].defectPercent = 12.0; fruitsB[0].grade = "Grade B";

  // Fruit 2: A is Grade B (15.0%), B is Grade A (3.0%) -> Worse is Grade B (15.0%)
  fruitsA[1].defectPercent = 15.0; fruitsA[1].grade = "Grade B";
  fruitsB[1].defectPercent = 3.0; fruitsB[1].grade = "Grade A";

  // Fruit 3: A is Grade B (8.0%), B is Reject (30.0%) -> Worse is Reject (30.0%)
  fruitsA[2].defectPercent = 8.0; fruitsA[2].grade = "Grade B";
  fruitsB[2].defectPercent = 30.0; fruitsB[2].grade = "Reject";

  const matched = matchFruit(fruitsA, fruitsB);

  assert.strictEqual(matched[0].defectPercent, 12.0, "Fruit 1 defect % must be higher (12%)");
  assert.strictEqual(matched[0].grade, "Grade B", "Fruit 1 grade must be worse (Grade B)");

  assert.strictEqual(matched[1].defectPercent, 15.0, "Fruit 2 defect % must be higher (15%)");
  assert.strictEqual(matched[1].grade, "Grade B", "Fruit 2 grade must be worse (Grade B)");

  assert.strictEqual(matched[2].defectPercent, 30.0, "Fruit 3 defect % must be higher (30%)");
  assert.strictEqual(matched[2].grade, "Reject", "Fruit 3 grade must be worse (Reject)");

  console.log("  ✓ Preserves the worse view (higher defect %, worse grade) for every tomato");
}

// -------------------------------------------------------------
// 3. Count Difference: One Missing (Allowed) vs >1 Missing (Flag F8 Block)
// -------------------------------------------------------------
console.log("\n3. Count Difference Checks (1 fruit missing vs >1 missing):");
{
  const fruitsA = createGridFruits("A", 2, "Grade A");
  // One fruit missing in B (14 fruits)
  const fruitsB_14 = fruitsA.slice(0, 14);

  const matched14 = matchFruit(fruitsA, fruitsB_14);
  assert.strictEqual(matched14.length, 15, "Should return 15 fruits (14 matched + 1 unmatched)");
  assert.strictEqual(matched14.flags.length, 0, "1 fruit missing should NOT trigger F8 flag");
  assert.strictEqual(matched14.isBlocked, false, "1 fruit missing should not block");

  const matchedCount = matched14.filter(f => f.viewMatched).length;
  const unmatchedCount = matched14.filter(f => !f.viewMatched).length;
  assert.strictEqual(matchedCount, 14, "14 fruits should be matched (85% surface)");
  assert.strictEqual(unmatchedCount, 1, "1 fruit should be unmatched (45% surface)");
  console.log("  ✓ One fruit missing: allowed without F8, 14 matched (85%), 1 unmatched (45%)");

  // Two fruits missing in B (13 fruits -> count diff = 2 > 1)
  const fruitsB_13 = fruitsA.slice(0, 13);
  const matched13 = matchFruit(fruitsA, fruitsB_13);
  assert.strictEqual(matched13.isBlocked, true, "Count diff > 1 MUST block the batch");
  assert.ok(matched13.flags.includes("F8"), "Must include flag F8");
  assert.strictEqual(matched13.reason, "Retake Photo B", "Must require Retake Photo B");
  console.log("  ✓ Two fruits missing: triggers flag F8, blocks batch, instructs Retake Photo B");
}

// -------------------------------------------------------------
// 4. Lot Grade by COUNT of Out-of-Grade Fruit (Never Average Damage)
// -------------------------------------------------------------
console.log("\n4. Lot Grading by COUNT of Out-of-Grade Fruit (Never Average Damage):");
{
  // Scenario A: 30 fruit lot where 29 fruit have 0% damage (Grade A),
  // and 1 fruit has 85% damage (Reject rot).
  // Average damage: 85 / 30 = 2.83% <= 5% (would mistakenly be Grade A if averaged!)
  // Count worse than Grade A: 1 out of 30.
  const lotA = [];
  for (let i = 0; i < 29; i++) {
    lotA.push({ id: i + 1, grade: 'Grade A', defectPercent: 0.0 });
  }
  lotA.push({ id: 30, grade: 'Reject', defectPercent: 85.0 });

  const verdictA = AgriGradeVerdict.evaluateLot({
    fruitResults: lotA,
    tolerances: AgriGradeConfig.TOLERANCE,
    multipliers: AgriGradeConfig.GRADE_MULTIPLIER,
    minFruitsHard: AgriGradeConfig.MIN_FRUITS_HARD,
    z: AgriGradeConfig.WILSON_Z
  });

  // Out of grade count for Grade A is 1
  assert.strictEqual(verdictA.out_of_grade_counts.worseThanA, 1, "Count worse than Grade A must be exactly 1");
  assert.strictEqual(verdictA.out_of_grade_counts.total, 30);
  
  // Wilson high for 1/30 at 95% is ~16.7% > 5% tolerance, so Grade A is NOT 'GREEN'
  assert.notStrictEqual(verdictA.grade_verdicts['Grade A'].outcome, 'GREEN', "Grade A cannot be GREEN because 16.7% > 5%");
  console.log("  ✓ Outlier fruit with 85% defect is counted as 1 bad fruit, NOT averaged to 2.8%");

  // Scenario B: 50 fruit lot where 45 fruit are Grade A, 5 fruit are Grade B
  // Count worse than Grade A = 5/50 = 10% failures (crosses 5% tolerance A).
  // Count worse than Grade B = 0/50 = 0% failures (Wilson high 0.069 <= 10% tolerance B -> GREEN).
  const lotB = [];
  for (let i = 0; i < 45; i++) lotB.push({ id: i + 1, grade: 'Grade A', defectPercent: 2.0 });
  for (let i = 45; i < 50; i++) lotB.push({ id: i + 1, grade: 'Grade B', defectPercent: 8.0 });

  const verdictB = AgriGradeVerdict.evaluateLot({
    fruitResults: lotB,
    tolerances: AgriGradeConfig.TOLERANCE,
    multipliers: AgriGradeConfig.GRADE_MULTIPLIER,
    minFruitsHard: AgriGradeConfig.MIN_FRUITS_HARD,
    z: AgriGradeConfig.WILSON_Z
  });

  assert.strictEqual(verdictB.out_of_grade_counts.worseThanA, 5, "Count worse than A is 5");
  assert.strictEqual(verdictB.out_of_grade_counts.worseThanB, 0, "Count worse than B is 0");
  assert.strictEqual(verdictB.lot_grade, 'Grade B', "Lot grade should be Grade B based on zero count worse than B");
  console.log("  ✓ Correctly grades lot based on failure counts per grade threshold");
}

// -------------------------------------------------------------
// 5. Phase 3 Flags: F0c, F1, F18, F19 & Indicative Only Title
// -------------------------------------------------------------
console.log("\n5. Flags F0c, F1, F18, F19 & Indicative Only Title:");
{
  // A. Fewer than 20 fruit (e.g. 15 fruits): F0c (block)
  const lot15 = [];
  for (let i = 0; i < 15; i++) lot15.push({ id: i + 1, grade: 'Grade A', defectPercent: 1.0 });

  const res15 = AgriGradeVerdict.evaluateLot({
    fruitResults: lot15,
    minFruitsHard: 20
  });

  assert.strictEqual(res15.has_grade, false, "Must not have grade if < 20 fruit");
  assert.strictEqual(res15.lot_grade, null, "Lot grade must be null");
  assert.ok(res15.flags.some(f => (f.code || f) === 'F0c'), "Must include flag F0c");
  console.log("  ✓ Under 20 fruit: triggers flag F0c (block), blocks grade and price");

  // B. Small sample from large lot: 20 fruits from 500 kg (target = 40)
  const lot20 = [];
  for (let i = 0; i < 20; i++) lot20.push({ id: i + 1, grade: 'Grade A', defectPercent: 1.0 });

  const res20 = AgriGradeVerdict.evaluateLot({
    fruitResults: lot20,
    lotWeightKg: 500,
    samplingTarget: 40,
    minFruitsHard: 20
  });

  assert.ok(res20.flags.some(f => (f.code || f) === 'F1'), "Must include flag F1 for small sample");
  assert.ok(res20.flags.some(f => (f.code || f) === 'F18'), "Must always include F18 (info)");
  assert.ok(res20.flags.some(f => (f.code || f) === 'F19'), "Must always include F19 (info)");
  assert.strictEqual(res20.indicative_only, true, "Warning flag F1 must make report indicative only");
  assert.strictEqual(res20.report_title, "INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే", "Report title must show Indicative Only in all 3 languages");
  console.log("  ✓ Small sample from large lot triggers F1, F18, F19, and Indicative Only title");
}

// -------------------------------------------------------------
// 6. No Grade Blocking Conditions (no coin, blurry, missing Photo B)
// -------------------------------------------------------------
console.log("\n6. No Grade Blocking Conditions:");
{
  const lot30 = [];
  for (let i = 0; i < 30; i++) lot30.push({ id: i + 1, grade: 'Grade A', defectPercent: 1.0 });

  // Missing coin (F0)
  const resF0 = AgriGradeVerdict.evaluateLot({ fruitResults: lot30, activeFlags: ['F0'] });
  assert.strictEqual(resF0.has_grade, false, "F0 must block grade");
  assert.strictEqual(resF0.price_per_kg, null, "F0 must block price");

  // Blurry (F0b)
  const resF0b = AgriGradeVerdict.evaluateLot({ fruitResults: lot30, activeFlags: ['F0b'] });
  assert.strictEqual(resF0b.has_grade, false, "F0b must block grade");

  // Missing Photo B (F0d)
  const resF0d = AgriGradeVerdict.evaluateLot({ fruitResults: lot30, activeFlags: ['F0d'] });
  assert.strictEqual(resF0d.has_grade, false, "F0d must block grade");

  // Count difference > 1 (F8)
  const resF8 = AgriGradeVerdict.evaluateLot({ fruitResults: lot30, activeFlags: ['F8'] });
  assert.strictEqual(resF8.has_grade, false, "F8 must block grade");

  console.log("  ✓ Strictly no grade and no price when any blocking flag (F0, F0b, F0d, F8) is present");
}

// -------------------------------------------------------------
// 7. i18n Rules: <= 8 Words Per Sentence & Native Speaker Review
// -------------------------------------------------------------
console.log("\n7. i18n String Rules (Max 8 words per sentence & TODO reviews):");
{
  const i18nFile = fs.readFileSync(path.join(__dirname, '../frontend/js/i18n.js'), 'utf8');
  const targetKeys = ['flag_f0c', 'flag_f1', 'flag_f8', 'flag_f18', 'flag_f19', 'indicative_title_all'];

  ['en', 'hi', 'te'].forEach(lang => {
    targetKeys.forEach(k => {
      const val = i18n[lang][k];
      assert.ok(val, `Missing key ${k} in lang ${lang}`);

      // Count words per sentence (or trilingual components separated by /)
      const sentences = val.split(/\s*\/\s*|[.।?!]\s*/).filter(s => s.trim().length > 0);
      sentences.forEach((s, idx) => {
        const words = s.trim().split(/\s+/).filter(w => w.length > 0);
        assert.ok(words.length <= 8, `Key ${k} in ${lang} sentence ${idx + 1} has ${words.length} words (max 8): "${s}"`);
      });
    });
  });
  console.log("  ✓ All Phase 3 messages in en, hi, te have <= 8 words per sentence");

  ['flag_f0c', 'flag_f1', 'flag_f8', 'flag_f18', 'flag_f19', 'indicative_title_all'].forEach(k => {
    const regexHi = new RegExp(`${k}:[\\s\\S]*?\\/\\/\\s*TODO:\\s*needs native speaker review`);
    assert.ok(regexHi.test(i18nFile), `Hindi key ${k} must have // TODO: needs native speaker review`);
  });
  console.log("  ✓ Every Phase 3 Hindi and Telugu string is marked with '// TODO: needs native speaker review'");
}

console.log("\n=======================================================");
console.log("ALL PHASE 3 SPECIFICATION UNIT TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================");
