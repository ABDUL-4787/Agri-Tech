// AgriGrade Phase 2b Specification Unit Tests
// Tests:
// 1. Numbers in config.js (BLUR_MIN=65, DARK_MIN_BRIGHTNESS=60, LIVE_CHECK_INTERVAL_MS=500).
// 2. flags.js schema: { code, severity, icon, textKey }.
// 3. i18n text in te, hi, en with max 8 words per sentence and "// TODO: needs native speaker review" on te/hi.
// 4. analyzeFrameData CV checks for coin found, not blurry (Laplacian variance >= 65), not dark (mean brightness >= 60).
// 5. Red check buttons ("Retake", "Use anyway") and blocking behavior for F0 (no coin) & F0b (blurry or dark).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AgriGradeConfig = require('../frontend/js/config.js');
const AgriGradeFlags = require('../frontend/js/flags.js');
const { TRANSLATIONS, t } = require('../frontend/js/i18n.js');
const AgriGradeApp = require('../frontend/js/app.js');

console.log("=======================================================");
console.log("RUNNING AGRIGRADE PHASE 2b SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// -----------------------------------------------------------------
// 1. Numbers in config.js
// -----------------------------------------------------------------
console.log("1. Config.js Phase 2b Constants:");
assert.strictEqual(AgriGradeConfig.BLUR_MIN, 65, "BLUR_MIN must be 65 in config.js");
console.log("  ✓ BLUR_MIN = 65");

assert.strictEqual(AgriGradeConfig.DARK_MIN_BRIGHTNESS, 60, "DARK_MIN_BRIGHTNESS must be 60 in config.js");
console.log("  ✓ DARK_MIN_BRIGHTNESS = 60");

assert.strictEqual(AgriGradeConfig.LIVE_CHECK_INTERVAL_MS, 500, "LIVE_CHECK_INTERVAL_MS must be 500 ms in config.js");
console.log("  ✓ LIVE_CHECK_INTERVAL_MS = 500");

// -----------------------------------------------------------------
// 2. flags.js schema: { code, severity, icon, textKey }
// -----------------------------------------------------------------
console.log("\n2. flags.js Catalog Schema & Top Strip Behavior:");
const catalog = AgriGradeFlags.CATALOG;
assert(catalog, "CATALOG must exist in AgriGradeFlags");

const expectedCodes = ["F0", "F0b", "F1", "F4", "F7", "F13", "F14"];
expectedCodes.forEach(code => {
  const flag = catalog[code];
  assert(flag, `Flag ${code} must exist in CATALOG`);
  assert.strictEqual(typeof flag.code, 'string', `Flag ${code}.code must be string`);
  assert(['block', 'warning', 'info'].includes(flag.severity), `Flag ${code}.severity must be block, warning, or info`);
  assert.strictEqual(typeof flag.icon, 'string', `Flag ${code}.icon must be string`);
  assert.strictEqual(typeof flag.textKey, 'string', `Flag ${code}.textKey must be string`);
  console.log(`  ✓ Flag ${code}: { code: '${flag.code}', severity: '${flag.severity}', icon: '${flag.icon}', textKey: '${flag.textKey}' }`);
});

// Verify blocking severity for F0 and F0b
assert.strictEqual(AgriGradeFlags.isBlocking("F0"), true, "F0 must be blocking severity");
assert.strictEqual(AgriGradeFlags.isBlocking("F0b"), true, "F0b must be blocking severity");
assert.strictEqual(AgriGradeFlags.isBlocking("F1"), false, "F1 must not be blocking");
console.log("  ✓ isBlocking correctly identifies F0 and F0b as blocking flags");

// Mock container for top strip render test
const mockContainer = {
  style: {},
  children: [],
  innerHTML: "",
  appendChild(child) {
    this.children.push(child);
  }
};
global.document = {
  createElement: (tag) => ({
    tagName: tag,
    className: "",
    innerHTML: ""
  })
};

AgriGradeFlags.renderTopStrip(["F0", "F0b"], mockContainer, t);
assert.strictEqual(mockContainer.style.display, "flex", "Top strip container must be flex when flags exist");
assert.strictEqual(mockContainer.children.length, 2, "Top strip must render 2 flag items");
assert(mockContainer.children[0].className.includes("block"), "F0 item must have block severity class");
assert(mockContainer.children[1].className.includes("block"), "F0b item must have block severity class");
console.log("  ✓ renderTopStrip renders flags at the top with proper icons and severity");

// -----------------------------------------------------------------
// 3. Text in i18n.js (te, hi, en) with max 8 words & TODO comments
// -----------------------------------------------------------------
console.log("\n3. i18n.js Text & TODO native speaker review annotations:");

const i18nPath = path.join(__dirname, '../frontend/js/i18n.js');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

const PHASE2B_KEYS = [
  "check_coin_ready",
  "check_coin_missing",
  "check_sharp_good",
  "check_sharp_blurry",
  "check_light_good",
  "check_light_dark",
  "btn_retake",
  "btn_use_anyway",
  "blocked_no_coin",
  "blocked_blurry_or_dark"
];

["en", "hi", "te"].forEach(lang => {
  PHASE2B_KEYS.forEach(key => {
    const text = TRANSLATIONS[lang][key];
    assert(text, `Translation for ${key} must exist in ${lang}`);

    // Sentence length check (max 8 words per sentence)
    const sentences = text.split(/[.!?।|]/).map(s => s.trim()).filter(Boolean);
    sentences.forEach(s => {
      const words = s.split(/\s+/).filter(Boolean);
      assert(words.length <= 8, `Sentence in ${lang}.${key} exceeds 8 words (${words.length} words): "${s}"`);
    });
  });
  console.log(`  ✓ All Phase 2b keys in ${lang} have max 8 words per sentence`);
});

// Verify every te and hi string in i18n.js is marked with TODO: needs native speaker review
PHASE2B_KEYS.forEach(key => {
  const hiRegex = new RegExp(`${key}:\\s*"[^"]*",?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert(hiRegex.test(i18nContent), `Hindi string for ${key} must be marked with // TODO: needs native speaker review`);

  const teRegex = new RegExp(`${key}:\\s*"[^"]*",?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert(teRegex.test(i18nContent), `Telugu string for ${key} must be marked with // TODO: needs native speaker review`);
});
console.log("  ✓ All Phase 2b Telugu and Hindi strings are marked with // TODO: needs native speaker review");

// -----------------------------------------------------------------
// 4. CV Image Analysis (Laplacian Sharpness, Brightness, Coin Spot)
// -----------------------------------------------------------------
console.log("\n4. analyzeFrameData CV Quality Checks:");

const analyze = AgriGradeApp.analyzeFrameData;
assert.strictEqual(typeof analyze, 'function', "AgriGradeApp.analyzeFrameData must be a function");

// Helper: build synthetic RGBA frame
const createFrame = (w, h, fillFn) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [r, g, b, a] = fillFn(x, y, w, h);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a !== undefined ? a : 255;
    }
  }
  return { data, width: w, height: h };
};

// 4a. Dark frame test (brightness < 60)
const darkFrame = createFrame(160, 120, () => [20, 20, 20, 255]);
const darkRes = analyze(darkFrame, 160, 120, AgriGradeConfig);
assert.strictEqual(darkRes.notDark, false, "Frame with mean brightness < 60 must fail notDark check");
assert(darkRes.meanBrightness < 60, `meanBrightness should be < 60 (got ${darkRes.meanBrightness})`);
console.log(`  ✓ Dark frame check: meanBrightness = ${darkRes.meanBrightness.toFixed(1)}, notDark = false`);

// 4b. Bright frame test (brightness >= 60)
const brightFrame = createFrame(160, 120, () => [120, 120, 120, 255]);
const brightRes = analyze(brightFrame, 160, 120, AgriGradeConfig);
assert.strictEqual(brightRes.notDark, true, "Frame with brightness >= 60 must pass notDark check");
console.log(`  ✓ Bright frame check: meanBrightness = ${brightRes.meanBrightness.toFixed(1)}, notDark = true`);

// 4c. Blurry frame test (Laplacian variance < 65)
// Uniform or smooth gradient has near-zero Laplacian variance
const blurryFrame = createFrame(160, 120, (x) => [80 + Math.floor(x * 0.1), 80 + Math.floor(x * 0.1), 80 + Math.floor(x * 0.1), 255]);
const blurRes = analyze(blurryFrame, 160, 120, AgriGradeConfig);
assert.strictEqual(blurRes.notBlurry, false, "Smooth frame with Laplacian var < 65 must fail notBlurry check");
assert(blurRes.lapVar < 65, `lapVar should be < 65 (got ${blurRes.lapVar})`);
console.log(`  ✓ Blurry frame check: lapVar = ${blurRes.lapVar.toFixed(1)}, notBlurry = false`);

// 4d. Sharp frame with coin test (High Laplacian variance & coin spot contrast)
const sharpCoinFrame = createFrame(160, 120, (x, y, w, h) => {
  // Checkerboard pattern for high sharpness
  const isCheck = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0);
  const base = isCheck ? 200 : 70;

  // Designated coin spot area: x in [w*0.65, w*0.95], y in [h*0.05, h*0.35]
  if (x >= w * 0.65 && x <= w * 0.95 && y >= h * 0.05 && y <= h * 0.35) {
    const isRing = (x % 3 === 0);
    return [isRing ? 220 : 130, isRing ? 210 : 125, isRing ? 180 : 110, 255]; // metallic gold/brass coin
  }

  return [base, base, base, 255];
});
const sharpRes = analyze(sharpCoinFrame, 160, 120, AgriGradeConfig);
assert.strictEqual(sharpRes.notDark, true, "Sharp frame must pass notDark");
assert.strictEqual(sharpRes.notBlurry, true, "Sharp checkerboard frame must pass notBlurry");
assert.strictEqual(sharpRes.coinFound, true, "Frame with coin in coin spot must pass coinFound");
console.log(`  ✓ Sharp frame with coin: lapVar = ${sharpRes.lapVar.toFixed(1)}, notBlurry = true, coinFound = true`);

// 4e. Sharp frame WITHOUT coin test (Coin missing -> F0)
const sharpNoCoinFrame = createFrame(160, 120, (x, y, w, h) => {
  const isCheck = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0);
  // Red tomatoes pattern in lower part, plain white sheet in top right
  if (x >= w * 0.60 && y <= h * 0.40) {
    return [240, 240, 240, 255]; // plain flat cloth, no coin
  }
  return isCheck ? [220, 30, 20, 255] : [160, 20, 15, 255]; // red tomatoes
});
const noCoinRes = analyze(sharpNoCoinFrame, 160, 120, AgriGradeConfig);
assert.strictEqual(noCoinRes.coinFound, false, "Frame without coin in spot must report coinFound = false");
console.log(`  ✓ Missing coin detection: coinFound = false (will trigger F0 blocking)`);

// -----------------------------------------------------------------
// 5. Verification of HTML structure for Phase 2b
// -----------------------------------------------------------------
console.log("\n5. HTML Structure & Visual Elements:");
const htmlPath = path.join(__dirname, '../frontend/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="top-flags-strip"'), "Top flags strip element #top-flags-strip must exist in index.html");
console.log("  ✓ #top-flags-strip is in index.html");

assert(htmlContent.includes('id="tick-coin"'), "Tick coin element #tick-coin must exist");
assert(htmlContent.includes('id="tick-blur"'), "Tick blur element #tick-blur must exist");
assert(htmlContent.includes('id="tick-light"'), "Tick light element #tick-light must exist");
console.log("  ✓ Live check ticks exist for coin, blur, light");

assert(htmlContent.includes('id="red-check-box"'), "Red check box #red-check-box must exist");
assert(htmlContent.includes('id="btn-live-retake"'), "Retake button #btn-live-retake must exist");
assert(htmlContent.includes('id="btn-live-use-anyway"'), "Use anyway button #btn-live-use-anyway must exist");
console.log("  ✓ Red check box with Retake and Use anyway buttons is present");

assert(htmlContent.includes('id="blocking-banner-box"'), "Blocking banner box #blocking-banner-box must exist");
assert(htmlContent.includes('id="blocking-reason-text"'), "Blocking reason text #blocking-reason-text must exist");
assert(htmlContent.includes('id="btn-blocking-retake"'), "Blocking Retake button #btn-blocking-retake must exist");
console.log("  ✓ Blocking banner box with simple reason text and Retake button is present");

assert(htmlContent.includes('<script src="/js/flags.js"></script>'), "flags.js script tag must be included");
console.log("  ✓ flags.js script tag is included in index.html");

console.log("\n=======================================================");
console.log("ALL PHASE 2b SPECIFICATION UNIT TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================");
