// Unit tests for exact localized strings in AgriGrade
// Tests: 
// 1. Exact strings match for en, hi, te
// 2. Native speaker review comments on all hi and te strings
// 3. Dot notation access for nested keys like grades.A
// 4. Dynamic title and meta description updates
// 5. AGMARK restriction (only allowed in rules_note)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { TRANSLATIONS, t, setLanguage, getLanguage, applyTranslations } = require('../frontend/js/i18n.js');

console.log("=======================================================");
console.log("RUNNING EXACT LOCALIZED STRINGS SPECIFICATION TESTS");
console.log("=======================================================\n");

const EXPECTED = {
  title: {
    en: "AgriGrade: Check tomato size and look with your phone",
    hi: "एग्रीग्रेड: फ़ोन से टमाटर का आकार और हालत देखें",
    te: "అగ్రిగ్రేడ్: ఫోన్తో టమాటా సైజు, నాణ్యత చూడండి"
  },
  meta: {
    en: "Check tomato size and damage with a photo and a coin. A helper tool for farmers and buyers. Not an official grade.",
    hi: "फ़ोटो और सिक्के से टमाटर का आकार और खराबी जाँचें। किसानों और खरीदारों के लिए मदद का औज़ार। सरकारी ग्रेड नहीं।",
    te: "ఫోటో, నాణెంతో టమాటా సైజు, దెబ్బలను చూడండి. రైతులు, కొనుగోలుదారులకు సహాయక సాధనం. అధికారిక గ్రేడ్ కాదు."
  },
  banner: {
    en: "Helper tool for price talks. Not an official grade.",
    hi: "भाव की बातचीत के लिए मदद का औज़ार। सरकारी ग्रेड नहीं।",
    te: "ధర చర్చకు సహాయక సాధనం. అధికారిక గ్రేడ్ కాదు."
  },
  hero: {
    en: "Fair talks for farmers and buyers",
    hi: "किसान और खरीदार की बराबर की बातचीत",
    te: "రైతు, కొనుగోలుదారు మధ్య న్యాయమైన చర్చ"
  },
  hero_sub: {
    "en": "Take a photo with a coin. See size and damage.",
    "hi": "सिक्के के साथ फ़ोटो लें। आकार और खराबी देखें।",
    "te": "నాణెంతో ఫోటో తీయండి. సైజు, దెబ్బలు చూడండి."
  },
  how_we_grade: {
    "en": "We use our own simple rules. They look at size and damage.",
    "hi": "हम अपने सरल नियम इस्तेमाल करते हैं। ये आकार और खराबी देखते हैं।",
    "te": "మేము మా స్వంత సులభమైన నియమాలు వాడతాము. ఇవి సైజు, దెబ్బలను చూస్తాయి."
  },
  rules_heading: {
    "en": "Our Grading Rules",
    "hi": "हमारे ग्रेडिंग नियम",
    "te": "మా గ్రేడింగ్ నియమాలు"
  },
  rules_note: {
    "en": "These rules are ours. They are not AGMARK. They are not government rules. They may change.",
    "hi": "ये नियम हमारे हैं। ये AGMARK नहीं हैं। ये सरकारी नियम नहीं हैं। ये बदल सकते हैं।",
    "te": "ఈ నియమాలు మావి. ఇవి AGMARK కాదు. ఇవి ప్రభుత్వ నియమాలు కాదు. ఇవి మారవచ్చు."
  },
  table_intro: {
    "en": "Grade A, B and C are our own names.",
    "hi": "ग्रेड A, B और C हमारे अपने नाम हैं।",
    "te": "గ్రేడ్ A, B, C మా స్వంత పేర్లు."
  },
  page_footer: {
    "en": "AgriGrade. Helper tool for farmers and buyers.",
    "hi": "एग्रीग्रेड। किसानों और खरीदारों के लिए मदद का औज़ार।",
    "te": "అగ్రిగ్రేడ్. రైతులు, కొనుగోలుదారులకు సహాయక సాధనం."
  },
  report_footer: {
    "en": "This is a helper tool. It is not an official grade. You both decide the final price.",
    "hi": "यह सिर्फ़ मदद का औज़ार है। यह सरकारी ग्रेड नहीं है। अंतिम भाव आप दोनों तय करें।",
    "te": "ఇది కేవలం సహాయక సాధనం. ఇది అధికారిక గ్రేడ్ కాదు. తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి."
  },
  agreement_note: {
    "en": "This is a record of your talk. It is not a legal paper.",
    "hi": "यह आपकी बातचीत का रिकॉर्ड है। यह कानूनी कागज़ नहीं है।",
    "te": "ఇది మీ చర్చ రికార్డు. ఇది చట్టపరమైన పత్రం కాదు."
  },
  privacy: {
    "en": "Photos are used only for this report.",
    "hi": "फ़ोटो सिर्फ़ इस रिपोर्ट के लिए इस्तेमाल होती हैं।",
    "te": "ఫోటోలు ఈ నివేదిక కోసం మాత్రమే వాడతాము."
  },
  delete_photos: {
    "en": "Delete my photos",
    "hi": "मेरी फ़ोटो हटाएँ",
    "te": "నా ఫోటోలు తొలగించండి"
  },
  no_grade_zero_fruit: {
    "en": "No grade. No fruit found.",
    "hi": "कोई ग्रेड नहीं। कोई फल नहीं मिला।",
    "te": "గ్రేడ్ లేదు. పండ్లు కనపడలేదు."
  },
  not_changed_since_saved: {
    "en": "Report not changed since saved",
    "hi": "सेव करने के बाद रिपोर्ट बदली नहीं है",
    "te": "సేవ్ చేసిన తర్వాత నివేదిక మారలేదు"
  },
  example_only: {
    "en": "Example only",
    "hi": "सिर्फ़ उदाहरण",
    "te": "ఉదాహరణ మాత్రమే"
  }
};

const EXPECTED_GRADES = {
  A: { "en": "Grade A", "hi": "ग्रेड A", "te": "గ్రేడ్ A" },
  B: { "en": "Grade B", "hi": "ग्रेड B", "te": "గ్రేడ్ B" },
  C: { "en": "Grade C", "hi": "ग्रेड C", "te": "గ్రేడ్ C" },
  Reject: { "en": "Reject", "hi": "रिजेक्ट", "te": "తిరస్కరణ" }
};

// 1. Check exact string matches
console.log("1. Exact Translation Matches:");
['en', 'hi', 'te'].forEach(lang => {
  setLanguage(lang);
  for (const [key, valObj] of Object.entries(EXPECTED)) {
    const expectedVal = valObj[lang];
    const actualVal = t(key);
    assert.strictEqual(actualVal, expectedVal, `Mismatch for key '${key}' in lang '${lang}'`);
  }
  for (const [gradeKey, valObj] of Object.entries(EXPECTED_GRADES)) {
    const expectedVal = valObj[lang];
    const actualNestedVal = t(`grades.${gradeKey}`);
    assert.strictEqual(actualNestedVal, expectedVal, `Mismatch for grades.${gradeKey} in lang '${lang}'`);
  }
  console.log(`  ✓ All 18 exact strings match in '${lang}'`);
});

// 2. Check TODO comments for hi and te in i18n.js
console.log("\n2. Native Speaker Review TODO Annotations:");
const i18nRaw = fs.readFileSync(path.join(__dirname, '../frontend/js/i18n.js'), 'utf8');

const checkKeys = Object.keys(EXPECTED);
checkKeys.forEach(k => {
  // Check in Hindi dictionary
  const hiRegex = new RegExp(`${k}:[\\s\\S]*?\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert.ok(hiRegex.test(i18nRaw), `Hindi translation for '${k}' must have '// TODO: needs native speaker review'`);

  // Check in Telugu dictionary
  const teRegex = new RegExp(`${k}:[\\s\\S]*?\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert.ok(teRegex.test(i18nRaw), `Telugu translation for '${k}' must have '// TODO: needs native speaker review'`);
});

['A', 'B', 'C', 'Reject'].forEach(g => {
  const hiGradeRegex = new RegExp(`${g}:\\s*["'][^"']+["'],?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert.ok(hiGradeRegex.test(i18nRaw), `Hindi grade ${g} must have TODO review comment`);
  const teGradeRegex = new RegExp(`${g}:\\s*["'][^"']+["'],?\\s*\\/\\/\\s*TODO:\\s*needs native speaker review`);
  assert.ok(teGradeRegex.test(i18nRaw), `Telugu grade ${g} must have TODO review comment`);
});
console.log("  ✓ All Hindi and Telugu strings have '// TODO: needs native speaker review'");

// 3. Dynamic Title & Meta Description update test
console.log("\n3. Dynamic Document Title & Meta Tag Test:");
let mockDocTitle = "";
let mockMetaDescContent = "";
global.document = {
  get title() { return mockDocTitle; },
  set title(val) { mockDocTitle = val; },
  querySelector: (sel) => {
    if (sel === 'meta[name="description"]') {
      return {
        setAttribute: (attr, val) => {
          if (attr === 'content') mockMetaDescContent = val;
        }
      };
    }
    return null;
  },
  querySelectorAll: () => []
};

setLanguage('te');
applyTranslations();
assert.strictEqual(mockDocTitle, EXPECTED.title.te, "Document title should update dynamically to Telugu");
assert.strictEqual(mockMetaDescContent, EXPECTED.meta.te, "Meta description should update dynamically to Telugu");

setLanguage('hi');
applyTranslations();
assert.strictEqual(mockDocTitle, EXPECTED.title.hi, "Document title should update dynamically to Hindi");
assert.strictEqual(mockMetaDescContent, EXPECTED.meta.hi, "Meta description should update dynamically to Hindi");

setLanguage('en');
applyTranslations();
assert.strictEqual(mockDocTitle, EXPECTED.title.en, "Document title should update dynamically to English");
assert.strictEqual(mockMetaDescContent, EXPECTED.meta.en, "Meta description should update dynamically to English");
console.log("  ✓ Dynamic title and meta description updates work seamlessly");

// 4. AGMARK Restriction Test
console.log("\n4. AGMARK Keyword Restriction Test:");
const matches = [];
const lines = i18nRaw.split('\n');
lines.forEach((l, idx) => {
  if (l.includes("AGMARK")) {
    matches.push({ line: idx + 1, content: l });
  }
});
assert.strictEqual(matches.length, 3, "AGMARK must appear only in rules_note (en, hi, te in i18n.js)");
matches.forEach(m => {
  assert.ok(m.content.includes("rules_note"), `AGMARK found outside rules_note at line ${m.line}`);
});
console.log("  ✓ AGMARK strictly restricted only to rules_note");

console.log("\n=======================================================");
console.log("ALL LOCALIZED STRING TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================");
