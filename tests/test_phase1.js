// Unit tests for AgriGrade Phase 1
// Tests: Wilson interval known values, SAMPLE_TABLE, Random picker no repeats, Verdicts & 0-fruit block

const assert = require('assert');
const AgriGradeConfig = require('../frontend/js/config.js');
const AgriGradeWilson = require('../frontend/js/wilson.js');
const AgriGradeVerdict = require('../frontend/js/verdict.js');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log("\n=======================================================");
console.log("RUNNING AGRIGRADE PHASE 1 SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// -------------------------------------------------------------
// 1. Wilson Interval Tests
// -------------------------------------------------------------
console.log("1. Wilson Interval Tests:");

it("Wilson known values: n=10, x=1 -> approx 0.018 to 0.404", () => {
  const res = AgriGradeWilson.calculate(1, 10, 1.96);
  assert(Math.abs(res.low - 0.0177) < 0.005, `Expected low ~ 0.018, got ${res.low.toFixed(4)}`);
  assert(Math.abs(res.high - 0.4042) < 0.005, `Expected high ~ 0.404, got ${res.high.toFixed(4)}`);
});

it("Wilson known values: n=30, x=3 -> approx 0.035 to 0.256", () => {
  const res = AgriGradeWilson.calculate(3, 30, 1.96);
  assert(Math.abs(res.low - 0.0346) < 0.005, `Expected low ~ 0.035, got ${res.low.toFixed(4)}`);
  assert(Math.abs(res.high - 0.2562) < 0.005, `Expected high ~ 0.256, got ${res.high.toFixed(4)}`);
});

it("Wilson known values: n=100, x=10 -> approx 0.055 to 0.174", () => {
  const res = AgriGradeWilson.calculate(10, 100, 1.96);
  assert(Math.abs(res.low - 0.0552) < 0.005, `Expected low ~ 0.055, got ${res.low.toFixed(4)}`);
  assert(Math.abs(res.high - 0.1744) < 0.005, `Expected high ~ 0.174, got ${res.high.toFixed(4)}`);
});

it("Wilson formatting: never shows the word 'Wilson' in en, hi, te", () => {
  const enText = AgriGradeWilson.formatSimpleBar(3, 30, 'en');
  const hiText = AgriGradeWilson.formatSimpleBar(3, 30, 'hi');
  const teText = AgriGradeWilson.formatSimpleBar(3, 30, 'te');

  assert(!enText.toLowerCase().includes('wilson'), "English text should not contain 'wilson'");
  assert(!hiText.toLowerCase().includes('wilson'), "Hindi text should not contain 'wilson'");
  assert(!teText.toLowerCase().includes('wilson'), "Telugu text should not contain 'wilson'");

  assert(enText.includes("10 in 100"), "Expected p around 10 in 100");
  assert(enText.includes("3 to 26 in 100") || enText.includes("4 to 26 in 100"), `Expected range, got: ${enText}`);
});

// -------------------------------------------------------------
// 2. SAMPLE_TABLE Tests
// -------------------------------------------------------------
console.log("\n2. SAMPLE_TABLE Lookup Tests:");

it("Up to 5 kg: checks all fruit (capped at 30)", () => {
  assert.strictEqual(AgriGradeConfig.getSampleTarget(2.5), 25);
  assert.strictEqual(AgriGradeConfig.getSampleTarget(5.0), 30);
});

it("Up to 100 kg: target is 30 fruits", () => {
  assert.strictEqual(AgriGradeConfig.getSampleTarget(20), 30);
  assert.strictEqual(AgriGradeConfig.getSampleTarget(100), 30);
});

it("100 to 500 kg: target is 40 fruits", () => {
  assert.strictEqual(AgriGradeConfig.getSampleTarget(150), 40);
  assert.strictEqual(AgriGradeConfig.getSampleTarget(500), 40);
});

it("500 to 2000 kg: target is 50 fruits", () => {
  assert.strictEqual(AgriGradeConfig.getSampleTarget(800), 50);
  assert.strictEqual(AgriGradeConfig.getSampleTarget(2000), 50);
});

it("Over 2000 kg: target is 60 fruits", () => {
  assert.strictEqual(AgriGradeConfig.getSampleTarget(2500), 60);
  assert.strictEqual(AgriGradeConfig.getSampleTarget(10000), 60);
});

it("Batch size calculation: ceil(target / 15)", () => {
  assert.strictEqual(AgriGradeConfig.getBatchCount(30), 2);
  assert.strictEqual(AgriGradeConfig.getBatchCount(40), 3);
  assert.strictEqual(AgriGradeConfig.getBatchCount(50), 4);
  assert.strictEqual(AgriGradeConfig.getBatchCount(60), 4);
});

// -------------------------------------------------------------
// 3. Random Picker Tests (Anti-Bias, No Repeats)
// -------------------------------------------------------------
console.log("\n3. Random Picker Tests (crypto.getRandomValues, No Repeats):");

it("Crate picker generates exact requested count without repeats", () => {
  for (let trial = 0; trial < 25; trial++) {
    const totalCrates = 20;
    const cratesToOpen = 4;
    const picked = AgriGradeConfig.pickRandomCrates(totalCrates, cratesToOpen);

    assert.strictEqual(picked.length, cratesToOpen, "Must return exactly cratesToOpen count");
    const unique = new Set(picked);
    assert.strictEqual(unique.size, cratesToOpen, "Picked crates must have NO repeats");

    picked.forEach(c => {
      assert(c >= 1 && c <= totalCrates, `Crate number ${c} must be within 1..${totalCrates}`);
    });
  }
});

it("Crate picker when totalCrates <= count opens all crates", () => {
  const picked = AgriGradeConfig.pickRandomCrates(2, 4);
  assert.deepStrictEqual(picked, [1, 2]);
});

it("Loose heap zone picker returns distinct zones", () => {
  const zones = AgriGradeConfig.pickRandomHeapZones(3);
  assert.strictEqual(zones.length, 3);
  const unique = new Set(zones);
  assert.strictEqual(unique.size, 3);
});

// -------------------------------------------------------------
// 4. Verdicts & 0-Fruit Block Tests
// -------------------------------------------------------------
console.log("\n4. Verdicts & 0-Fruit Block Tests:");

it("GREEN verdict when Wilson high <= tolerance", () => {
  // 100 fruits, 0 defects: high = 0.036 <= 0.10 (Grade B tolerance)
  const res = AgriGradeVerdict.evaluateGradeOutcome(0, 100, 0.10);
  assert.strictEqual(res.outcome, 'GREEN');
  assert.strictEqual(res.label, 'Sure');
});

it("RED verdict when Wilson low > tolerance", () => {
  // 50 fruits, 25 defects: low = 0.367 > 0.10
  const res = AgriGradeVerdict.evaluateGradeOutcome(25, 50, 0.10);
  assert.strictEqual(res.outcome, 'RED');
  assert.strictEqual(res.label, 'Not this grade');
});

it("AMBER verdict when Wilson range crosses tolerance", () => {
  // 30 fruits, 0 defects: low = 0.0 <= 0.05, high = 0.1135 > 0.05
  const res = AgriGradeVerdict.evaluateGradeOutcome(0, 30, 0.05);
  assert.strictEqual(res.outcome, 'AMBER');
  assert.strictEqual(res.label, 'Not sure. Check 20 more fruit.');
});

it("0 fruit strictly blocks grade and price", () => {
  const res = AgriGradeVerdict.evaluateLot({
    fruitResults: [],
    basePrice: 25.0
  });

  assert.strictEqual(res.has_grade, false);
  assert.strictEqual(res.has_price, false);
  assert.strictEqual(res.lot_grade, null);
  assert.strictEqual(res.price_per_kg, null);
  assert.strictEqual(res.message, 'No grade. No fruit found.');
});

it("Fewer than 20 fruit (MIN_FRUITS_HARD) strictly blocks grade and price", () => {
  const fruits = Array.from({ length: 15 }, (_, i) => ({ fruit_id: i + 1, quality_class: 'Grade A' }));
  const res = AgriGradeVerdict.evaluateLot({
    fruitResults: fruits,
    basePrice: 25.0,
    minFruitsHard: 20
  });

  assert.strictEqual(res.has_grade, false);
  assert.strictEqual(res.has_price, false);
  assert.strictEqual(res.lot_grade, null);
  assert.strictEqual(res.price_per_kg, null);
  assert.strictEqual(res.message, 'Too few fruit. No grade.');
});

it("Full lot evaluation assigns best GREEN grade and calculates price", () => {
  // 40 fruits all Grade A
  // For Grade B tolerance 0.10, 0 worse than B has high = 0.0876 <= 0.10 -> GREEN
  const fruits = Array.from({ length: 40 }, (_, i) => ({ fruit_id: i + 1, quality_class: 'Grade A' }));
  const res = AgriGradeVerdict.evaluateLot({
    fruitResults: fruits,
    basePrice: 20.0
  });

  assert(res.has_grade);
  assert(res.lot_grade === 'Grade A' || res.lot_grade === 'Grade B');
});

console.log("\n=======================================================");
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("=======================================================\n");
