// AgriGrade Verdict Engine
// Evaluates per-grade 3-outcome verdicts (GREEN, RED, AMBER) and overall lot grade

const getWilsonEngine = () => {
  if (typeof AgriGradeWilson !== 'undefined') return AgriGradeWilson;
  if (typeof window !== 'undefined' && window.AgriGradeWilson) return window.AgriGradeWilson;
  if (typeof require !== 'undefined') {
    try { return require('./wilson.js'); } catch (_) {}
  }
  return null;
};

const AgriGradeVerdict = {
  // Evaluates a single grade against tolerance
  evaluateGradeOutcome(outOfGradeCount, totalCount, tolerance, z = 1.96) {
    const wilson = getWilsonEngine();
    if (!wilson) {
      throw new Error('AgriGradeWilson is required for verdict calculation.');
    }
    const interval = wilson.calculate(outOfGradeCount, totalCount, z);
    
    // GREEN if high <= tolerance
    if (interval.high <= tolerance) {
      return { outcome: 'GREEN', label: 'Sure', interval };
    }
    // RED if low > tolerance
    if (interval.low > tolerance) {
      return { outcome: 'RED', label: 'Not this grade', interval };
    }
    // AMBER otherwise
    return { outcome: 'AMBER', label: 'Not sure. Check 20 more fruit.', interval };
  },

  // Evaluates full lot verdict across Grade A, B, C, Reject
  evaluateLot({
    fruitResults = [],
    basePrice = null,
    tolerances = { A: 0.05, B: 0.10, C: 0.10 },
    multipliers = { A: 1.0, B: 0.85, C: 0.70, Reject: 0.0 },
    minFruitsHard = 20,
    z = 1.96,
    lotWeightKg = null,
    samplingTarget = null,
    activeFlags = []
  }) {
    const n = fruitResults.length;
    const flags = [...activeFlags];

    // Always shown info flags (Section 4)
    if (!flags.some(f => (typeof f === 'string' ? f : f.code) === 'F18')) {
      flags.push({
        code: 'F18',
        severity: 'info',
        icon: 'ℹ️',
        text: 'Inside rot cannot be seen.'
      });
    }
    if (!flags.some(f => (typeof f === 'string' ? f : f.code) === 'F19')) {
      flags.push({
        code: 'F19',
        severity: 'info',
        icon: 'ℹ️',
        text: 'Size is approximate.'
      });
    }

    // Check external blocking flags (F0, F0b, F0d, F8)
    const hasExternalBlock = flags.some(f => {
      const code = typeof f === 'string' ? f : f.code;
      return code === 'F0' || code === 'F0b' || code === 'F0d' || code === 'F8';
    });

    // 0 fruit: no grade, no price
    if (n === 0) {
      return {
        has_grade: false,
        has_price: false,
        lot_grade: null,
        verdict_status: 'NO_FRUIT',
        message_key: 'no_grade_zero',
        message: 'No grade. No fruit found.',
        price_per_kg: null,
        grade_verdicts: {},
        flags,
        indicative_only: true,
        report_title: 'INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే'
      };
    }

    // Under 20 fruit (minFruitsHard): Flag F0c (block), no grade, no price
    if (n < minFruitsHard) {
      if (!flags.some(f => (typeof f === 'string' ? f : f.code) === 'F0c')) {
        flags.push({
          code: 'F0c',
          severity: 'block',
          icon: '🛑',
          text: 'Fewer than 20 fruit. Cannot grade.'
        });
      }
      const isLotUnder20 = (lotWeightKg !== null && lotWeightKg !== undefined && lotWeightKg < 2.0);
      const msgKey = isLotUnder20 ? 'lot_too_small' : 'could_not_find_fruit_retake';
      const msgText = isLotUnder20 ? 'Lot too small for a grade.' : 'Could not find fruit. Retake photo.';

      return {
        has_grade: false,
        has_price: false,
        lot_grade: null,
        verdict_status: 'TOO_FEW_FRUITS',
        message_key: msgKey,
        message: msgText,
        price_per_kg: null,
        grade_verdicts: {},
        flags,
        indicative_only: true,
        report_title: 'INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే'
      };
    }

    // If external blocking flag is present (no coin, blurry, missing Photo B, count diff > 1)
    if (hasExternalBlock) {
      return {
        has_grade: false,
        has_price: false,
        lot_grade: null,
        verdict_status: 'BLOCKED',
        message_key: 'blocked',
        message: 'Batch blocked. Cannot grade.',
        price_per_kg: null,
        grade_verdicts: {},
        flags,
        indicative_only: true,
        report_title: 'INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే'
      };
    }

    // F1 check: fewer fruit than target: "Only X fruit checked from Y kg. Need Z."
    const target = samplingTarget || n;
    const kg = lotWeightKg || 100;
    if (n < target) {
      if (!flags.some(f => (typeof f === 'string' ? f : f.code) === 'F1')) {
        flags.push({
          code: 'F1',
          severity: 'warning',
          icon: '⚠️',
          text: `Only ${n} fruit checked from ${kg} kg. Need ${target}.`
        });
      }
    }

    // Check if any WARNING flag exists
    const hasWarningFlag = flags.some(f => {
      const sev = typeof f === 'object' ? f.severity : (f === 'F1' || f === 'F4' || f === 'F7' || f === 'F12' ? 'warning' : 'info');
      return sev === 'warning';
    });

    const reportTitle = hasWarningFlag
      ? 'INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే'
      : 'Tomato Lot Result';

    // Count fruits worse than each grade (COUNT-BASED, NEVER AVERAGE DAMAGE)
    // Better to worse rank: Grade A (1) > Grade B (2) > Grade C (3) > Reject (4)
    const gradeRanks = { 'Grade A': 1, 'Grade B': 2, 'Grade C': 3, 'Reject': 4 };

    const worseThanA = fruitResults.filter(f => (gradeRanks[f.grade || f.quality_class] || 4) > 1).length;
    const worseThanB = fruitResults.filter(f => (gradeRanks[f.grade || f.quality_class] || 4) > 2).length;
    const worseThanC = fruitResults.filter(f => (gradeRanks[f.grade || f.quality_class] || 4) > 3).length;

    const verdictA = this.evaluateGradeOutcome(worseThanA, n, tolerances.A, z);
    const verdictB = this.evaluateGradeOutcome(worseThanB, n, tolerances.B, z);
    const verdictC = this.evaluateGradeOutcome(worseThanC, n, tolerances.C, z);

    const gradeVerdicts = {
      'Grade A': verdictA,
      'Grade B': verdictB,
      'Grade C': verdictC
    };

    // Lot grade = best GREEN grade, else "Not sure yet" if any AMBER, else "Reject"
    let lotGrade = null;
    let verdictStatus = 'RED';
    let message = '';

    if (verdictA.outcome === 'GREEN') {
      lotGrade = 'Grade A';
      verdictStatus = 'GREEN';
      message = 'Sure: Grade A';
    } else if (verdictB.outcome === 'GREEN') {
      lotGrade = 'Grade B';
      verdictStatus = 'GREEN';
      message = 'Sure: Grade B';
    } else if (verdictC.outcome === 'GREEN') {
      lotGrade = 'Grade C';
      verdictStatus = 'GREEN';
      message = 'Sure: Grade C';
    } else if (
      verdictA.outcome === 'AMBER' ||
      verdictB.outcome === 'AMBER' ||
      verdictC.outcome === 'AMBER'
    ) {
      lotGrade = 'Not sure yet';
      verdictStatus = 'AMBER';
      message = 'Not sure. Check 20 more fruit.';
    } else {
      lotGrade = 'Reject';
      verdictStatus = 'RED';
      message = 'Reject';
    }

    // Price calculation: only if user typed base price and lot has definitive grade
    let pricePerKg = null;
    let priceFormula = null;
    if (basePrice !== null && basePrice > 0 && verdictStatus === 'GREEN' && lotGrade in multipliers) {
      const mult = multipliers[lotGrade];
      pricePerKg = Math.round(basePrice * mult * 100) / 100;
      priceFormula = `₹${basePrice.toFixed(2)} × ${mult.toFixed(2)} = ₹${pricePerKg.toFixed(2)}/kg`;
    }

    return {
      has_grade: verdictStatus === 'GREEN' || verdictStatus === 'RED',
      has_price: pricePerKg !== null,
      lot_grade: lotGrade,
      verdict_status: verdictStatus,
      message,
      price_per_kg: pricePerKg,
      price_formula: priceFormula,
      grade_verdicts: gradeVerdicts,
      flags,
      indicative_only: hasWarningFlag,
      report_title: reportTitle,
      out_of_grade_counts: {
        worseThanA,
        worseThanB,
        worseThanC,
        total: n
      }
    };
  }
};

// CommonJS & Browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgriGradeVerdict;
}
if (typeof window !== 'undefined') {
  window.AgriGradeVerdict = AgriGradeVerdict;
}
