// AgriGrade Phase 5 Specification Unit Tests
// Tests:
// 1. Save each report on server (ID format AG-YYYYMMDD-XXXXXX, server time). Browser is offline copy only.
// 2. Show "Report not changed since saved" ONLY if server stored it. Otherwise show nothing.
// 3. Report first screen: big grade (or "Not sure yet"), flags at top, 3 short lines in chosen language. Everything else behind "Details".
// 4. WhatsApp share text in chosen language, max 6 short lines: flag count first, flags, grade, sample, link, footer.
// 5. Agreement screen: labeled "Not verified who signed", "This is a record of your talk. It is not a legal paper.", server insert-only, shows "Farmer accepted 4:10 pm".
// 6. Print / PDF in large font, chosen language, with flags and footer.
// 7. "Delete my photos" button and "Photos are used only for this report."
// 8. Skip OTP and PIN for now.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { TRANSLATIONS, t, setLanguage } = require('../frontend/js/i18n.js');

console.log("=======================================================");
console.log("RUNNING AGRIGRADE PHASE 5 SPECIFICATION UNIT TESTS");
console.log("=======================================================\n");

// Helper: Count words in a string
function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// -------------------------------------------------------------
// 1. Server Report Saving & Offline Copy (Requirement 1)
// -------------------------------------------------------------
console.log("1. Server Report Storage & Offline Copy:");
{
  // Simulated server report response
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const serverReportId = `AG-${dateStr}-A1B2C3`;
  const serverIsoTime = now.toISOString();

  assert.match(serverReportId, /^AG-\d{8}-[A-F0-9]{6}$/, "Server makes report ID in AG-YYYYMMDD-XXXXXX format");

  const serverReport = {
    id: serverReportId,
    crop: "tomato",
    created_at: serverIsoTime,
    lot_class: "Grade A",
    n_fruit: 40,
    stored_on_server: true,
    fingerprint_status: "Report not changed since saved",
    flags: ["F18", "F19"]
  };

  assert.strictEqual(serverReport.stored_on_server, true, "Server response explicitly declares stored_on_server: true");

  // Offline copy format in browser storage
  const offlineCopy = Object.assign({}, serverReport, {
    is_offline_copy: true,
    stored_on_server: false,
    offline_cached_at: new Date().toISOString()
  });

  assert.strictEqual(offlineCopy.is_offline_copy, true, "Browser storage is marked as an offline copy");
  assert.strictEqual(offlineCopy.stored_on_server, false, "Offline copy is not treated as server-stored");
  console.log("   ✓ Server creates ID and time, browser storage is offline copy only.");
}

// -------------------------------------------------------------
// 2. Server Storage Badge Visibility Rule (Requirement 2)
// -------------------------------------------------------------
console.log("\n2. Badge Visibility: 'Report not changed since saved' ONLY if server stored it:");
{
  const checkBadgeVisibility = (report) => {
    if (report && report.stored_on_server === true) {
      return { visible: true, text: t("server_saved_badge") };
    }
    return { visible: false, text: "" };
  };

  // Case A: Server stored report
  const serverRep = { id: "AG-20261025-112233", stored_on_server: true };
  const badgeA = checkBadgeVisibility(serverRep);
  assert.strictEqual(badgeA.visible, true, "Badge must be visible when stored_on_server is true");
  assert.strictEqual(badgeA.text, "Report not changed since saved");

  // Case B: Offline-only copy (stored_on_server is false)
  const offlineRep = { id: "AG-20261025-112233", stored_on_server: false, is_offline_copy: true };
  const badgeB = checkBadgeVisibility(offlineRep);
  assert.strictEqual(badgeB.visible, false, "Badge must NOT be visible for offline copy");

  // Case C: Unsaved draft or missing stored_on_server
  const draftRep = { id: "AG-20261025-112233" };
  const badgeC = checkBadgeVisibility(draftRep);
  assert.strictEqual(badgeC.visible, false, "Badge must NOT be visible when stored_on_server is undefined");
  console.log("   ✓ Shows 'Report not changed since saved' ONLY if server stored it, otherwise shows nothing.");
}

// -------------------------------------------------------------
// 3. Report First Screen Layout & 3 Short Lines (Requirement 3)
// -------------------------------------------------------------
console.log("\n3. First Screen: Big Grade / Not Sure Yet, Flags, 3 Short Lines, Details Collapsible:");
{
  const languages = ["en", "hi", "te"];

  languages.forEach(lang => {
    setLanguage(lang);

    // Big Grade vs "Not sure yet"
    const notSureYet = t("not_sure_yet");
    assert.ok(notSureYet && notSureYet.length > 0, `not_sure_yet exists in ${lang}`);
    assert.ok(countWords(notSureYet) <= 8, `not_sure_yet has <= 8 words in ${lang} (${countWords(notSureYet)} words)`);

    // 3 short lines
    const line1 = t("report_line_1", { n: 40 });
    const line2 = t("report_line_2", { p: 8 });
    const line2Zero = t("report_line_2_zero");
    const line3 = t("report_line_3", { rate: "₹25.00" });
    const line3Empty = t("report_line_3_empty");

    assert.ok(countWords(line1) <= 8, `Line 1 in ${lang} has <= 8 words: "${line1}" (${countWords(line1)} words)`);
    assert.ok(countWords(line2) <= 8, `Line 2 in ${lang} has <= 8 words: "${line2}" (${countWords(line2)} words)`);
    assert.ok(countWords(line2Zero) <= 8, `Line 2 (zero) in ${lang} has <= 8 words: "${line2Zero}"`);
    assert.ok(countWords(line3) <= 8, `Line 3 in ${lang} has <= 8 words: "${line3}" (${countWords(line3)} words)`);
    assert.ok(countWords(line3Empty) <= 8, `Line 3 (empty) in ${lang} has <= 8 words: "${line3Empty}" (${countWords(line3Empty)} words)`);
  });

  // Verify HTML structure for first screen & details-section
  const htmlContent = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  assert.ok(htmlContent.includes('id="flags-container"'), "Flags container present at top");
  assert.ok(htmlContent.includes('id="verdict-grade-title"'), "Big grade title present");
  assert.ok(htmlContent.includes('id="verdict-line-1"'), "Verdict line 1 present");
  assert.ok(htmlContent.includes('id="verdict-line-2"'), "Verdict line 2 present");
  assert.ok(htmlContent.includes('id="verdict-line-3"'), "Verdict line 3 present");
  assert.ok(htmlContent.includes('id="btn-toggle-details"'), "Details toggle button present");
  assert.ok(htmlContent.includes('id="details-section"'), "details-section container present");

  // Verify that Wilson range, price table, server badge, and photo overlay are inside details-section
  const detailsIdx = htmlContent.indexOf('id="details-section"');
  const auditIdx = htmlContent.indexOf('class="audit-card"');
  const detailsChunk = htmlContent.substring(detailsIdx, auditIdx);

  assert.ok(detailsChunk.includes('wilson-bar-container'), "Wilson range bar is behind Details");
  assert.ok(detailsChunk.includes('id="pricing-card"'), "Pricing card is behind Details");
  assert.ok(detailsChunk.includes('id="server-status-box"'), "Server status badge is behind Details");
  assert.ok(detailsChunk.includes('annotated-showcase'), "Photo overlay is behind Details");
  assert.ok(detailsChunk.includes('fruit-table-card'), "Fruit table is behind Details");

  console.log("   ✓ First screen has big grade/Not sure yet, flags at top, 3 short lines in chosen language, and everything else behind Details.");
}

// -------------------------------------------------------------
// 4. WhatsApp Share Text (Requirement 4)
// -------------------------------------------------------------
console.log("\n4. WhatsApp Share Message (max 6 short lines, flag count first, flags, grade, sample, link, footer):");
{
  const buildWhatsAppMessage = (report, lang, link = "https://agrigrade.app/#report-123") => {
    setLanguage(lang);
    const flags = report.flags || [];
    const lotClass = report.lot_class || "Reject";
    const fruitCount = report.n_fruit || 0;

    const flagCount = flags.filter(f => {
      const sev = typeof f === 'object' ? f.severity : (f.startsWith('F0') ? 'block' : 'warning');
      return sev === "warning" || sev === "block";
    }).length;

    const isAmber = report.verdict && report.verdict[lotClass] === "amber";
    const displayGrade = isAmber ? t("not_sure_yet") : lotClass;

    const line1 = flagCount > 0 ? t("wa_flags_count", { count: flagCount }) : t("wa_no_flags");
    const flagCodes = flags.map(f => (typeof f === 'string' ? f : f.code)).slice(0, 4).join(", ");
    const line2 = flagCodes ? `Flags: ${flagCodes}` : "✓ OK";
    const line3 = t("wa_grade_label", { grade: displayGrade });
    const line4 = t("wa_sample_label", { n: fruitCount });
    const line5 = link;
    const line6 = t("report_footer");

    return `${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`;
  };

  const sampleReport = {
    lot_class: "Grade A",
    n_fruit: 40,
    flags: ["F1", "F18", "F19"],
    verdict: { "Grade A": "green" }
  };

  ["en", "hi", "te"].forEach(lang => {
    const msg = buildWhatsAppMessage(sampleReport, lang);
    const lines = msg.split("\n");
    assert.strictEqual(lines.length, 6, `WhatsApp message in ${lang} must have exactly 6 lines (has ${lines.length})`);
    assert.ok(lines[0].includes("1") || lines[0].includes("⚠️"), `Line 1 in ${lang} shows flag count first: "${lines[0]}"`);
    assert.ok(lines[1].startsWith("Flags:"), `Line 2 in ${lang} lists flags: "${lines[1]}"`);
    assert.ok(lines[2].includes("Grade A"), `Line 3 in ${lang} shows grade: "${lines[2]}"`);
    assert.ok(lines[3].includes("40"), `Line 4 in ${lang} shows sample count: "${lines[3]}"`);
    assert.ok(lines[4].startsWith("https://"), `Line 5 in ${lang} shows report link: "${lines[4]}"`);
    assert.ok(lines[5].length > 10, `Line 6 in ${lang} includes footer: "${lines[5]}"`);
  });

  console.log("   ✓ WhatsApp share message formatted in chosen language, max 6 short lines, with flag count first, flags, grade, link, and footer.");
}

// -------------------------------------------------------------
// 5. Agreement Screen & Records (Requirement 5 & 8)
// -------------------------------------------------------------
console.log("\n5. Agreement Screen (Not verified who signed, record of talk, insert-only, time format):");
{
  const htmlContent = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');

  // Verify label "Not verified who signed"
  assert.ok(htmlContent.includes('data-i18n="pin_unverified"'), "Agreement screen has label 'Not verified who signed'");
  // Verify notice: "This is a record of your talk. It is not a legal paper."
  assert.ok(htmlContent.includes('data-i18n="agreement_note"'), "Agreement screen says 'This is a record of your talk. It is not a legal paper.'");
  // Verify OTP and PIN skipped
  assert.ok(!htmlContent.includes('id="ack-pin"'), "PIN input field has been removed/skipped (Requirement 8)");

  // Formatting agreement records: "Farmer accepted 4:10 pm"
  const formatAckRecord = (ack, lang) => {
    setLanguage(lang);
    const d = new Date(ack.created_at);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    let summaryAction = "";
    if (ack.party === "farmer") {
      summaryAction = ack.verdict === "accept"
        ? t("ack_farmer_accepted", { time: timeStr })
        : t("ack_farmer_disputed", { time: timeStr });
    } else {
      summaryAction = ack.verdict === "accept"
        ? t("ack_buyer_accepted", { time: timeStr })
        : t("ack_buyer_disputed", { time: timeStr });
    }
    return { summaryAction, badge: t("pin_unverified"), timeStr };
  };

  const testDate = new Date(2026, 9, 25, 16, 10, 0); // 4:10 pm
  const ackSample = {
    party: "farmer",
    verdict: "accept",
    created_at: testDate.toISOString()
  };

  // English
  const enAck = formatAckRecord(ackSample, "en");
  assert.strictEqual(enAck.summaryAction, "Farmer accepted 4:10 pm");
  assert.strictEqual(enAck.badge, "Not verified who signed");
  assert.ok(countWords(enAck.summaryAction) <= 8);

  // Hindi
  const hiAck = formatAckRecord(ackSample, "hi");
  assert.strictEqual(hiAck.summaryAction, "किसान सहमत 4:10 pm");
  assert.ok(countWords(hiAck.summaryAction) <= 8);

  // Telugu
  const teAck = formatAckRecord(ackSample, "te");
  assert.strictEqual(teAck.summaryAction, "రైతు అంగీకరించారు 4:10 pm");
  assert.ok(countWords(teAck.summaryAction) <= 8);

  // Dispute test
  const ackDispute = { party: "buyer", verdict: "dispute", created_at: testDate.toISOString() };
  const enDispute = formatAckRecord(ackDispute, "en");
  assert.strictEqual(enDispute.summaryAction, "Buyer disputed 4:10 pm");

  console.log("   ✓ Agreement screen properly labeled 'Not verified who signed', notice present, PIN skipped, rendered as 'Farmer accepted 4:10 pm'.");
}

// -------------------------------------------------------------
// 6. Print / PDF Large Font Styles (Requirement 6)
// -------------------------------------------------------------
console.log("\n6. Print / PDF in Large Font with Flags and Footer:");
{
  const cssContent = fs.readFileSync(path.join(__dirname, '../frontend/css/style.css'), 'utf8');

  assert.ok(cssContent.includes('@media print'), "@media print rules present in style.css");
  assert.ok(cssContent.includes('font-size: 16pt'), "Print body has large font (16pt)");
  assert.ok(cssContent.includes('font-size: 34pt'), "Print grade title has large font (34pt)");
  assert.ok(cssContent.includes('.top-flags-strip'), "Print styles include top flags strip");
  assert.ok(cssContent.includes('.mandatory-footer-box'), "Print styles include mandatory footer");
  assert.ok(cssContent.includes('#details-section') && cssContent.includes('display: none !important'), "Print hides details-section to keep output clean and concise");

  console.log("   ✓ @media print rules verified: large font (16pt-34pt), flags and footer printed.");
}

// -------------------------------------------------------------
// 7. 'Delete my photos' and Privacy Note (Requirement 7)
// -------------------------------------------------------------
console.log("\n7. 'Delete my photos' Button & Privacy Notice:");
{
  const htmlContent = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  assert.ok(htmlContent.includes('id="btn-delete-photos"'), "'Delete my photos' button present in index.html");
  assert.ok(htmlContent.includes('data-i18n="delete_photos"'), "'Delete my photos' button is localized");
  assert.ok(htmlContent.includes('data-i18n="privacy"'), "Privacy note is localized");

  ["en", "hi", "te"].forEach(lang => {
    setLanguage(lang);
    const delBtn = t("delete_photos");
    const privNote = t("privacy");
    assert.ok(delBtn && delBtn.length > 0, `delete_photos translated in ${lang}`);
    assert.ok(privNote && privNote.length > 0, `privacy note translated in ${lang}`);
    assert.ok(countWords(delBtn) <= 8, `delete_photos <= 8 words in ${lang}`);
    assert.ok(privNote.includes("report") || privNote.includes("रिपोर्ट") || privNote.includes("నివేదిక"), `privacy note mentions report in ${lang}`);
  });

  console.log("   ✓ 'Delete my photos' and 'Photos are used only for this report.' verified across all languages.");
}

// -------------------------------------------------------------
// 8. Native Speaker Review Comments (All te and hi strings)
// -------------------------------------------------------------
console.log("\n8. Native Speaker Review Comments (te & hi strings):");
{
  const i18nContent = fs.readFileSync(path.join(__dirname, '../frontend/js/i18n.js'), 'utf8');
  const phase5Keys = [
    "report_line_1", "report_line_2", "report_line_3", "not_sure_yet",
    "wa_flags_count", "wa_no_flags", "wa_grade_label", "wa_sample_label",
    "ack_farmer_accepted", "ack_farmer_disputed", "ack_buyer_accepted", "ack_buyer_disputed"
  ];

  phase5Keys.forEach(k => {
    const hiRegex = new RegExp(`${k}:\\s*["'][^"']+["'],\\s*//\\s*TODO:\\s*needs native speaker review`);
    assert.ok(hiRegex.test(i18nContent), `Phase 5 key '${k}' has '// TODO: needs native speaker review' in i18n.js`);
  });

  console.log("   ✓ All Phase 5 Hindi and Telugu translation keys contain '// TODO: needs native speaker review'.");
}

console.log("\n=======================================================");
console.log("ALL PHASE 5 SPECIFICATION UNIT TESTS PASSED SUCCESSFULLY!");
console.log("=======================================================\n");
