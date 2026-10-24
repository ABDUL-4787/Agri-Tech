// AgriGrade Fruit View Matcher (Photo A stem-up <-> Photo B stem-down)
// Requirements:
// 1. matchFruit(A, B): sort by row then column, confirm with nearest centroid.
//    For each fruit keep the WORSE view (higher defect %, worse grade).
// 2. If fruit counts differ by more than 1: flag F8, block, "Retake Photo B".

const AgriGradeMatch = (() => {
  const GRADE_RANKS = {
    'Grade A': 1, 'GRADE A': 1, 'A': 1,
    'Grade B': 2, 'GRADE B': 2, 'B': 2,
    'Grade C': 3, 'GRADE C': 3, 'C': 3,
    'Reject': 4, 'REJECT': 4
  };

  const RANK_TO_GRADE = {
    1: 'Grade A',
    2: 'Grade B',
    3: 'Grade C',
    4: 'Reject'
  };

  const getFruitCoordinates = (f) => {
    if (!f) return { x: 0, y: 0 };
    if (typeof f.x === 'number' && typeof f.y === 'number') {
      return { x: f.x, y: f.y };
    }
    if (Array.isArray(f.center)) {
      return { x: f.center[0] || 0, y: f.center[1] || 0 };
    }
    if (f.centroid) {
      if (typeof f.centroid.x === 'number' && typeof f.centroid.y === 'number') {
        return { x: f.centroid.x, y: f.centroid.y };
      }
      if (Array.isArray(f.centroid)) {
        return { x: f.centroid[0] || 0, y: f.centroid[1] || 0 };
      }
    }
    if (Array.isArray(f.bbox) && f.bbox.length >= 4) {
      return { x: f.bbox[0] + f.bbox[2] / 2, y: f.bbox[1] + f.bbox[3] / 2 };
    }
    return { x: 0, y: 0 };
  };

  const getFruitDefectPct = (f) => {
    if (!f) return 0;
    if (typeof f.defectPercent === 'number') return f.defectPercent;
    if (typeof f.defect_area_pct === 'number') return f.defect_area_pct;
    if (typeof f.defect_percent === 'number') return f.defect_percent;
    if (typeof f.defects === 'number') return f.defects;
    return 0;
  };

  const getFruitGradeName = (f) => {
    if (!f) return 'Grade A';
    return f.grade || f.quality_class || f.qualityClass || 'Grade A';
  };

  const getWorseGrade = (g1, g2) => {
    const r1 = GRADE_RANKS[g1] || 4;
    const r2 = GRADE_RANKS[g2] || 4;
    const worseRank = Math.max(r1, r2);
    return RANK_TO_GRADE[worseRank] || 'Reject';
  };

  // Sorts a list of fruits by row then column
  const sortFruitsByRowThenColumn = (fruits) => {
    if (!fruits || fruits.length === 0) return [];
    if (fruits.length === 1) return [...fruits];

    const items = fruits.map((f, idx) => ({
      fruit: f,
      originalIndex: idx,
      coord: getFruitCoordinates(f)
    }));

    // Sort initially by y ascending
    items.sort((a, b) => a.coord.y - b.coord.y);

    const minY = items[0].coord.y;
    const maxY = items[items.length - 1].coord.y;
    const rangeY = maxY - minY;

    const rowThreshold = rangeY > 0
      ? (maxY <= 1.5 ? Math.max(0.06, rangeY / 5) : Math.max(25, rangeY / 5))
      : 10;

    const rows = [];
    let currentRow = [items[0]];

    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const prev = items[i - 1];
      if (Math.abs(item.coord.y - prev.coord.y) > rowThreshold) {
        rows.push(currentRow);
        currentRow = [item];
      } else {
        currentRow.push(item);
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    // Sort each row by x ascending
    const sorted = [];
    rows.forEach(r => {
      r.sort((a, b) => a.coord.x - b.coord.x);
      r.forEach(item => sorted.push(item.fruit));
    });

    return sorted;
  };

  // Match fruit between Photo A and Photo B
  const matchFruit = (fruitsA = [], fruitsB = []) => {
    const na = fruitsA.length;
    const nb = fruitsB.length;
    const countDiff = Math.abs(na - nb);

    const flags = [];
    let isBlocked = false;
    let reason = null;

    // Requirement 2: If fruit counts differ by more than 1: flag F8, block, "Retake Photo B"
    if (countDiff > 1) {
      flags.push('F8');
      isBlocked = true;
      reason = 'Retake Photo B';
      const emptyResult = [];
      emptyResult.flags = flags;
      emptyResult.isBlocked = true;
      emptyResult.reason = reason;
      emptyResult.matched = [];
      emptyResult.fruits = [];
      return emptyResult;
    }

    // Sort both sets by row then column
    const sortedA = sortFruitsByRowThenColumn(fruitsA);
    const sortedB = sortFruitsByRowThenColumn(fruitsB);

    // Confirm correspondence with nearest centroid matching
    const matchedResults = [];
    const usedBIndices = new Set();

    for (let i = 0; i < sortedA.length; i++) {
      const fa = sortedA[i];
      const ptA = getFruitCoordinates(fa);

      let bestDist = Infinity;
      let bestBIndex = -1;

      for (let j = 0; j < sortedB.length; j++) {
        if (usedBIndices.has(j)) continue;
        const ptB = getFruitCoordinates(sortedB[j]);
        const dx = ptA.x - ptB.x;
        const dy = ptA.y - ptB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bestDist) {
          bestDist = dist;
          bestBIndex = j;
        }
      }

      if (bestBIndex !== -1) {
        usedBIndices.add(bestBIndex);
        const fb = sortedB[bestBIndex];

        // Worse view: higher defect %, worse grade
        const defA = getFruitDefectPct(fa);
        const defB = getFruitDefectPct(fb);
        const worseDefect = Math.max(defA, defB);

        const gradeA = getFruitGradeName(fa);
        const gradeB = getFruitGradeName(fb);
        const worseGrade = getWorseGrade(gradeA, gradeB);

        const diamA = fa.diameter_mm || fa.diameter || null;
        const diamB = fb.diameter_mm || fb.diameter || null;
        let avgDiam = null;
        if (diamA && diamB) {
          avgDiam = Math.round(((diamA + diamB) / 2) * 10) / 10;
        } else {
          avgDiam = diamA || diamB;
        }

        const merged = {
          ...fa,
          id: fa.id || i + 1,
          fruit_id: i + 1,
          defectPercent: worseDefect,
          defect_area_pct: worseDefect,
          grade: worseGrade,
          quality_class: worseGrade,
          diameter_mm: avgDiam,
          viewMatched: true,
          view_matched: true,
          viewSurfaceSeen: 85,
          view_surface_seen_pct: 85,
          viewA: { defectPercent: defA, grade: gradeA, coord: ptA },
          viewB: { defectPercent: defB, grade: gradeB, coord: getFruitCoordinates(fb) }
        };

        matchedResults.push(merged);
      } else {
        // Unmatched fruit from A (when B has 1 fewer fruit)
        const defA = getFruitDefectPct(fa);
        const gradeA = getFruitGradeName(fa);
        const single = {
          ...fa,
          id: fa.id || i + 1,
          fruit_id: i + 1,
          defectPercent: defA,
          defect_area_pct: defA,
          grade: gradeA,
          quality_class: gradeA,
          viewMatched: false,
          view_matched: false,
          viewSurfaceSeen: 45,
          view_surface_seen_pct: 45
        };
        matchedResults.push(single);
      }
    }

    // Any unmatched fruit from B (when A has 1 fewer fruit)
    for (let j = 0; j < sortedB.length; j++) {
      if (!usedBIndices.has(j)) {
        const fb = sortedB[j];
        const defB = getFruitDefectPct(fb);
        const gradeB = getFruitGradeName(fb);
        const single = {
          ...fb,
          id: fb.id || matchedResults.length + 1,
          fruit_id: matchedResults.length + 1,
          defectPercent: defB,
          defect_area_pct: defB,
          grade: gradeB,
          quality_class: gradeB,
          viewMatched: false,
          view_matched: false,
          viewSurfaceSeen: 45,
          view_surface_seen_pct: 45
        };
        matchedResults.push(single);
      }
    }

    matchedResults.flags = flags;
    matchedResults.isBlocked = isBlocked;
    matchedResults.reason = reason;
    matchedResults.matched = matchedResults;
    matchedResults.fruits = matchedResults;

    return matchedResults;
  };

  return {
    matchFruit,
    sortFruitsByRowThenColumn,
    getWorseGrade,
    getFruitCoordinates,
    getFruitDefectPct,
    getFruitGradeName
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...AgriGradeMatch,
    matchFruit: AgriGradeMatch.matchFruit
  };
}
if (typeof window !== 'undefined') {
  window.AgriGradeMatch = AgriGradeMatch;
  window.matchFruit = AgriGradeMatch.matchFruit;
}
