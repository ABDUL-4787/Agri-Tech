// AgriGrade Central Configuration & Sampling Helpers
// Put EVERY number here as required by the specification

const AgriGradeConfig = {
  CRATE_KG: 22,
  BATCH_SIZE: 15,
  MIN_FRUITS_HARD: 20,
  WILSON_Z: 1.96,
  GRID_ROWS: 3,
  GRID_COLS: 5,
  COIN_SPOT_SIZE_PX: 60,
  BLUR_MIN: 65,
  DARK_MIN_BRIGHTNESS: 60,
  LIVE_CHECK_INTERVAL_MS: 500,
  PHOTO_DOWNSCALE_MAX_WIDTH: 1600,
  PHOTO_DOWNSCALE_QUALITY: 0.85,
  EXIF_MAX_AGE_MINUTES: 60,
  TOLERANCE: {
    A: 0.05,
    B: 0.10,
    C: 0.10
  },
  GRADE_MULTIPLIER: {
    A: 1.0,
    B: 0.85,
    C: 0.70
  },
  SIZE_ERROR_MM: 3,
  SIZE_PARALLAX_CORRECTION: 0.97,
  SAMPLE_TABLE: [
    { maxKg: 5, fruits: 'ALL', cap: 30 },
    { maxKg: 100, fruits: 30 },
    { maxKg: 500, fruits: 40 },
    { maxKg: 2000, fruits: 50 },
    { maxKg: Infinity, fruits: 60 }
  ],

  // Look up target fruit count from kg using SAMPLE_TABLE
  getSampleTarget(kg) {
    for (const tier of this.SAMPLE_TABLE) {
      if (kg <= tier.maxKg) {
        if (tier.fruits === 'ALL') {
          return Math.min(tier.cap, Math.max(this.MIN_FRUITS_HARD, Math.round(kg * 10)));
        }
        return tier.fruits;
      }
    }
    return 60;
  },

  // Calculate batch count (15 fruit per batch)
  getBatchCount(targetFruits) {
    return Math.ceil(targetFruits / this.BATCH_SIZE);
  },

  // Crypto random picker for crate numbers: NO REPEATS, uses crypto.getRandomValues
  pickRandomCrates(totalCrates, count, cryptoProvider = null) {
    const crypto = cryptoProvider || 
      (typeof window !== 'undefined' && window.crypto) || 
      (typeof globalThis !== 'undefined' && globalThis.crypto) ||
      (typeof require !== 'undefined' ? require('crypto').webcrypto : null);

    if (!crypto || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues is required for anti-bias picker.");
    }

    const cratesToOpen = Math.min(totalCrates, Math.max(1, count));
    if (totalCrates <= cratesToOpen) {
      return Array.from({ length: totalCrates }, (_, i) => i + 1);
    }

    const picked = new Set();
    const buffer = new Uint32Array(cratesToOpen * 4);
    let bufIdx = buffer.length;

    while (picked.size < cratesToOpen) {
      if (bufIdx >= buffer.length) {
        crypto.getRandomValues(buffer);
        bufIdx = 0;
      }
      const candidate = (buffer[bufIdx++] % totalCrates) + 1;
      picked.add(candidate);
    }

    return Array.from(picked).sort((a, b) => a - b);
  },

  // Crypto random picker for loose heap zones (6 zones x 3 depths)
  pickRandomHeapZones(count = 3, cryptoProvider = null) {
    const crypto = cryptoProvider || 
      (typeof window !== 'undefined' && window.crypto) || 
      (typeof globalThis !== 'undefined' && globalThis.crypto) ||
      (typeof require !== 'undefined' ? require('crypto').webcrypto : null);

    const zones = ['Front-Left', 'Front-Right', 'Middle-Left', 'Middle-Right', 'Back-Left', 'Back-Right'];
    const depths = ['Top', 'Middle', 'Bottom'];

    if (!crypto || !crypto.getRandomValues) {
      return zones.slice(0, count).map(z => `${z} (Top, Middle, Bottom)`);
    }

    const picked = new Set();
    const buffer = new Uint32Array(count * 4);
    let bufIdx = buffer.length;

    while (picked.size < Math.min(count, zones.length)) {
      if (bufIdx >= buffer.length) {
        crypto.getRandomValues(buffer);
        bufIdx = 0;
      }
      const candidate = zones[buffer[bufIdx++] % zones.length];
      picked.add(candidate);
    }

    return Array.from(picked).map(z => `${z} (Top, Middle, Bottom)`);
  }
};

// CommonJS & Browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgriGradeConfig;
}
if (typeof window !== 'undefined') {
  window.AgriGradeConfig = AgriGradeConfig;
}
