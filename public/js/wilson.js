// AgriGrade Wilson Score Interval Module
// Never displays the word "Wilson" to users

const AgriGradeWilson = {
  calculate(x, n, z = 1.96) {
    if (!n || n <= 0) {
      return { p: 0, center: 0, half: 0, low: 0, high: 0 };
    }
    const p = x / n;
    const z2 = z * z;
    const denom = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denom;
    const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
    const low = Math.max(0, center - half);
    const high = Math.min(1, center + half);

    return {
      p,
      center,
      half,
      low,
      high
    };
  },

  formatSimpleBar(x, n, lang = 'en', z = 1.96) {
    const res = this.calculate(x, n, z);
    const pPct = Math.round(res.p * 100);
    const lowPct = Math.round(res.low * 100);
    const highPct = Math.round(res.high * 100);

    if (lang === 'te') {
      // TODO: needs native speaker review
      return `చెడిపోయినవి: 100 లో సుమారు ${pPct}. ${lowPct} నుండి ${highPct} ఉండవచ్చు.`;
    }
    if (lang === 'hi') {
      // TODO: needs native speaker review
      return `खराब फल: 100 में से लगभग ${pPct}। ${lowPct} से ${highPct} हो सकते हैं।`;
    }
    return `Bad fruit: about ${pPct} in 100. Could be ${lowPct} to ${highPct} in 100.`;
  }
};

// CommonJS & Browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgriGradeWilson;
}
if (typeof window !== 'undefined') {
  window.AgriGradeWilson = AgriGradeWilson;
}
