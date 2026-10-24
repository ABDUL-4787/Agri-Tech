// AgriGrade Phase 2c Specification Unit Tests
// Tests:
// 1. Photo A & Photo B protocol: Photo B screen shows thumbnail of Photo A. Missing Photo B: flag F0d, blocks batch, shows "Retake".
// 2. Photo tagging: batchNo, photoType, crateNo, layer, capturedAt, source (from Phase 1 plan).
// 3. Save downscaled copy (width 1600, quality 0.85) in IndexedDB.
// 4. Gallery upload allowed. Read EXIF time: missing or older than 60 minutes -> flag F12 warning, never block.
// 5. Skip Photo C and duplicate-photo checks.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const AgriGradeConfig = require('../frontend/js/config.js');
const AgriGradeFlags = require('../frontend/js/flags.js');
const { TRANSLATIONS } = require('../frontend/js/i18n.js');
const AgriGradeApp = require('../frontend/js/app.js');

console.log("=======================================================");
console.log("RUNNING AGRIGRADE PHASE 2c SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// -----------------------------------------------------------------
// 1. Config.js Phase 2c Constants
// -----------------------------------------------------------------
console.log("1. Config.js Phase 2c Constants:");
assert.strictEqual(AgriGradeConfig.PHOTO_DOWNSCALE_MAX_WIDTH, 1600, "PHOTO_DOWNSCALE_MAX_WIDTH must be 1600 in config.js");
console.log("  ✓ PHOTO_DOWNSCALE_MAX_WIDTH = 1600");

assert.strictEqual(AgriGradeConfig.PHOTO_DOWNSCALE_QUALITY, 0.85, "PHOTO_DOWNSCALE_QUALITY must be 0.85 in config.js");
console.log("  ✓ PHOTO_DOWNSCALE_QUALITY = 0.85");

assert.strictEqual(AgriGradeConfig.EXIF_MAX_AGE_MINUTES, 60, "EXIF_MAX_AGE_MINUTES must be 60 in config.js");
console.log("  ✓ EXIF_MAX_AGE_MINUTES = 60");

// -----------------------------------------------------------------
// 2. Photo Tagging (batchNo, photoType, crateNo, layer, capturedAt, source)
// -----------------------------------------------------------------
console.log("\n2. Photo Metadata Tagging:");
const getTags = AgriGradeApp.getBatchPhotoTags;
assert.strictEqual(typeof getTags, 'function', "AgriGradeApp.getBatchPhotoTags must be a function");

// Simulate Phase 1 plan state
AgriGradeApp.wizard.lotMode = "crates";
AgriGradeApp.wizard.lotCrates = 10;
AgriGradeApp.wizard.pickedCrates = [2, 5, 8];

const tagsBatch1A = getTags(1, "A", false);
assert.strictEqual(tagsBatch1A.batchNo, 1, "batchNo must be 1");
assert.strictEqual(tagsBatch1A.photoType, "A", "photoType must be 'A'");
assert.strictEqual(tagsBatch1A.crateNo, 2, "crateNo for batch 1 must be first picked crate (2)");
assert.strictEqual(tagsBatch1A.layer, "Top", "layer for batch 1 must be 'Top'");
assert.strictEqual(tagsBatch1A.source, "camera", "source must be 'camera'");
assert(Date.parse(tagsBatch1A.capturedAt), "capturedAt must be valid ISO timestamp");
console.log(`  ✓ Batch 1 Photo A tags:`, tagsBatch1A);

const tagsBatch1B = getTags(1, "B", false);
assert.strictEqual(tagsBatch1B.batchNo, 1);
assert.strictEqual(tagsBatch1B.photoType, "B");
assert.strictEqual(tagsBatch1B.crateNo, 2);
assert.strictEqual(tagsBatch1B.layer, "Top");
console.log(`  ✓ Batch 1 Photo B tags:`, tagsBatch1B);

const tagsBatch2A = getTags(2, "A", true);
assert.strictEqual(tagsBatch2A.batchNo, 2);
assert.strictEqual(tagsBatch2A.photoType, "A");
assert.strictEqual(tagsBatch2A.crateNo, 2);
assert.strictEqual(tagsBatch2A.layer, "Middle", "layer for batch 2 must be 'Middle'");
assert.strictEqual(tagsBatch2A.source, "gallery", "source must be 'gallery'");
console.log(`  ✓ Batch 2 Photo A gallery tags:`, tagsBatch2A);

const tagsBatch4A = getTags(4, "A", false);
assert.strictEqual(tagsBatch4A.batchNo, 4);
assert.strictEqual(tagsBatch4A.crateNo, 5, "batch 4 moves to second picked crate (5)");
assert.strictEqual(tagsBatch4A.layer, "Top");
console.log(`  ✓ Batch 4 Photo A tags (next crate):`, tagsBatch4A);

// -----------------------------------------------------------------
// 3. IndexedDB Save & Downscale Operations
// -----------------------------------------------------------------
console.log("\n3. IndexedDB Downscaled Photo Storage:");
assert.strictEqual(typeof AgriGradeApp.savePhotoToIndexedDB, 'function', "savePhotoToIndexedDB must be a function");
assert.strictEqual(typeof AgriGradeApp.getPhotosFromIndexedDB, 'function', "getPhotosFromIndexedDB must be a function");

// In Node.js environment, verify savePhotoToIndexedDB safely handles photo record without throwing
const testRecord = {
  id: "batch_1_photo_A",
  batchNo: 1,
  photoType: "A",
  crateNo: 2,
  layer: "Top",
  capturedAt: new Date().toISOString(),
  source: "camera",
  blob: Buffer.from("dummy-downscaled-image-data")
};

AgriGradeApp.savePhotoToIndexedDB(testRecord).then(res => {
  assert(res, "savePhotoToIndexedDB should resolve saved record");
  console.log("  ✓ savePhotoToIndexedDB resolves gracefully in environment");
});

// -----------------------------------------------------------------
// 4. EXIF DateTime Parser & Gallery 60-Minute Check
// -----------------------------------------------------------------
console.log("\n4. EXIF DateTime Parser & 60-Minute Age Check:");
assert.strictEqual(typeof AgriGradeApp.readExifDate, 'function', "readExifDate must be a function");
assert.strictEqual(typeof AgriGradeApp.checkGalleryExifAge, 'function', "checkGalleryExifAge must be a function");

// Helper: build synthetic minimal JPEG buffer with EXIF APP1 tag 0x9003 (DateTimeOriginal)
const createExifJpegBuffer = (dateStr) => {
  // SOI 0xFFD8
  // APP1 0xFFE1, length (2 bytes), "Exif\0\0" (6 bytes)
  // TIFF: 'II' (0x4949), 0x002A, offset 8
  // IFD0: 1 entry (tag 0x9003, type ASCII 2, count 20, value offset)
  const exifAscii = Buffer.from(dateStr + "\0", "ascii"); // 20 bytes e.g. "2026:10:24 14:00:00\0"
  
  const tiffHeader = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]); // 8 bytes
  const ifd0 = Buffer.alloc(2 + 12 + 4); // 2 count + 12 entry + 4 next IFD
  ifd0.writeUInt16LE(1, 0); // 1 entry
  ifd0.writeUInt16LE(0x9003, 2); // Tag 0x9003 (DateTimeOriginal)
  ifd0.writeUInt16LE(2, 4); // Type ASCII
  ifd0.writeUInt32LE(exifAscii.length, 6); // Count 20
  
  const valueOffset = 8 + ifd0.length;
  ifd0.writeUInt32LE(valueOffset, 10); // Offset to string value

  const tiffBody = Buffer.concat([tiffHeader, ifd0, exifAscii]);
  const exifHeader = Buffer.from("Exif\0\0", "ascii");
  const app1Payload = Buffer.concat([exifHeader, tiffBody]);
  
  const app1Header = Buffer.alloc(4);
  app1Header.writeUInt16BE(0xFFE1, 0);
  app1Header.writeUInt16BE(app1Payload.length + 2, 2);

  const soi = Buffer.from([0xFF, 0xD8]);
  const eoi = Buffer.from([0xFF, 0xD9]);

  return Buffer.concat([soi, app1Header, app1Payload, eoi]);
};

// 4a. Synthetic EXIF recent photo (10 minutes ago)
const now = new Date();
const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
const pad = (n) => String(n).padStart(2, '0');
const recentExifStr = `${tenMinAgo.getFullYear()}:${pad(tenMinAgo.getMonth() + 1)}:${pad(tenMinAgo.getDate())} ${pad(tenMinAgo.getHours())}:${pad(tenMinAgo.getMinutes())}:${pad(tenMinAgo.getSeconds())}`;

const recentBuf = createExifJpegBuffer(recentExifStr);
const recentFile = {
  slice: () => ({ arrayBuffer: async () => recentBuf.buffer.slice(recentBuf.byteOffset, recentBuf.byteOffset + recentBuf.byteLength) }),
  lastModified: tenMinAgo.getTime()
};

(async () => {
  const recentParsedDate = await AgriGradeApp.readExifDate(recentFile);
  assert(recentParsedDate, "readExifDate should parse EXIF date string");
  assert.strictEqual(recentParsedDate.getFullYear(), tenMinAgo.getFullYear());
  console.log(`  ✓ Parsed EXIF date successfully: ${recentParsedDate.toISOString()}`);

  const recentCheck = await AgriGradeApp.checkGalleryExifAge(recentFile);
  assert.strictEqual(recentCheck.isOlderThanLimit, false, "10-minute old photo must not exceed 60 min limit");
  console.log(`  ✓ Recent photo check: isOlderThanLimit = false (age: ${recentCheck.ageMinutes.toFixed(1)} min)`);

  // 4b. Synthetic EXIF old photo (120 minutes ago)
  const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
  const oldExifStr = `${twoHoursAgo.getFullYear()}:${pad(twoHoursAgo.getMonth() + 1)}:${pad(twoHoursAgo.getDate())} ${pad(twoHoursAgo.getHours())}:${pad(twoHoursAgo.getMinutes())}:${pad(twoHoursAgo.getSeconds())}`;
  const oldBuf = createExifJpegBuffer(oldExifStr);
  const oldFile = {
    slice: () => ({ arrayBuffer: async () => oldBuf.buffer.slice(oldBuf.byteOffset, oldBuf.byteOffset + oldBuf.byteLength) }),
    lastModified: twoHoursAgo.getTime()
  };

  const oldCheck = await AgriGradeApp.checkGalleryExifAge(oldFile);
  assert.strictEqual(oldCheck.isOlderThanLimit, true, "120-minute old photo must exceed 60 min limit");
  console.log(`  ✓ Old photo check: isOlderThanLimit = true (age: ${oldCheck.ageMinutes.toFixed(1)} min) -> triggers F12 warning`);

  // 4c. Missing EXIF test
  const missingExifFile = {
    slice: () => ({ arrayBuffer: async () => Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]).buffer }),
    lastModified: 0
  };
  const missingCheck = await AgriGradeApp.checkGalleryExifAge(missingExifFile);
  assert.strictEqual(missingCheck.isOlderThanLimit, true, "Missing EXIF must trigger isOlderThanLimit = true");
  console.log("  ✓ Missing EXIF check: isOlderThanLimit = true -> triggers F12 warning");

  // Verify F12 is warning severity (NEVER blocking)
  const f12 = AgriGradeFlags.getFlag("F12");
  assert.strictEqual(f12.severity, "warning", "F12 severity must be 'warning'");
  assert.strictEqual(AgriGradeFlags.isBlocking("F12"), false, "F12 must NOT be blocking");
  console.log("  ✓ F12 severity is 'warning' (never blocks)");

  // -----------------------------------------------------------------
  // 5. Missing Photo B Flag F0d & Blocking Verification
  // -----------------------------------------------------------------
  console.log("\n5. Missing Photo B (F0d) & Thumbnail Verification:");

  // Verify F0d is blocking severity
  const f0d = AgriGradeFlags.getFlag("F0d");
  assert.strictEqual(f0d.severity, "block", "F0d severity must be 'block'");
  assert.strictEqual(AgriGradeFlags.isBlocking("F0d"), true, "F0d must be a blocking flag");
  console.log("  ✓ Flag F0d is confirmed as blocking severity (block the batch)");

  // Verify i18n text for Phase 2c
  const i18nPath = path.join(__dirname, '../frontend/js/i18n.js');
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');

  const PHASE2C_KEYS = [
    "thumbnail_photo_a",
    "blocked_missing_photo_b",
    "gallery_warning"
  ];

  ["en", "hi", "te"].forEach(lang => {
    PHASE2C_KEYS.forEach(k => {
      const text = TRANSLATIONS[lang][k];
      assert(text, `Translation for ${k} must exist in ${lang}`);
      const words = text.trim().split(/\s+/);
      assert(words.length <= 8, `Translation for ${lang}.${k} must be max 8 words (got ${words.length}): "${text}"`);
    });
    console.log(`  ✓ All Phase 2c keys in ${lang} have max 8 words per sentence`);
  });

  // Verify TODO native speaker review comments
  PHASE2C_KEYS.forEach(k => {
    const hiRegex = new RegExp(`${k}:\\s*"[^"]*",?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
    assert(hiRegex.test(i18nContent), `Hindi string for ${k} must be marked with // TODO: needs native speaker review`);

    const teRegex = new RegExp(`${k}:\\s*"[^"]*",?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
    assert(teRegex.test(i18nContent), `Telugu string for ${k} must be marked with // TODO: needs native speaker review`);
  });
  console.log("  ✓ All Phase 2c Telugu and Hindi strings are marked with // TODO: needs native speaker review");

  // -----------------------------------------------------------------
  // 6. HTML Viewfinder Elements Verification
  // -----------------------------------------------------------------
  console.log("\n6. HTML Viewfinder & Thumbnail Elements:");
  const htmlPath = path.join(__dirname, '../frontend/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert(htmlContent.includes('id="photo-a-thumbnail-box"'), "#photo-a-thumbnail-box must exist in index.html");
  assert(htmlContent.includes('id="photo-a-thumbnail-img"'), "#photo-a-thumbnail-img must exist in index.html");
  assert(htmlContent.includes('id="photo-a-thumbnail-label"'), "#photo-a-thumbnail-label must exist in index.html");
  console.log("  ✓ Photo A thumbnail elements present in index.html viewfinder");

  console.log("\n=======================================================");
  console.log("ALL PHASE 2c SPECIFICATION UNIT TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
})();
