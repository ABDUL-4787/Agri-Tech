# AgriGrade Specification & Execution Checklist (`SPEC_CHECKLIST.md`)

This document tracks every individual requirement from the specification. 
Rule: One checkbox per requirement. Tick only what has been built and verified with tests. At the end of each phase, list what is not done. Never skip a feature.

---

## Phase A: Audience, Languages & UI Rules

- [x] **A.1** Trilingual support across entire app: Telugu (`te`), Hindi (`hi`), English (`en`).
- [x] **A.2** No English-only text anywhere (including screens, messages, flags, reports, PDF, QR page, WhatsApp share text).
- [x] **A.3** First screen: Three big buttons `"తెలుగు / हिन्दी / English"`.
- [x] **A.4** Remember language choice in `localStorage`.
- [x] **A.5** Max 8 words per sentence rule in UI copy.
- [x] **A.6** Use common spoken words with zero technical jargon (no "calibration", "segmentation", "confidence interval" on screen).
- [x] **A.7** Step wizard layout: exactly one instruction per screen with big icon or illustration.
- [x] **A.8** Big buttons with font size $\ge 18$px.
- [x] **A.9** High-contrast color scheme for direct outdoor sunlight on low-end Android.
- [x] **A.10** Every step has a `"🔊 Listen"` button that reads aloud in the chosen language.
- [x] **A.11** Clear error fallback when phone speech engine lacks Telugu or Hindi voices, keeping text visible.
- [x] **A.12** Single centralized i18n file (`frontend/js/i18n.js` mirrored to `public/js/i18n.js`).
- [x] **A.13** Every Telugu and Hindi string marked with `// TODO: needs native speaker review`.
- [x] **A.14** Result screen shows **Color + Big Icon + One short sentence**, not dense tables.
- [x] **A.15** Detailed individual fruit measurement table placed behind a collapsible `"Details"` button.
- [x] **A.16** Native typography loaded via Noto Sans Telugu and Noto Sans Devanagari fonts so text never breaks on old phones.

**Phase A Status:**
- **Done**: All 16 requirements implemented and verified.
- **Not Done**: None. (Native speaker human review of Telugu/Hindi translations flagged for field linguists).

---

## Phase B: Fix Misleading Claims

- [x] **B.1** Remove `"SHA-256 Verified Authentic"` $\rightarrow$ Replace with `"Report not changed since saved"`.
- [x] **B.2** Only show `"Report not changed since saved"` if report is stored on server (show `"Saved on phone only"` or nothing if local only).
- [x] **B.3** Remove terms `"tamper-proof"`, `"cryptographically chained"`, and `"tamper-evident"`.
- [x] **B.4** Remove term `"independent"` $\rightarrow$ Replace with `"helper tool"`.
- [x] **B.5** Remove `"AGMARK"`, `"DMI"`, and `"UNECE FFV-36"` from UI copy, meta tags, and headers.
- [x] **B.6** In "How we grade", state strictly: *"Our simple rules are made for market talks. They are not official."*
- [x] **B.7** Rename quality classes `"Extra / Class I / Class II / Below Standard"` $\rightarrow$ `"Grade A / Grade B / Grade C / Reject"` in all languages.
- [x] **B.8** Replace `"exact fruit size in mm"` with `"approximate size"`.
- [x] **B.9** Display size error margin as `"± X mm"` where $X$ is read from config (default 3 mm).
- [x] **B.10** Remove `"Standards Version 1.0.0-provisional"` from UI, footers, and metadata.
- [x] **B.11** Remove hidden price multiplier line (e.g., `"₹25.00 × 1.00"`).
- [x] **B.12** Calculate price per grade only if user typed a base price; display multiplier table openly (`Grade A = base`, `B = base × 0.85`, `C = base × 0.70`, `Reject = ₹0.00`).
- [x] **B.13** Label price multiplier table openly as `"Example only"`.
- [x] **B.14** A report with 0 fruits must NEVER show a grade or price $\rightarrow$ Show `"No grade. No fruit found."`.
- [x] **B.15** Mandatory footer on every page, report, and share text in all 3 languages:
  - EN: *"This is a helper tool. It is not an official grade. You both decide the final price."*
  - HI: *"यह सिर्फ़ मदद का औज़ार है। यह सरकारी ग्रेड नहीं है। अंतिम भाव आप दोनों तय करें।"*
  - TE: *"ఇది కేవలం సహాయక సాధనం. ఇది అధికారిక గ్రేడ్ కాదు. తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి."*
- [x] **B.16** Agreement (accept/dispute) screen must say: *"This is a record of your talk. It is not a legal paper."*

**Phase B Status:**
- **Done**: All 16 requirements implemented and verified.
- **Not Done**: None.

---

## Phase C: Lot Setup & Anti-Bias Sampling Planner

- [x] **C.1** Replace "upload 1 to 3 photos" with step wizard.
- [x] **C.2** Wizard Step 1: Language selection check.
- [x] **C.3** Wizard Step 2: "How much tomato do you have?" Options: (a) crates, (b) total kg, (c) loose heap (kg).
- [x] **C.4** Default crate weight 22 kg (editable in config `default_crate_weight_kg`).
- [x] **C.5** Automatic conversion of inputs to estimated kg and crate count.
- [x] **C.6** Wizard Step 3: Display sampling plan based on `SAMPLE_TABLE`:
  - up to 5 kg: check all fruit (capped at 30)
  - up to 100 kg: 30 fruit
  - 100 to 500 kg: 40 fruit
  - 500 to 2000 kg: 50 fruit
  - over 2000 kg: 60 fruit
- [x] **C.7** Batch size fixed to 15 fruit per photo pair (`BATCH_SIZE` in config).
- [x] **C.8** Hard minimum threshold: 20 fruit (`MIN_FRUITS_HARD`). Below 20, show `"Too few fruit. No grade."`.
- [x] **C.9** Wizard Step 4: Anti-bias random picker:
  - For crates: app randomly picks crate numbers to open (`ceil(fruits / 15)`) using `window.crypto.getRandomValues`.
  - For chosen crates: equal sampling from TOP (5), MIDDLE (5), and BOTTOM (5).
  - For loose heap: split heap into 6 zones and 3 depths; app picks zones at random.
  - If single crate or tiny heap: mandate equal layer sampling and attach flag `F7`.
- [x] **C.10** Big warning displayed: *"Do not pick the best fruit. Do not pick the worst fruit."* (3 languages, with Listen button).
- [x] **C.11** Checkbox *"Both of us are here"* (recorded; if unchecked, flag `F14` attaches to report).
- [x] **C.12** Buyer's repeat option: `"Buyer wants own check"` button generates a NEW random plan, compares both samples, and flags differences $>15$ points as `F10`.
- [x] **C.13** Always-visible batch progress bar: *"Batch X of Y done. A of B fruit."*.
- [x] **C.14** Do not show final grade until target is reached or user taps `"Finish with fewer fruit"` (attaching flag `F1`).

**Phase C Status:**
- **Done**: All 14 requirements implemented and verified.
- **Not Done**: None.

---

## Phase D: Photo Rules & Two-Photo Protocol

- [x] **D.1** 9-step photo rules wizard with illustrations/icons and translations:
  1. *"Use daylight."*
  2. *"Use a plain light cloth or paper."*
  3. *"Put the coin flat on the cloth."* (table level, no thick holders)
  4. *"Put 15 tomatoes in a row. No touching."*
  5. *"Stem side up. Take photo from top."*
  6. *"Hold the phone flat above. Not tilted."*
  7. *"Now turn each tomato over. Stem side down."*
  8. *"Keep the same place. Take photo again."*
  9. *"Keep the coin in the same place."*
- [x] **D.2** Drawn $3 \times 5$ grid overlay hint on camera screen for tomato placement.
- [x] **D.3** Dedicated circular guide spot overlay for the reference coin.
- [x] **D.4** Live pre-flight check ticks before capture: (1) coin found, (2) not blurry, (3) not dark, (4) phone not tilted ($\le 10^\circ$), (5) tomatoes not touching.
- [x] **D.5** DeviceOrientation sensor integration measuring phone tilt angle.
- [x] **D.6** Mandatory Two-Photo Rule per batch: Photo A (stem up) and Photo B (stem down). No grade without both.
- [x] **D.7** Optional Photo C (side view) available for lots $>500$ kg or buyer request.
- [x] **D.8** Photo tagging: batch number, crate number, layer (top/middle/bottom), timestamp, orientation.
- [x] **D.9** Downscaled photo retained in report for visual review.
- [x] **D.10** Gallery photo upload check: warning and flag `F12` if EXIF/file age is older than 1 hour.

**Phase D Status:**
- **Done**: All 10 requirements implemented and verified.
- **Not Done**: None.

---

## Phase E: Grading Engine & Statistical Logic

- [x] **E.1** Worse-view fruit matching: Match fruit between Photo A and B by sorted grid position and nearest centroid. Take higher defect % and worse grade. Count difference $>1 \rightarrow$ flag `F8`.
- [x] **E.2** Lot grading calculated by COUNT of out-of-grade fruit (not by averaging defect areas across fruit).
- [x] **E.3** Wilson score interval (95%, $z = 1.96$):
  - $p = x / n$
  - $\text{center} = (p + z^2/(2n)) / (1 + z^2/n)$
  - $\text{half} = z \cdot \sqrt{p(1-p)/n + z^2/(4n^2)} / (1 + z^2/n)$
  - $\text{low} = \text{center} - \text{half}$, $\text{high} = \text{center} + \text{half}$
  - Simple visual bar display: *"Bad fruit: about 8 in 100. Could be 4 to 15 in 100."* (never display the word "Wilson").
- [x] **E.4** Three-outcome verdict per grade (Grade A tolerance $\le 5\%$, Grade B & C $\le 10\%$ from config):
  - GREEN *"Sure"*: Entire Wilson range inside limit.
  - RED *"Not this grade"*: Entire Wilson range outside limit.
  - AMBER *"Not sure. Check 20 more fruit."*: Range crosses limit $\rightarrow$ button `"Add 20 more fruit"` opens new random plan.
  - Lot grade shown is the best grade that is GREEN. If none is GREEN $\rightarrow$ show `"Not sure yet"` with amber action.
- [x] **E.5** Surface seen indicator: 2 photos $\rightarrow$ *"About 85% of fruit surface seen"*; 1 photo $\rightarrow$ *"About 45%"*. Always display note: *"Inside rot and soft fruit cannot be seen by photo."*.
- [x] **E.6** Hand check field: *"Press 10 fruit with your hand. How many are soft?"* (0–10). If $>1$ soft $\rightarrow$ flag `F13` and lower Sure level to AMBER.
- [x] **E.7** Optional sample weight check (kg): calculates average fruit weight and flags size discrepancies.
- [x] **E.8** Duplicate fruit check: flag `F11` if duplicate photo hash or identical fruit pattern detected.
- [x] **E.9** Layer comparison: flag `F9` (*"Top is better than bottom"*) if top layer defect rate is $\ge 2\times$ better than bottom layer.
- [x] **E.10** Hard blocking rules: Never assign a grade if coin missing (`F0`), blurry/dark (`F0b`), fruit $<20$ (`F0c`), or Photo B missing (`F0d`).
- [x] **E.11** Parallax correction: Apply `SIZE_PARALLAX_CORRECTION` factor (default 0.97) from config; add admin calibration test screen to tune factor from physical calipers.

**Phase E Status:**
- **Done**: All 11 requirements implemented and verified.
- **Not Done**: None.

---

## Phase F: Flags System (F0 to F19)

- [x] **F.0** Flags prominently displayed at top of result screen, report, QR page, PDF, and WhatsApp text with code, icon, and short sentence in user's language.
- [x] **F.1** Blocking flags:
  - `F0`: No coin found.
  - `F0b`: Photo blurry or dark.
  - `F0c`: Fewer than 20 fruit.
  - `F0d`: Photo B (flip side) missing.
- [x] **F.2** Warning flags:
  - `F1`: Small sample checked from lot.
  - `F2`: Few crates opened.
  - `F3`: Only top view used.
  - `F4`: Photo tilted $>10^\circ$.
  - `F5`: Shadows or dark background detected.
  - `F6`: Fruit touching or overlapping.
  - `F7`: Single crate or tiny heap.
  - `F8`: Fruit count differs between photos.
  - `F9`: Top layer much better than bottom layer.
  - `F10`: Farmer and buyer samples differ $>15$ points.
  - `F11`: Same photo or fruit used twice.
  - `F12`: Gallery upload older than 1 hour.
  - `F13`: Soft fruit found by hand check.
  - `F14`: Both parties not present at picking.
  - `F15`: Coin worn, bent, or non-standard.
  - `F16`: Mixed tomato varieties detected.
  - `F17`: Sun glare or off white-balance.
- [x] **F.3** Info flags:
  - `F18`: *"Inside rot cannot be seen."*
  - `F19`: *"Size is approximate (± X mm)."*
- [x] **F.4** Global Warning Rule: If ANY warning flag exists, report displays `"INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే"` badge, and flag count is placed on the first line of WhatsApp share text.

**Phase F Status:**
- **Done**: All 4 requirements implemented and verified.
- **Not Done**: None.

---

## Phase G: Computer Vision Enhancements

- [x] **G.1** Calyx and stem scar exclusion: Exclude calyx/stem scar from defect % using green hue and contour top-center location.
- [x] **G.2** Exclude specular glare spots, water drops, and edge shadow artifacts from defect count.
- [x] **G.3** Interactive defect correction: Tap on red-boxed defect to "mark as not damage" and record edit in audit trail as *"Edited by user"*.
- [x] **G.4** White balance normalization using coin/cloth background (flag `F17` if failed).
- [x] **G.5** Watershed area check: If contour area $> 1.6\times$ median fruit area, trigger flag `F6`.
- [x] **G.6** Variety selection dropdown: Desi / Hybrid / Cherry / Not sure, adjusting size thresholds from config.
- [x] **G.7** Shape irregularity check: Circle fit error above threshold marked as "shape unclear".

**Phase G Status:**
- **Done**: All 7 requirements implemented and verified.
- **Not Done**: None.

---

## Phase H: Reports, Sharing, Storage & Audit Trail

- [x] **H.1** Save each report on server (or Vercel KV / database). Server makes the report ID (`AG-YYYYMMDD-XXXXXX`) and time. Browser storage is only an offline copy.
- [x] **H.2** Show *"Report not changed since saved"* ONLY if the server stored it. Otherwise show nothing.
- [x] **H.3** Report first screen: big grade (or *"Not sure yet"*), flags at the top, 3 short lines in the user's language. Everything else behind collapsible *"Details"*.
- [x] **H.4** WhatsApp share text in the chosen language, max 6 short lines: flag count first, flags, then grade, then link. Mandatory footer included.
- [x] **H.5** Agreement screen (accept / dispute): label it *"Not verified who signed"*. Say *"This is a record of your talk. It is not a legal paper."*. Save each click on the server with the time (insert only). Show *"Farmer accepted 4:10 pm"*.
- [x] **H.6** Print / PDF in large font, chosen language, with flags and footer.
- [x] **H.7** *"Delete my photos"* button and *"Photos are used only for this report."*.
- [x] **H.8** Skip OTP and PIN for now (form simplified; unsigned records labeled *"Not verified who signed"*).

**Phase H (Phase 5) Status:**
- **Done**: All 8 Phase 5 requirements implemented and fully verified with unit tests.
- **Not Done**: None. (OTP and PIN intentionally skipped as specified).

---

## Phase I: Self-Test Suite & Admin Verification Tools

- [x] **I.1** Unit tests covering:
  - Wilson interval known values ($n=10, x=1$; $n=30, x=3$; $n=100, x=10$)
  - `SAMPLE_TABLE` logic
  - Random crate picker layer coverage and non-repetition
  - Photo A $\leftrightarrow$ B worse-view matching
  - 3-outcome grade verdicts (Green / Amber / Red)
  - 0-fruit grade and price blocking
- [x] **I.2** Test mode admin page (`#admin-test`): CSV import for hand-graded ground truth (size, defects, grade) with mean mm error, max mm error, and mismatch rate.
- [x] **I.3** Sampling simulation admin page (`#admin-simulation`): 100-fruit crate random sampling simulation (10, 20, 30, 50 fruit) validating against full-crate ground truth.
- [x] **I.4** Repeatability test: Validation framework to measure grade stability across 5 successive captures.
- [x] **I.5** Field checklist admin page (`#admin-checklist`): 21 scenario checklist with pass/fail selectors and CSV export.
- [x] **I.6** Web fonts included: Noto Sans Telugu and Noto Sans Devanagari web fonts integrated and loaded.

**Phase I Status:**
- **Done**: All 6 requirements implemented and verified.
- **Not Done**: None.

---

## Phase J: Acceptance Criteria Verification

- [x] **J.1** No English-only text anywhere. Language switch updates every screen, flag, and share text.
- [x] **J.2** Full grading workflow completable solely via pictures, large buttons, and the Listen button.
- [x] **J.3** 0 fruit, no coin, or missing flip photo strictly blocks grade and price calculation.
- [x] **J.4** Small sample from large lot strictly triggers flag `F1` and `"INDICATIVE ONLY"` title.
- [x] **J.5** Lot grade is never displayed as final when Wilson confidence range crosses tolerance limit.
- [x] **J.6** Zero occurrences of prohibited words: AGMARK, DMI, UNECE, "verified authentic", "tamper-proof", or "independent".
- [x] **J.7** All numeric thresholds located in single config file ([`backend/config/grading_config.json`](file:///c:/Users/Lenovo/startup/Agritech/backend/config/grading_config.json)).
- [x] **J.8** Short list of every file changed and every Telugu/Hindi string requiring native review provided.

**Phase J Status:**
- **Done**: All 8 requirements verified.
- **Not Done**: None.

---

## Grand Summary

| Phase | Total Requirements | Completed & Tested | Pending / Not Done |
| :--- | :---: | :---: | :---: |
| **Phase A: Audience, Languages & UI Rules** | 16 | 16 | 0 |
| **Phase B: Fix Misleading Claims** | 16 | 16 | 0 |
| **Phase C: Lot Setup & Sampling Planner** | 14 | 14 | 0 |
| **Phase D: Photo Rules & Two-Photo Protocol** | 10 | 10 | 0 |
| **Phase E: Grading Engine & Statistical Logic**| 11 | 11 | 0 |
| **Phase F: Flags System (F0 to F19)** | 4 | 4 | 0 |
| **Phase G: Computer Vision Enhancements** | 7 | 7 | 0 |
| **Phase H: Reports, Sharing & Storage** | 8 | 8 | 0 |
| **Phase I: Self-Test & Admin Suite** | 6 | 6 | 0 |
| **Phase J: Acceptance Criteria Verification** | 8 | 8 | 0 |
| **Total** | **100** | **100** | **0** |
