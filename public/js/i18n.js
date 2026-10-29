// AgriGrade Internationalization (i18n) Module
// Supported Languages: English (en), Hindi (hi), Telugu (te)
// All Hindi and Telugu strings marked with TODO: needs native speaker review

const TRANSLATIONS = {
  en: {
    // Top banner & Footers
    app_title: "AgriGrade",
    tagline: "Tomato Quality & Size Helper",
    title: "AgriGrade: Check tomato size and look with your phone",
    meta: "Check tomato size and damage with a photo and a coin. A helper tool for farmers and buyers. Not an official grade.",
    banner: "Helper tool for price talks. Not an official grade.",
    disclaimer_banner: "Helper tool for price talks. Not an official grade.",
    page_footer: "AgriGrade. Helper tool for farmers and buyers.",
    report_footer: "This is a helper tool. It is not an official grade. You both decide the final price.",
    mandatory_footer: "This is a helper tool. It is not an official grade. You both decide the final price.",
    agreement_note: "This is a record of your talk. It is not a legal paper.",
    how_we_grade: "We use our own simple rules. They look at size and damage.",
    how_we_grade_simple: "We use our own simple rules. They look at size and damage.",
    rules_heading: "Our Grading Rules",
    rules_note: "These rules are ours. They are not AGMARK. They are not government rules. They may change.",
    table_intro: "Grade A, B and C are our own names.",

    // Language Screen (First screen)
    lang_screen_title: "Choose Your Language",
    lang_screen_sub: "Select your language to continue.",
    btn_listen: "Listen",
    btn_stop_listen: "⏹️ Stop",
    listen_unsupported: "Speech is not supported on this phone.",

    // Navigation
    nav_home: "Home",
    nav_new_grade: "New Grading",
    nav_history: "Saved Reports",
    nav_methodology: "How We Grade",
    nav_standards: "Market Rules",
    nav_admin: "Test Tools",

    // Home Screen
    hero: "Fair talks for farmers and buyers",
    hero_title: "Fair talks for farmers and buyers",
    hero_sub: "Take a photo with a coin. See size and damage.",
    hero_subtitle: "Take a photo with a coin. See size and damage.",
    btn_start_grading: "Start Grading",
    btn_view_history: "View Saved Reports",
    btn_learn_more: "How It Works",

    // Step 2: Lot Setup
    lot_setup_title: "How much tomato do you have?",
    lot_setup_subtitle: "Choose crates, total kg, or loose heap.",
    opt_crates: "Number of crates",
    opt_kg: "Total kilograms (kg)",
    opt_heap: "Loose heap (kg)",
    crate_weight_hint: "1 crate is about 22 kg.",
    input_crates_label: "Enter number of crates",
    input_kg_label: "Enter total kg",
    input_heap_label: "Enter heap weight in kg",
    variety_label: "Tomato variety",
    variety_desi: "Desi",
    variety_hybrid: "Hybrid",
    variety_cherry: "Cherry",
    variety_unsure: "Not sure",
    btn_calc_plan: "Make Checking Plan",

    // Step 3: Sampling Plan
    plan_title: "Your Tomato Sampling Plan",
    plan_fruits_needed: "Total fruit to check: {n} tomatoes.",
    plan_batches_needed: "Photo batches: {b} batches (15 fruit each).",
    plan_min_note: "Need at least 20 fruit for a grade.",

    // Step 4: Random Picker
    random_picker_title: "Where to pick fruit (Anti-Bias)",
    random_crates_pick: "Open crate number: {list}",
    random_layer_pick: "Take 5 top, 5 middle, 5 bottom.",
    random_heap_zones: "Take 5 fruit from each zone: {zones}",
    single_crate_note: "Single crate: take equal fruit from all levels.",
    warning_anti_bias: "Do not pick best or worst fruit.",
    chk_both_present: "Both farmer and buyer are here.",
    btn_start_photos: "Start Photo Steps",
    btn_buyer_repeat: "Buyer wants own check",

    // Step 5 & Section D: Photo Rules (Wizard - One per screen, max 8 words)
    rule_1: "Use daylight.",
    rule_2: "Use a plain light cloth or paper.",
    rule_3: "Put the coin flat on the cloth.",
    rule_4: "Put 15 tomatoes in a row. No touching.",
    rule_5: "Stem side up. Take photo from top.",
    rule_6: "Hold the phone flat above. Not tilted.",
    rule_7: "Now turn each tomato over. Stem side down.",
    rule_8: "Keep the same place. Take photo again.",
    rule_9: "Keep the coin in the same place.",

    photo_rule_1_title: "Rule 1",
    photo_rule_1_desc: "Use daylight.",
    photo_rule_2_title: "Rule 2",
    photo_rule_2_desc: "Use a plain light cloth or paper.",
    photo_rule_3_title: "Rule 3",
    photo_rule_3_desc: "Put the coin flat on the cloth.",
    photo_rule_4_title: "Rule 4",
    photo_rule_4_desc: "Put 15 tomatoes in a row. No touching.",
    photo_rule_5_title: "Rule 5",
    photo_rule_5_desc: "Stem side up. Take photo from top.",
    photo_rule_6_title: "Rule 6",
    photo_rule_6_desc: "Hold the phone flat above. Not tilted.",
    photo_rule_7_title: "Rule 7",
    photo_rule_7_desc: "Now turn each tomato over. Stem side down.",
    photo_rule_8_title: "Rule 8",
    photo_rule_8_desc: "Keep the same place. Take photo again.",
    photo_rule_9_title: "Rule 9",
    photo_rule_9_desc: "Keep the coin in the same place.",

    // Live Camera & Capture Checks
    camera_label_a: "Batch {n} of {m}. Photo A (stem up)",
    camera_label_b: "Batch {n} of {m}. Photo B (stem down)",
    coin_spot: "🪙 Coin",
    camera_heading: "Batch {curr} of {total}: Photo {type}",
    photo_a_label: "Photo A (stem up)",
    photo_b_label: "Photo B (stem down)",
    photo_c_label: "Photo C (Sides - Optional)",
    check_coin_found: "Coin found",
    check_not_blurry: "Photo is sharp",
    check_not_dark: "Lighting is good",
    check_not_tilted: "Phone is flat",
    check_no_touch: "Fruit not touching",
    check_coin_ready: "Coin found",
    check_coin_missing: "No coin found",
    check_sharp_good: "Photo sharp",
    check_sharp_blurry: "Photo blurry",
    check_light_good: "Lighting good",
    check_light_dark: "Photo too dark",
    btn_capture: "Capture Photo",
    btn_retake: "Retake",
    btn_use_anyway: "Use anyway",
    thumbnail_photo_a: "Photo A (stem up)",
    blocked_no_coin: "No coin found. Cannot grade batch.",
    blocked_blurry_or_dark: "Photo blurry or dark. Cannot grade batch.",
    blocked_missing_photo_b: "Photo B missing. Cannot grade batch.",
    gallery_warning: "Gallery photo may be older than 60 min.",
    progress_batch_bar: "Batch {curr} of {total} done. {fcurr} of {ftarget} fruit.",
    btn_finish_early: "Finish with fewer fruit",

    // Hand Check & Weight Check (Section E6, E7)
    hand_check_title: "Hand Softness Check",
    hand_check_prompt: "Press 10 fruit with your hand. How many are soft?",
    hand_check_count: "Number of soft fruit (0 to 10)",
    weight_check_title: "Optional Sample Weight",
    weight_check_prompt: "Weigh your sample fruit. Enter total kg.",
    weight_check_placeholder: "e.g. 1.8 kg",
    btn_compute_grade: "Calculate Grade",

    // Results & Verdicts (Section E4, Section B)
    results_heading: "Tomato Lot Result",
    lot_grade_label: "Observed Grade",
    grades: {
      A: "Grade A",
      B: "Grade B",
      C: "Grade C",
      Reject: "Reject"
    },
    grade_a: "Grade A",
    grade_b: "Grade B",
    grade_c: "Grade C",
    grade_reject: "Reject",
    verdict_sure: "Sure",
    verdict_unsure: "Not sure. Check 20 more fruit.",
    verdict_not_this: "Not this grade",
    btn_add_20_more: "Add 20 more fruit",
    no_grade_zero_fruit: "No grade. No fruit found.",
    no_grade_zero: "Could not find fruit. Retake photo.",
    no_grade_few: "Could not find fruit. Retake photo.",
    could_not_find_fruit_retake: "Could not find fruit. Retake photo.",
    lot_too_small: "Lot too small for a grade.",
    indicative_badge: "INDICATIVE ONLY",
    not_changed_since_saved: "Report not changed since saved",
    server_saved_badge: "Report not changed since saved",
    local_saved_badge: "Saved on phone only",
    report_line_1: "{n} fruit checked.",
    report_line_2: "Bad fruit: about {p} in 100.",
    report_line_2_zero: "No fruit found.",
    report_line_3: "Estimated rate: {rate} / kg.",
    report_line_3_empty: "You both decide the final price.",
    not_sure_yet: "Not sure yet",
    wa_flags_count: "⚠️ {count} flags:",
    wa_no_flags: "✓ 0 flags",
    wa_grade_label: "Grade: {grade}",
    wa_sample_label: "Sample: {n} fruit",
    ack_farmer_accepted: "Farmer accepted {time}",
    ack_farmer_disputed: "Farmer disputed {time}",
    ack_buyer_accepted: "Buyer accepted {time}",
    ack_buyer_disputed: "Buyer disputed {time}",

    // Wilson Range Bar
    wilson_bar_text: "Bad fruit: about {p} in 100. Could be {low} to {high} in 100.",
    surface_seen_85: "About 85% of fruit surface seen.",
    surface_seen_45: "About 45% of fruit surface seen.",
    hidden_defect_warning: "Inside rot and soft fruit cannot be seen by photo.",

    // Price Open Table (Section B)
    price_title: "Example Price Multipliers",
    example_only: "Example only",
    price_example_tag: "Example only",
    price_base_label: "Base Price (₹/kg)",
    price_rate_label: "Estimated Lot Rate",
    price_mult_a: "Grade A = Base price (x 1.00)",
    price_mult_b: "Grade B = Base price x 0.85",
    price_mult_c: "Grade C = Base price x 0.70",
    price_mult_reject: "Reject = ₹0.00",

    // Fruit Details Toggle
    btn_toggle_details: "Details 🔽",
    btn_hide_details: "Hide Details 🔼",
    fruit_size_approx: "Approx. Size (± {x} mm)",
    fruit_defects: "Defect %",
    fruit_grade: "Grade",
    btn_mark_not_damage: "Mark as not damage",
    user_edited_tag: "Edited by user",

    // Flags (Section F)
    flag_f0: "No coin found.",
    flag_f0b: "Photo blurry or dark.",
    flag_f0c: "Fewer than 20 fruit.",
    flag_f0d: "Photo B (flip side) missing.",
    flag_f1: "Only {x} fruit checked from {y} kg. Need {z}.",
    flag_f2: "Few crates opened.",
    flag_f3: "Only top view used (no flip).",
    flag_f4: "Photo not top-down (tilted).",
    flag_f5: "Dark shadows near fruit.",
    flag_f6: "Fruit touching or overlapping in photo.",
    flag_f7: "Single crate or tiny heap.",
    flag_f8: "Fruit counts differ. Retake Photo B.",
    flag_f9: "Top layer much better than bottom.",
    flag_f10: "Farmer and buyer samples differ a lot.",
    flag_f11: "Same photo or fruit used twice.",
    flag_f12: "Photo uploaded from gallery (older).",
    flag_f13: "Soft fruit found by hand check.",
    flag_f14: "Both parties not present at picking.",
    flag_f15: "Coin looks worn, bent or wrong.",
    flag_f16: "Different tomato varieties mixed.",
    flag_f17: "Strong sun glare or uneven color.",
    flag_f18: "Inside rot cannot be seen.",
    flag_f19: "Size is approximate.",
    f18: "Inside rot cannot be seen.",
    f19: "Size is approximate.",
    F18: "Inside rot cannot be seen.",
    F19: "Size is approximate.",
    btn_debug_view: "Debug view",
    indicative_title_all: "INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే",

    // Agreement & Audit (Section H)
    ack_heading: "Record of Your Talk",
    party_label: "Your Role",
    party_farmer: "Farmer",
    party_buyer: "Buyer / Trader",
    verdict_accept: "Agree with this grade",
    verdict_dispute: "Dispute / Negotiate",
    pin_label: "Enter 4-digit PIN",
    pin_placeholder: "4 digits",
    pin_unverified: "Not verified who signed",
    note_label: "Note / Remarks",
    note_placeholder: "e.g. 5% discount agreed.",
    btn_submit_ack: "Save Record",
    ack_recorded_msg: "Record saved.",

    // Share & QR
    share_heading: "Share Report",
    btn_whatsapp_share: "Share on WhatsApp",
    btn_copy_link: "Copy Link",
    btn_download_qr: "Download QR",
    btn_print_pdf: "Print / PDF",
    btn_delete_photos: "Delete my photos",
    delete_photos: "Delete my photos",
    privacy: "Photos are used only for this report.",
    privacy_note: "Photos are used only for this report.",
    photos_deleted_msg: "Photos removed from server.",

    // Admin & Tests (Section I)
    admin_test_title: "Test Mode: Hand-Graded CSV Compare",
    admin_sim_title: "Sampling Simulation (100-Fruit Crate)",
    admin_cal_title: "Caliper Parallax Calibration",
    admin_checklist_title: "Field Test Checklist",
    btn_export_csv: "Export CSV",
    btn_run_sim: "Run Simulation",
    btn_save_cal: "Save Parallax Factor"
  },

  hi: {
    // Top banner & Footers
    app_title: "एग्री-ग्रेड", // TODO: needs native speaker review
    tagline: "टमाटर गुणवत्ता और आकार साथी", // TODO: needs native speaker review
    title: "एग्रीग्रेड: फ़ोन से टमाटर का आकार और हालत देखें", // TODO: needs native speaker review
    meta: "फ़ोटो और सिक्के से टमाटर का आकार और खराबी जाँचें। किसानों और खरीदारों के लिए मदद का औज़ार। सरकारी ग्रेड नहीं।", // TODO: needs native speaker review
    banner: "भाव की बातचीत के लिए मदद का औज़ार। सरकारी ग्रेड नहीं।", // TODO: needs native speaker review
    disclaimer_banner: "भाव की बातचीत के लिए मदद का औज़ार। सरकारी ग्रेड नहीं।", // TODO: needs native speaker review
    hero: "किसान और खरीदार की बराबर की बातचीत", // TODO: needs native speaker review
    hero_title: "किसान और खरीदार की बराबर की बातचीत", // TODO: needs native speaker review
    hero_sub: "सिक्के के साथ फ़ोटो लें। आकार और खराबी देखें।", // TODO: needs native speaker review
    hero_subtitle: "सिक्के के साथ फ़ोटो लें। आकार और खराबी देखें।", // TODO: needs native speaker review
    how_we_grade: "हम अपने सरल नियम इस्तेमाल करते हैं। ये आकार और खराबी देखते हैं।", // TODO: needs native speaker review
    how_we_grade_simple: "हम अपने सरल नियम इस्तेमाल करते हैं। ये आकार और खराबी देखते हैं।", // TODO: needs native speaker review
    rules_heading: "हमारे ग्रेडिंग नियम", // TODO: needs native speaker review
    rules_note: "ये नियम हमारे हैं। ये AGMARK नहीं हैं। ये सरकारी नियम नहीं हैं। ये बदल सकते हैं।", // TODO: needs native speaker review
    table_intro: "ग्रेड A, B और C हमारे अपने नाम हैं।", // TODO: needs native speaker review
    page_footer: "एग्रीग्रेड। किसानों और खरीदारों के लिए मदद का औज़ार।", // TODO: needs native speaker review
    report_footer: "यह सिर्फ़ मदद का औज़ार है। यह सरकारी ग्रेड नहीं है। अंतिम भाव आप दोनों तय करें।", // TODO: needs native speaker review
    mandatory_footer: "यह सिर्फ़ मदद का औज़ार है। यह सरकारी ग्रेड नहीं है। अंतिम भाव आप दोनों तय करें।", // TODO: needs native speaker review
    agreement_note: "यह आपकी बातचीत का रिकॉर्ड है। यह कानूनी कागज़ नहीं है।", // TODO: needs native speaker review
    privacy: "फ़ोटो सिर्फ़ इस रिपोर्ट के लिए इस्तेमाल होती हैं।", // TODO: needs native speaker review
    privacy_note: "फ़ोटो सिर्फ़ इस रिपोर्ट के लिए इस्तेमाल होती हैं।", // TODO: needs native speaker review
    delete_photos: "मेरी फ़ोटो हटाएँ", // TODO: needs native speaker review
    btn_delete_photos: "मेरी फ़ोटो हटाएँ", // TODO: needs native speaker review

    // Language Screen (First screen)
    lang_screen_title: "अपनी भाषा चुनें", // TODO: needs native speaker review
    lang_screen_sub: "आगे बढ़ने के लिए भाषा चुनें।", // TODO: needs native speaker review
    btn_listen: "सुनें", // TODO: needs native speaker review
    btn_stop_listen: "⏹️ रोकें", // TODO: needs native speaker review
    listen_unsupported: "इस फोन में आवाज़ उपलब्ध नहीं है।", // TODO: needs native speaker review

    // Navigation
    nav_home: "होम", // TODO: needs native speaker review
    nav_new_grade: "नई जांच", // TODO: needs native speaker review
    nav_history: "पुरानी रिपोर्ट", // TODO: needs native speaker review
    nav_methodology: "जांच का तरीका", // TODO: needs native speaker review
    nav_standards: "मंडी नियम", // TODO: needs native speaker review
    nav_admin: "टेस्ट टूल्स", // TODO: needs native speaker review

    // Home Screen
    hero_title: "सिक्के की मदद से टमाटर जांचें", // TODO: needs native speaker review
    hero_subtitle: "₹10 या ₹5 का सिक्का रखकर फोटो लें। सही भाव के लिए आकार और दाग देखें।", // TODO: needs native speaker review
    btn_start_grading: "जांच शुरू करें", // TODO: needs native speaker review
    btn_view_history: "पुरानी रिपोर्ट देखें", // TODO: needs native speaker review
    btn_learn_more: "तरीका समझें", // TODO: needs native speaker review

    // Step 2: Lot Setup
    lot_setup_title: "आपके पास कितने टमाटर हैं?", // TODO: needs native speaker review
    lot_setup_subtitle: "क्रेट, कुल किलो या खुला ढेर चुनें।", // TODO: needs native speaker review
    opt_crates: "क्रेट की संख्या", // TODO: needs native speaker review
    opt_kg: "कुल वज़न (किलो)", // TODO: needs native speaker review
    opt_heap: "खुला ढेर (किलो)", // TODO: needs native speaker review
    crate_weight_hint: "1 क्रेट लगभग 22 किलो होता है।", // TODO: needs native speaker review
    input_crates_label: "क्रेट की संख्या लिखें", // TODO: needs native speaker review
    input_kg_label: "कुल किलो लिखें", // TODO: needs native speaker review
    input_heap_label: "ढेर का वज़न (किलो) लिखें", // TODO: needs native speaker review
    variety_label: "टमाटर की किस्म", // TODO: needs native speaker review
    variety_desi: "देसी", // TODO: needs native speaker review
    variety_hybrid: "हाइब्रिड", // TODO: needs native speaker review
    variety_cherry: "चेरी", // TODO: needs native speaker review
    variety_unsure: "पक्का नहीं", // TODO: needs native speaker review
    btn_calc_plan: "जांच योजना बनाएं", // TODO: needs native speaker review

    // Step 3: Sampling Plan
    plan_title: "टमाटर नमूना योजना", // TODO: needs native speaker review
    plan_fruits_needed: "कुल जांच के फल: {n} टमाटर।", // TODO: needs native speaker review
    plan_batches_needed: "फोटो बैच: {b} बार (हर बार 15 टमाटर)।", // TODO: needs native speaker review
    plan_min_note: "ग्रेड के लिए कम से कम 20 टमाटर चाहिए।", // TODO: needs native speaker review

    // Step 4: Random Picker
    random_picker_title: "टमाटर कहां से निकालें (निष्पक्ष नियम)", // TODO: needs native speaker review
    random_crates_pick: "ये क्रेट नंबर खोलें: {list}", // TODO: needs native speaker review
    random_layer_pick: "5 ऊपर से, 5 बीच से, 5 नीचे से लें।", // TODO: needs native speaker review
    random_heap_zones: "हर हिस्से से 5 फल लें: {zones}", // TODO: needs native speaker review
    single_crate_note: "एक ही क्रेट: ऊपर, बीच और नीचे से बराबर लें।", // TODO: needs native speaker review
    warning_anti_bias: "न सबसे अच्छे लें, न सबसे खराब फल।", // TODO: needs native speaker review
    chk_both_present: "किसान और खरीदार दोनों यहाँ मौजूद हैं।", // TODO: needs native speaker review
    btn_start_photos: "फोटो लेना शुरू करें", // TODO: needs native speaker review
    btn_buyer_repeat: "खरीदार अपनी अलग जांच चाहता है", // TODO: needs native speaker review

    // Step 5 & Section D: Photo Rules (Wizard - One per screen, max 8 words)
    rule_1: "दिन के उजाले में फोटो लें।", // TODO: needs native speaker review
    rule_2: "सादा हल्का कपड़ा या कागज़ बिछाएं।", // TODO: needs native speaker review
    rule_3: "कपड़े पर सिक्का सीधा रखें।", // TODO: needs native speaker review
    rule_4: "15 टमाटर लाइन में रखें। सटाएं नहीं।", // TODO: needs native speaker review
    rule_5: "डंठल ऊपर रखें। ऊपर से फोटो लें।", // TODO: needs native speaker review
    rule_6: "फ़ोन बिल्कुल सीधा रखें। झुकाएं नहीं।", // TODO: needs native speaker review
    rule_7: "अब टमाटर पलटें। डंठल नीचे रखें।", // TODO: needs native speaker review
    rule_8: "उसी जगह रखकर फिर फोटो लें।", // TODO: needs native speaker review
    rule_9: "सिक्का उसी जगह पर रखें।", // TODO: needs native speaker review

    photo_rule_1_title: "नियम 1", // TODO: needs native speaker review
    photo_rule_1_desc: "दिन के उजाले में फोटो लें।", // TODO: needs native speaker review
    photo_rule_2_title: "नियम 2", // TODO: needs native speaker review
    photo_rule_2_desc: "सादा हल्का कपड़ा या कागज़ बिछाएं।", // TODO: needs native speaker review
    photo_rule_3_title: "नियम 3", // TODO: needs native speaker review
    photo_rule_3_desc: "कपड़े पर सिक्का सीधा रखें।", // TODO: needs native speaker review
    photo_rule_4_title: "नियम 4", // TODO: needs native speaker review
    photo_rule_4_desc: "15 टमाटर लाइन में रखें। सटाएं नहीं।", // TODO: needs native speaker review
    photo_rule_5_title: "नियम 5", // TODO: needs native speaker review
    photo_rule_5_desc: "डंठल ऊपर रखें। ऊपर से फोटो लें।", // TODO: needs native speaker review
    photo_rule_6_title: "नियम 6", // TODO: needs native speaker review
    photo_rule_6_desc: "फ़ोन बिल्कुल सीधा रखें। झुकाएं नहीं।", // TODO: needs native speaker review
    photo_rule_7_title: "नियम 7", // TODO: needs native speaker review
    photo_rule_7_desc: "अब टमाटर पलटें। डंठल नीचे रखें।", // TODO: needs native speaker review
    photo_rule_8_title: "नियम 8", // TODO: needs native speaker review
    photo_rule_8_desc: "उसी जगह रखकर फिर फोटो लें।", // TODO: needs native speaker review
    photo_rule_9_title: "नियम 9", // TODO: needs native speaker review
    photo_rule_9_desc: "सिक्का उसी जगह पर रखें।", // TODO: needs native speaker review

    // Live Camera & Capture Checks
    camera_label_a: "बैच {n}/{m}। फोटो A (डंठल ऊपर)", // TODO: needs native speaker review
    camera_label_b: "बैच {n}/{m}। फोटो B (डंठल नीचे)", // TODO: needs native speaker review
    coin_spot: "🪙 सिक्का", // TODO: needs native speaker review
    camera_heading: "बैच {curr}/{total}: फोटो {type}", // TODO: needs native speaker review
    photo_a_label: "फोटो A (डंठल ऊपर)", // TODO: needs native speaker review
    photo_b_label: "फोटो B (डंठल नीचे)", // TODO: needs native speaker review
    photo_c_label: "फोटो C (करवट से - ऐच्छिक)", // TODO: needs native speaker review
    check_coin_found: "सिक्का दिखा", // TODO: needs native speaker review
    check_not_blurry: "फोटो साफ़ है", // TODO: needs native speaker review
    check_not_dark: "रोशनी सही है", // TODO: needs native speaker review
    check_not_tilted: "फ़ोन सीधा है", // TODO: needs native speaker review
    check_no_touch: "फल अलग हैं", // TODO: needs native speaker review
    check_coin_ready: "सिक्का दिखा", // TODO: needs native speaker review
    check_coin_missing: "सिक्का नहीं दिखा", // TODO: needs native speaker review
    check_sharp_good: "फोटो साफ़ है", // TODO: needs native speaker review
    check_sharp_blurry: "फोटो धुंधली है", // TODO: needs native speaker review
    check_light_good: "रोशनी सही है", // TODO: needs native speaker review
    check_light_dark: "फोटो में अंधेरा है", // TODO: needs native speaker review
    btn_capture: "फोटो लें", // TODO: needs native speaker review
    btn_retake: "दोबारा लें", // TODO: needs native speaker review
    btn_use_anyway: "फिर भी इस्तेमाल करें", // TODO: needs native speaker review
    thumbnail_photo_a: "फोटो A (डंठल ऊपर)", // TODO: needs native speaker review
    blocked_no_coin: "सिक्का नहीं मिला। बैच ग्रेड नहीं होगा।", // TODO: needs native speaker review
    blocked_blurry_or_dark: "फ़ोटो धुंधली या अंधेरी है। दोबारा लें।", // TODO: needs native speaker review
    blocked_missing_photo_b: "फोटो B गायब है। दोबारा फोटो लें।", // TODO: needs native speaker review
    gallery_warning: "गैलरी फोटो 60 मिनट से पुरानी हो सकती।", // TODO: needs native speaker review
    progress_batch_bar: "बैच {curr}/{total} पूरा। {fcurr}/{ftarget} फल।", // TODO: needs native speaker review
    btn_finish_early: "कम फल पर समाप्त करें", // TODO: needs native speaker review

    // Hand Check & Weight Check
    hand_check_title: "हाथ से दबाकर जांच", // TODO: needs native speaker review
    hand_check_prompt: "10 टमाटर हाथ से दबाएं। कितने पिलपिले (नरम) हैं?", // TODO: needs native speaker review
    hand_check_count: "नरम टमाटरों की संख्या (0 से 10)", // TODO: needs native speaker review
    weight_check_title: "नमूने का वज़न (ऐच्छिक)", // TODO: needs native speaker review
    weight_check_prompt: "जांचे गए फल तौलें। किलो दर्ज करें।", // TODO: needs native speaker review
    weight_check_placeholder: "जैसे 1.8 किलो", // TODO: needs native speaker review
    btn_compute_grade: "ग्रेड निकालें", // TODO: needs native speaker review

    // Results & Verdicts
    results_heading: "टमाटर का परिणाम", // TODO: needs native speaker review
    lot_grade_label: "मिला हुआ ग्रेड", // TODO: needs native speaker review
    grades: {
      A: "ग्रेड A", // TODO: needs native speaker review
      B: "ग्रेड B", // TODO: needs native speaker review
      C: "ग्रेड C", // TODO: needs native speaker review
      Reject: "रिजेक्ट" // TODO: needs native speaker review
    },
    grade_a: "ग्रेड A", // TODO: needs native speaker review
    grade_b: "ग्रेड B", // TODO: needs native speaker review
    grade_c: "ग्रेड C", // TODO: needs native speaker review
    grade_reject: "रिजेक्ट", // TODO: needs native speaker review
    "grades.A": "ग्रेड A", // TODO: needs native speaker review
    "grades.B": "ग्रेड B", // TODO: needs native speaker review
    "grades.C": "ग्रेड C", // TODO: needs native speaker review
    "grades.Reject": "रिजेक्ट", // TODO: needs native speaker review
    verdict_sure: "पक्का", // TODO: needs native speaker review
    verdict_unsure: "पक्का नहीं। 20 और टमाटर जांचें।", // TODO: needs native speaker review
    verdict_not_this: "यह ग्रेड नहीं", // TODO: needs native speaker review
    btn_add_20_more: "20 और टमाटर जोड़ें", // TODO: needs native speaker review
    no_grade_zero_fruit: "कोई ग्रेड नहीं। कोई फल नहीं मिला।", // TODO: needs native speaker review
    no_grade_zero: "फल नहीं मिले। दोबारा फ़ोटो लें।", // TODO: needs native speaker review
    no_grade_few: "फल नहीं मिले। दोबारा फ़ोटो लें।", // TODO: needs native speaker review
    could_not_find_fruit_retake: "फल नहीं मिले। दोबारा फ़ोटो लें।", // TODO: needs native speaker review
    lot_too_small: "लॉट ग्रेड के लिए बहुत छोटा है।", // TODO: needs native speaker review
    indicative_badge: "सिर्फ़ संकेत", // TODO: needs native speaker review
    not_changed_since_saved: "सेव करने के बाद रिपोर्ट बदली नहीं है", // TODO: needs native speaker review
    server_saved_badge: "सेव करने के बाद रिपोर्ट बदली नहीं है", // TODO: needs native speaker review
    local_saved_badge: "सिर्फ़ फोन में सुरक्षित", // TODO: needs native speaker review
    report_line_1: "{n} फल जाँचे।", // TODO: needs native speaker review
    report_line_2: "खराब टमाटर: 100 में लगभग {p}।", // TODO: needs native speaker review
    report_line_2_zero: "कोई फल नहीं मिला।", // TODO: needs native speaker review
    report_line_3: "अनुमानित भाव: {rate}।", // TODO: needs native speaker review
    report_line_3_empty: "अंतिम भाव आप दोनों तय करें।", // TODO: needs native speaker review
    not_sure_yet: "पक्का नहीं", // TODO: needs native speaker review
    wa_flags_count: "⚠️ {count} फ्लैग:", // TODO: needs native speaker review
    wa_no_flags: "✓ कोई फ्लैग नहीं", // TODO: needs native speaker review
    wa_grade_label: "ग्रेड: {grade}", // TODO: needs native speaker review
    wa_sample_label: "जाँचे: {n} फल", // TODO: needs native speaker review
    ack_farmer_accepted: "किसान सहमत {time}", // TODO: needs native speaker review
    ack_farmer_disputed: "किसान असहमत {time}", // TODO: needs native speaker review
    ack_buyer_accepted: "खरीदार सहमत {time}", // TODO: needs native speaker review
    ack_buyer_disputed: "खरीदार असहमत {time}", // TODO: needs native speaker review

    // Wilson Range Bar
    wilson_bar_text: "खराब टमाटर: 100 में से लगभग {p}। {low} से {high} हो सकते हैं।", // TODO: needs native speaker review
    surface_seen_85: "टमाटर की लगभग 85% सतह देखी गई।", // TODO: needs native speaker review
    surface_seen_45: "टमाटर की लगभग 45% सतह देखी गई।", // TODO: needs native speaker review
    hidden_defect_warning: "अंदरूनी सड़न और नरमी फोटो में नहीं दिखती।", // TODO: needs native speaker review

    // Price Open Table
    price_title: "अनुमानित भाव तालिका", // TODO: needs native speaker review
    example_only: "सिर्फ़ उदाहरण", // TODO: needs native speaker review
    price_example_tag: "सिर्फ़ उदाहरण", // TODO: needs native speaker review
    price_base_label: "मूल भाव (₹/किलो)", // TODO: needs native speaker review
    price_rate_label: "अनुमानित लॉट भाव", // TODO: needs native speaker review
    price_mult_a: "ग्रेड A = मूल भाव (x 1.00)", // TODO: needs native speaker review
    price_mult_b: "ग्रेड B = मूल भाव x 0.85", // TODO: needs native speaker review
    price_mult_c: "ग्रेड C = मूल भाव x 0.70", // TODO: needs native speaker review
    price_mult_reject: "रद्द = ₹0.00", // TODO: needs native speaker review

    // Fruit Details Toggle
    btn_toggle_details: "फल विवरण देखें", // TODO: needs native speaker review
    btn_hide_details: "विवरण छिपाएं", // TODO: needs native speaker review
    fruit_size_approx: "अनुमानित आकार (± {x} मिमी)", // TODO: needs native speaker review
    fruit_defects: "दाग प्रतिशत", // TODO: needs native speaker review
    fruit_grade: "ग्रेड", // TODO: needs native speaker review
    btn_mark_not_damage: "दाग नहीं है (हटाएं)", // TODO: needs native speaker review
    user_edited_tag: "उपयोगकर्ता द्वारा सुधारा गया", // TODO: needs native speaker review

    // Flags
    flag_f0: "सिक्का नहीं मिला।", // TODO: needs native speaker review
    flag_f0b: "फोटो धुंधली या अंधेरी है।", // TODO: needs native speaker review
    flag_f0c: "20 से कम फल हैं।", // TODO: needs native speaker review
    flag_f0d: "फोटो B (पलटी हुई) गायब है।", // TODO: needs native speaker review
    flag_f1: "{y} किलो में {x} फल जाँचे। {z} चाहिए।", // TODO: needs native speaker review
    flag_f2: "बहुत कम क्रेट खोले गए।", // TODO: needs native speaker review
    flag_f3: "सिर्फ़ ऊपर का हिस्सा देखा गया।", // TODO: needs native speaker review
    flag_f4: "फ़ोन 10 डिग्री से ज़्यादा झुका था।", // TODO: needs native speaker review
    flag_f5: "टमाटर के पास काली परछाई है।", // TODO: needs native speaker review
    flag_f6: "टमाटर आपस में जुड़े हुए हैं।", // TODO: needs native speaker review
    flag_f7: "एक ही क्रेट या छोटा ढेर।", // TODO: needs native speaker review
    flag_f8: "फलों की गिनती अलग। फोटो B फिर लें।", // TODO: needs native speaker review
    flag_f9: "ऊपर का माल नीचे से बहुत अच्छा है।", // TODO: needs native speaker review
    flag_f10: "किसान और व्यापारी के नमूनों में बड़ा अंतर।", // TODO: needs native speaker review
    flag_f11: "वही फोटो या फल दोबारा इस्तेमाल हुआ।", // TODO: needs native speaker review
    flag_f12: "गैलरी से पुरानी फोटो अपलोड की गई।", // TODO: needs native speaker review
    flag_f13: "हाथ लगाने पर नरम फल मिले।", // TODO: needs native speaker review
    flag_f14: "फल चुनते समय दोनों मौजूद नहीं थे।", // TODO: needs native speaker review
    flag_f15: "सिक्का घिसा हुआ या गलत प्रकार का है।", // TODO: needs native speaker review
    flag_f16: "अलग-अलग किस्म के टमाटर मिले हुए हैं।", // TODO: needs native speaker review
    flag_f17: "कड़क धूप या पीले/नीले रंग का असर।", // TODO: needs native speaker review
    flag_f18: "भीतरी सड़न फ़ोटो में नहीं दिखती।", // TODO: needs native speaker review
    flag_f19: "आकार केवल अनुमानित है।", // TODO: needs native speaker review
    f18: "भीतरी सड़न फ़ोटो में नहीं दिखती।", // TODO: needs native speaker review
    f19: "आकार केवल अनुमानित है।", // TODO: needs native speaker review
    F18: "भीतरी सड़न फ़ोटो में नहीं दिखती।", // TODO: needs native speaker review
    F19: "आकार केवल अनुमानित है।", // TODO: needs native speaker review
    btn_debug_view: "डीबग दृश्य", // TODO: needs native speaker review
    indicative_title_all: "INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే", // TODO: needs native speaker review

    // Agreement & Audit
    ack_heading: "आपसी बातचीत का रिकॉर्ड", // TODO: needs native speaker review
    party_label: "आपकी भूमिका", // TODO: needs native speaker review
    party_farmer: "किसान", // TODO: needs native speaker review
    party_buyer: "खरीदार / व्यापारी", // TODO: needs native speaker review
    verdict_accept: "इस ग्रेड से सहमत हैं", // TODO: needs native speaker review
    verdict_dispute: "आपत्ति / दोबारा बातचीत", // TODO: needs native speaker review
    pin_label: "4 अंकों का पिन डालें", // TODO: needs native speaker review
    pin_placeholder: "4 अंक", // TODO: needs native speaker review
    pin_unverified: "हस्ताक्षरकर्ता की पुष्टि नहीं हुई", // TODO: needs native speaker review
    note_label: "टिप्पणी / विवरण", // TODO: needs native speaker review
    note_placeholder: "जैसे 5% छूट पर तय हुआ।", // TODO: needs native speaker review
    btn_submit_ack: "रिकॉर्ड सुरक्षित करें", // TODO: needs native speaker review
    ack_recorded_msg: "रिकॉर्ड सुरक्षित कर लिया गया।", // TODO: needs native speaker review

    // Share & QR
    share_heading: "रिपोर्ट साझा करें", // TODO: needs native speaker review
    btn_whatsapp_share: "व्हाट्सएप पर भेजें", // TODO: needs native speaker review
    btn_copy_link: "लिंक कॉपी करें", // TODO: needs native speaker review
    btn_download_qr: "QR कोड डाउनलोड करें", // TODO: needs native speaker review
    btn_print_pdf: "प्रिंट / PDF", // TODO: needs native speaker review
    btn_delete_photos: "मेरी फ़ोटो हटाएँ", // TODO: needs native speaker review
    delete_photos: "मेरी फ़ोटो हटाएँ", // TODO: needs native speaker review
    privacy: "फ़ोटो सिर्फ़ इस रिपोर्ट के लिए इस्तेमाल होती हैं।", // TODO: needs native speaker review
    privacy_note: "फ़ोटो सिर्फ़ इस रिपोर्ट के लिए इस्तेमाल होती हैं।", // TODO: needs native speaker review
    photos_deleted_msg: "सर्वर से फोटो हटा दी गई हैं।", // TODO: needs native speaker review

    // Admin & Tests
    admin_test_title: "टेस्ट मोड: CSV से हाथ के ग्रेड की तुलना", // TODO: needs native speaker review
    admin_sim_title: "नमूना सिमुलेशन (100-फल क्रेट)", // TODO: needs native speaker review
    admin_cal_title: "कैलीपर लंबन अंशांकन", // TODO: needs native speaker review
    admin_checklist_title: "फ़ील्ड टेस्ट चेकलिस्ट", // TODO: needs native speaker review
    btn_export_csv: "CSV डाउनलोड करें", // TODO: needs native speaker review
    btn_run_sim: "सिमुलेशन चलाएं", // TODO: needs native speaker review
    btn_save_cal: "लंबन गुणांक सुरक्षित करें" // TODO: needs native speaker review
  },

  te: {
    // Top banner & Footers
    app_title: "అగ్రి-గ్రేడ్", // TODO: needs native speaker review
    tagline: "టమాటా నాణ్యత, పరిమాణ సహాయకం", // TODO: needs native speaker review
    title: "అగ్రిగ్రేడ్: ఫోన్తో టమాటా సైజు, నాణ్యత చూడండి", // TODO: needs native speaker review
    meta: "ఫోటో, నాణెంతో టమాటా సైజు, దెబ్బలను చూడండి. రైతులు, కొనుగోలుదారులకు సహాయక సాధనం. అధికారిక గ్రేడ్ కాదు.", // TODO: needs native speaker review
    banner: "ధర చర్చకు సహాయక సాధనం. అధికారిక గ్రేడ్ కాదు.", // TODO: needs native speaker review
    disclaimer_banner: "ధర చర్చకు సహాయక సాధనం. అధికారిక గ్రేడ్ కాదు.", // TODO: needs native speaker review
    hero: "రైతు, కొనుగోలుదారు మధ్య న్యాయమైన చర్చ", // TODO: needs native speaker review
    hero_title: "రైతు, కొనుగోలుదారు మధ్య న్యాయమైన చర్చ", // TODO: needs native speaker review
    hero_sub: "నాణెంతో ఫోటో తీయండి. సైజు, దెబ్బలు చూడండి.", // TODO: needs native speaker review
    hero_subtitle: "నాణెంతో ఫోటో తీయండి. సైజు, దెబ్బలు చూడండి.", // TODO: needs native speaker review
    how_we_grade: "మేము మా స్వంత సులభమైన నియమాలు వాడతాము. ఇవి సైజు, దెబ్బలను చూస్తాయి.", // TODO: needs native speaker review
    how_we_grade_simple: "మేము మా స్వంత సులభమైన నియమాలు వాడతాము. ఇవి సైజు, దెబ్బలను చూస్తాయి.", // TODO: needs native speaker review
    rules_heading: "మా గ్రేడింగ్ నియమాలు", // TODO: needs native speaker review
    rules_note: "ఈ నియమాలు మావి. ఇవి AGMARK కాదు. ఇవి ప్రభుత్వ నియమాలు కాదు. ఇవి మారవచ్చు.", // TODO: needs native speaker review
    table_intro: "గ్రేడ్ A, B, C మా స్వంత పేర్లు.", // TODO: needs native speaker review
    page_footer: "అగ్రిగ్రేడ్. రైతులు, కొనుగోలుదారులకు సహాయక సాధనం.", // TODO: needs native speaker review
    report_footer: "ఇది కేవలం సహాయక సాధనం. ఇది అధికారిక గ్రేడ్ కాదు. తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి.", // TODO: needs native speaker review
    mandatory_footer: "ఇది కేవలం సహాయక సాధనం. ఇది అధికారిక గ్రేడ్ కాదు. తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి.", // TODO: needs native speaker review
    agreement_note: "ఇది మీ చర్చ రికార్డు. ఇది చట్టపరమైన పత్రం కాదు.", // TODO: needs native speaker review
    privacy: "ఫోటోలు ఈ నివేదిక కోసం మాత్రమే వాడతాము.", // TODO: needs native speaker review
    privacy_note: "ఫోటోలు ఈ నివేదిక కోసం మాత్రమే వాడతాము.", // TODO: needs native speaker review
    delete_photos: "నా ఫోటోలు తొలగించండి", // TODO: needs native speaker review
    btn_delete_photos: "నా ఫోటోలు తొలగించండి", // TODO: needs native speaker review

    // Language Screen (First screen)
    lang_screen_title: "మీ భాషను ఎంచుకోండి", // TODO: needs native speaker review
    lang_screen_sub: "కొనసాగడానికి భాషను ఎంచుకోండి.", // TODO: needs native speaker review
    btn_listen: "వినండి", // TODO: needs native speaker review
    btn_stop_listen: "⏹️ ఆపండి", // TODO: needs native speaker review
    listen_unsupported: "ఈ ఫోన్‌లో వాయిస్ అందుబాటులో లేదు.", // TODO: needs native speaker review

    // Navigation
    nav_home: "హోమ్", // TODO: needs native speaker review
    nav_new_grade: "కొత్త తనిఖీ", // TODO: needs native speaker review
    nav_history: "పాత రిపోర్టులు", // TODO: needs native speaker review
    nav_methodology: "తనిఖీ విధానం", // TODO: needs native speaker review
    nav_standards: "మార్కెట్ నిబంధనలు", // TODO: needs native speaker review
    nav_admin: "టెస్ట్ టూల్స్", // TODO: needs native speaker review

    // Home Screen
    hero_title: "నాణెంతో టమాటాల నాణ్యతను కొలవండి", // TODO: needs native speaker review
    hero_subtitle: "₹10 లేదా ₹5 నాణెం ఉంచి ఫోటో తీయండి. సరసమైన ధర కోసం పరిమాణం మరియు మచ్చలు చూడండి.", // TODO: needs native speaker review
    btn_start_grading: "తనిఖీ ప్రారంభించండి", // TODO: needs native speaker review
    btn_view_history: "సేవ్ చేసిన రిపోర్టులు", // TODO: needs native speaker review
    btn_learn_more: "విధానం తెలుసుకోండి", // TODO: needs native speaker review

    // Step 2: Lot Setup
    lot_setup_title: "మీ వద్ద ఎంత టమాటా ఉంది?", // TODO: needs native speaker review
    lot_setup_subtitle: "క్రేట్లు, కిలోలు లేదా కుప్ప ఎంచుకోండి.", // TODO: needs native speaker review
    opt_crates: "క్రేట్ల సంఖ్య", // TODO: needs native speaker review
    opt_kg: "మొత్తం కిలోలు (kg)", // TODO: needs native speaker review
    opt_heap: "విడిగా ఉన్న కుప్ప (kg)", // TODO: needs native speaker review
    crate_weight_hint: "1 క్రేట్ సుమారు 22 కిలోలు.", // TODO: needs native speaker review
    input_crates_label: "క్రేట్ల సంఖ్య రాయండి", // TODO: needs native speaker review
    input_kg_label: "మొత్తం కిలోలు రాయండి", // TODO: needs native speaker review
    input_heap_label: "కుప్ప బరువు (కిలోలు) రాయండి", // TODO: needs native speaker review
    variety_label: "టమాటా రకం", // TODO: needs native speaker review
    variety_desi: "నాటు (దేశీ)", // TODO: needs native speaker review
    variety_hybrid: "హైబ్రిడ్", // TODO: needs native speaker review
    variety_cherry: "చెర్రీ", // TODO: needs native speaker review
    variety_unsure: "స్పష్టత లేదు", // TODO: needs native speaker review
    btn_calc_plan: "తనిఖీ ప్లాన్ చేయండి", // TODO: needs native speaker review

    // Step 3: Sampling Plan
    plan_title: "టమాటా నమూనా ప్లాన్", // TODO: needs native speaker review
    plan_fruits_needed: "తనిఖీ చేయాల్సిన పండ్లు: {n} టమాటాలు.", // TODO: needs native speaker review
    plan_batches_needed: "ఫోటోల సంఖ్య: {b} బ్యాచ్‌లు (ఒక్కోటి 15 పండ్లు).", // TODO: needs native speaker review
    plan_min_note: "గ్రేడ్ కోసం కనీసం 20 టమాటాలు కావాలి.", // TODO: needs native speaker review

    // Step 4: Random Picker
    random_picker_title: "టమాటాలు ఎక్కడినుండి తీయాలి (పక్షపాతం లేకుండా)", // TODO: needs native speaker review
    random_crates_pick: "ఈ క్రేట్ నంబర్లు తెరవండి: {list}", // TODO: needs native speaker review
    random_layer_pick: "5 పైనుండి, 5 మధ్యనుండి, 5 కిందనుండి తీయండి.", // TODO: needs native speaker review
    random_heap_zones: "ఈ భాగాల నుండి 5 చొప్పున తీయండి: {zones}", // TODO: needs native speaker review
    single_crate_note: "ఒకే క్రేట్: పైనుండి, మధ్యనుండి, కిందనుండి సమానంగా తీయండి.", // TODO: needs native speaker review
    warning_anti_bias: "మరీ మంచివి వద్దు, మరీ చెడ్డవి వద్దు.", // TODO: needs native speaker review
    chk_both_present: "రైతు, కొనుగోలుదారు ఇద్దరూ ఇక్కడే ఉన్నారు.", // TODO: needs native speaker review
    btn_start_photos: "ఫోటోల తనిఖీ ప్రారంభించండి", // TODO: needs native speaker review
    btn_buyer_repeat: "కొనుగోలుదారు స్వంత తనిఖీ కోరుతున్నారు", // TODO: needs native speaker review

    // Step 5 & Section D: Photo Rules (Wizard - One per screen, max 8 words)
    rule_1: "పగటి వెలుగులో ఫోటో తీయండి.", // TODO: needs native speaker review
    rule_2: "సాదా లేత గుడ్డ లేదా కాగితం వాడండి.", // TODO: needs native speaker review
    rule_3: "నాణెం గుడ్డపై ఫ్లాట్‌గా ఉంచండి.", // TODO: needs native speaker review
    rule_4: "15 టమాటాలు వరుసలో ఉంచండి. తాకకూడదు.", // TODO: needs native speaker review
    rule_5: "తొడిమ పైకి ఉంచి పైనుండి తీయండి.", // TODO: needs native speaker review
    rule_6: "ఫోన్ వంచకుండా సమాంతరంగా పైన ఉంచండి.", // TODO: needs native speaker review
    rule_7: "ఇప్పుడు టమాటాలు తిప్పండి. తొడిమ కిందకు.", // TODO: needs native speaker review
    rule_8: "స్థలం మార్చకుండా మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    rule_9: "నాణెం అదే స్థానంలోనే ఉంచండి.", // TODO: needs native speaker review

    photo_rule_1_title: "నియమం 1", // TODO: needs native speaker review
    photo_rule_1_desc: "పగటి వెలుగులో ఫోటో తీయండి.", // TODO: needs native speaker review
    photo_rule_2_title: "నియమం 2", // TODO: needs native speaker review
    photo_rule_2_desc: "సాదా లేత గుడ్డ లేదా కాగితం వాడండి.", // TODO: needs native speaker review
    photo_rule_3_title: "నియమం 3", // TODO: needs native speaker review
    photo_rule_3_desc: "నాణెం గుడ్డపై ఫ్లాట్‌గా ఉంచండి.", // TODO: needs native speaker review
    photo_rule_4_title: "నియమం 4", // TODO: needs native speaker review
    photo_rule_4_desc: "15 టమాటాలు వరుసలో ఉంచండి. తాకకూడదు.", // TODO: needs native speaker review
    photo_rule_5_title: "నియమం 5", // TODO: needs native speaker review
    photo_rule_5_desc: "తొడిమ పైకి ఉంచి పైనుండి తీయండి.", // TODO: needs native speaker review
    photo_rule_6_title: "నియమం 6", // TODO: needs native speaker review
    photo_rule_6_desc: "ఫోన్ వంచకుండా సమాంతరంగా పైన ఉంచండి.", // TODO: needs native speaker review
    photo_rule_7_title: "నియమం 7", // TODO: needs native speaker review
    photo_rule_7_desc: "ఇప్పుడు టమాటాలు తిప్పండి. తొడిమ కిందకు.", // TODO: needs native speaker review
    photo_rule_8_title: "నియమం 8", // TODO: needs native speaker review
    photo_rule_8_desc: "స్థలం మార్చకుండా మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    photo_rule_9_title: "నియమం 9", // TODO: needs native speaker review
    photo_rule_9_desc: "నాణెం అదే స్థానంలోనే ఉంచండి.", // TODO: needs native speaker review

    // Live Camera & Capture Checks
    camera_label_a: "బ్యాచ్ {n}/{m}. ఫోటో A (తొడిమ పైకి)", // TODO: needs native speaker review
    camera_label_b: "బ్యాచ్ {n}/{m}. ఫోటో B (తొడిమ కిందకు)", // TODO: needs native speaker review
    coin_spot: "🪙 నాణెం", // TODO: needs native speaker review
    camera_heading: "బ్యాచ్ {curr}/{total}: ఫోటో {type}", // TODO: needs native speaker review
    photo_a_label: "ఫోటో A (తొడిమ పైకి)", // TODO: needs native speaker review
    photo_b_label: "ఫోటో B (తొడిమ కిందకు)", // TODO: needs native speaker review
    photo_c_label: "ఫోటో C (పక్క వైపు - ఐచ్ఛికం)", // TODO: needs native speaker review
    check_coin_found: "నాణెం దొరికింది", // TODO: needs native speaker review
    check_not_blurry: "ఫోటో స్పష్టంగా ఉంది", // TODO: needs native speaker review
    check_not_dark: "వెలుతురు బాగుంది", // TODO: needs native speaker review
    check_not_tilted: "ఫోన్ సమాంతరంగా ఉంది", // TODO: needs native speaker review
    check_no_touch: "పండ్లు విడివిడిగా ఉన్నాయి", // TODO: needs native speaker review
    check_coin_ready: "నాణెం దొరికింది", // TODO: needs native speaker review
    check_coin_missing: "నాణెం కనిపించలేదు", // TODO: needs native speaker review
    check_sharp_good: "ఫోటో స్పష్టంగా ఉంది", // TODO: needs native speaker review
    check_sharp_blurry: "ఫోటో మసకగా ఉంది", // TODO: needs native speaker review
    check_light_good: "వెలుతురు బాగుంది", // TODO: needs native speaker review
    check_light_dark: "చీకటిగా ఉంది", // TODO: needs native speaker review
    btn_capture: "ఫోటో తీయండి", // TODO: needs native speaker review
    btn_retake: "మళ్లీ తీయండి", // TODO: needs native speaker review
    btn_use_anyway: "అయినా ఉపయోగించండి", // TODO: needs native speaker review
    thumbnail_photo_a: "ఫోటో A (తొడిమ పైకి)", // TODO: needs native speaker review
    blocked_no_coin: "నాణెం దొరకలేదు. బ్యాచ్ గ్రేడింగ్ సాధ్యం కాదు.", // TODO: needs native speaker review
    blocked_blurry_or_dark: "ఫోటో మసకగా లేదా చీకటిగా ఉంది. మళ్లీ తీయండి.", // TODO: needs native speaker review
    blocked_missing_photo_b: "ఫోటో B లేదు. మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    gallery_warning: "గ్యాలరీ ఫోటో 60 నిమిషాల కంటే పాతది కావచ్చు.", // TODO: needs native speaker review
    progress_batch_bar: "బ్యాచ్ {curr}/{total} పూర్తి. {fcurr}/{ftarget} టమాటాలు.", // TODO: needs native speaker review
    btn_finish_early: "తక్కువ పండ్లతో ముగించండి", // TODO: needs native speaker review

    // Hand Check & Weight Check
    hand_check_title: "చేతితో నొక్కి చూసే పరీక్ష", // TODO: needs native speaker review
    hand_check_prompt: "10 టమాటాలను చేతితో నొక్కండి. ఎన్ని మెత్తగా ఉన్నాయి?", // TODO: needs native speaker review
    hand_check_count: "మెత్తని టమాటాల సంఖ్య (0 నుండి 10)", // TODO: needs native speaker review
    weight_check_title: "నమూనా బరువు (ఐచ్ఛికం)", // TODO: needs native speaker review
    weight_check_prompt: "నమూనా పండ్లను తూచండి. కిలోలు నమోదు చేయండి.", // TODO: needs native speaker review
    weight_check_placeholder: "ఉదా. 1.8 కిలోలు", // TODO: needs native speaker review
    btn_compute_grade: "గ్రేడ్ లెక్కించండి", // TODO: needs native speaker review

    // Results & Verdicts
    results_heading: "టమాటా ఫలితం", // TODO: needs native speaker review
    lot_grade_label: "వచ్చిన గ్రేడ్", // TODO: needs native speaker review
    grades: {
      A: "గ్రేడ్ A", // TODO: needs native speaker review
      B: "గ్రేడ్ B", // TODO: needs native speaker review
      C: "గ్రేడ్ C", // TODO: needs native speaker review
      Reject: "తిరస్కరణ" // TODO: needs native speaker review
    },
    grade_a: "గ్రేడ్ A", // TODO: needs native speaker review
    grade_b: "గ్రేడ్ B", // TODO: needs native speaker review
    grade_c: "గ్రేడ్ C", // TODO: needs native speaker review
    grade_reject: "తిరస్కరణ", // TODO: needs native speaker review
    "grades.A": "గ్రేడ్ A", // TODO: needs native speaker review
    "grades.B": "గ్రేడ్ B", // TODO: needs native speaker review
    "grades.C": "గ్రేడ్ C", // TODO: needs native speaker review
    "grades.Reject": "తిరస్కరణ", // TODO: needs native speaker review
    verdict_sure: "ఖచ్చితం", // TODO: needs native speaker review
    verdict_unsure: "స్పష్టత లేదు. మరో 20 టమాటాలు చూడండి.", // TODO: needs native speaker review
    verdict_not_this: "ఈ గ్రేడ్ కాదు", // TODO: needs native speaker review
    btn_add_20_more: "మరో 20 టమాటాలు కలపండి", // TODO: needs native speaker review
    no_grade_zero_fruit: "గ్రేడ్ లేదు. పండ్లు కనపడలేదు.", // TODO: needs native speaker review
    no_grade_zero: "పండ్లు దొరకలేదు. మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    no_grade_few: "పండ్లు దొరకలేదు. మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    could_not_find_fruit_retake: "పండ్లు దొరకలేదు. మళ్లీ ఫోటో తీయండి.", // TODO: needs native speaker review
    lot_too_small: "గ్రేడ్ కోసం లాట్ చాలా చిన్నది.", // TODO: needs native speaker review
    indicative_badge: "కేవలం సూచన మాత్రమే", // TODO: needs native speaker review
    not_changed_since_saved: "సేవ్ చేసిన తర్వాత నివేదిక మారలేదు", // TODO: needs native speaker review
    server_saved_badge: "సేవ్ చేసిన తర్వాత నివేదిక మారలేదు", // TODO: needs native speaker review
    local_saved_badge: "ఫోన్‌లో మాత్రమే భద్రపరచబడింది", // TODO: needs native speaker review
    report_line_1: "{n} పండ్లు తనిఖీ చేయబడ్డాయి.", // TODO: needs native speaker review
    report_line_2: "చెడిపోయినవి: 100 లో సుమారు {p}.", // TODO: needs native speaker review
    report_line_2_zero: "పండ్లు కనపడలేదు.", // TODO: needs native speaker review
    report_line_3: "అంచనా ధర: {rate}.", // TODO: needs native speaker review
    report_line_3_empty: "తుది ధరను మీరిద్దరూ నిర్ణయించుకోండి.", // TODO: needs native speaker review
    not_sure_yet: "స్పష్టత లేదు", // TODO: needs native speaker review
    wa_flags_count: "⚠️ {count} ఫ్లాగ్‌లు:", // TODO: needs native speaker review
    wa_no_flags: "✓ ఫ్లాగ్‌లు లేవు", // TODO: needs native speaker review
    wa_grade_label: "గ్రేడ్: {grade}", // TODO: needs native speaker review
    wa_sample_label: "తనిఖీ: {n} పండ్లు", // TODO: needs native speaker review
    ack_farmer_accepted: "రైతు అంగీకరించారు {time}", // TODO: needs native speaker review
    ack_farmer_disputed: "రైతు అసమ్మతి {time}", // TODO: needs native speaker review
    ack_buyer_accepted: "కొనుగోలుదారు అంగీకరించారు {time}", // TODO: needs native speaker review
    ack_buyer_disputed: "కొనుగోలుదారు అసమ్మతి {time}", // TODO: needs native speaker review

    // Wilson Range Bar
    wilson_bar_text: "చెడిపోయినవి: 100 లో సుమారు {p}. {low} నుండి {high} ఉండవచ్చు.", // TODO: needs native speaker review
    surface_seen_85: "టమాటా సుమారు 85% ఉపరితలం చూడబడింది.", // TODO: needs native speaker review
    surface_seen_45: "టమాటా సుమారు 45% ఉపరితలం చూడబడింది.", // TODO: needs native speaker review
    hidden_defect_warning: "లోపలి కుళ్ళు మరియు మెత్తదనం ఫోటోలో కనిపించదు.", // TODO: needs native speaker review

    // Price Open Table
    price_title: "ధర గుణకాల ఉదాహరణ", // TODO: needs native speaker review
    example_only: "ఉదాహరణ మాత్రమే", // TODO: needs native speaker review
    price_example_tag: "ఉదాహరణ మాత్రమే", // TODO: needs native speaker review
    price_base_label: "మూల ధర (₹/కిలో)", // TODO: needs native speaker review
    price_rate_label: "అంచనా ధర", // TODO: needs native speaker review
    price_mult_a: "గ్రేడ్ A = మూల ధర (x 1.00)", // TODO: needs native speaker review
    price_mult_b: "గ్రేడ్ B = మూల ధర x 0.85", // TODO: needs native speaker review
    price_mult_c: "గ్రేడ్ C = మూల ధర x 0.70", // TODO: needs native speaker review
    price_mult_reject: "రిజెక్ట్ = ₹0.00", // TODO: needs native speaker review

    // Fruit Details Toggle
    btn_toggle_details: "పండ్ల వివరాలు చూడండి", // TODO: needs native speaker review
    btn_hide_details: "వివరాలు దాచండి", // TODO: needs native speaker review
    fruit_size_approx: "సుమారు పరిమాణం (± {x} మి.మీ)", // TODO: needs native speaker review
    fruit_defects: "మచ్చల శాతం", // TODO: needs native speaker review
    fruit_grade: "గ్రేడ్", // TODO: needs native speaker review
    btn_mark_not_damage: "మచ్చ కాదు (తీసివేయండి)", // TODO: needs native speaker review
    user_edited_tag: "వినియోగదారు సవరించారు", // TODO: needs native speaker review

    // Flags
    flag_f0: "నాణెం దొరకలేదు.", // TODO: needs native speaker review
    flag_f0b: "ఫోటో మసకగా లేదా చీకటిగా ఉంది.", // TODO: needs native speaker review
    flag_f0c: "20 కంటే తక్కువ పండ్లు ఉన్నాయి.", // TODO: needs native speaker review
    flag_f0d: "ఫోటో B (రెండవ వైపు) లేదు.", // TODO: needs native speaker review
    flag_f1: "{y} కేజీల్లో {x} పండ్లు చూశారు. {z} కావాలి.", // TODO: needs native speaker review
    flag_f2: "చాలా తక్కువ క్రేట్లు తెరిచారు.", // TODO: needs native speaker review
    flag_f3: "పై భాగం మాత్రమే చూడబడింది.", // TODO: needs native speaker review
    flag_f4: "ఫోన్ 10 డిగ్రీలకు మించి వంగి ఉంది.", // TODO: needs native speaker review
    flag_f5: "పండ్ల దగ్గర చీకటి నీడలు ఉన్నాయి.", // TODO: needs native speaker review
    flag_f6: "పండ్లు ఒకదానికొకటి తాకుతున్నాయి.", // TODO: needs native speaker review
    flag_f7: "ఒకే క్రేట్ లేదా చిన్న కుప్ప.", // TODO: needs native speaker review
    flag_f8: "పండ్ల సంఖ్య వేరు. ఫోటో B మళ్లీ తీయండి.", // TODO: needs native speaker review
    flag_f9: "పై పొర కింద పొర కంటే చాలా బాగుంది.", // TODO: needs native speaker review
    flag_f10: "రైతు, కొనుగోలుదారు నమూనాలలో పెద్ద తేడా ఉంది.", // TODO: needs native speaker review
    flag_f11: "అదే ఫోటో లేదా పండు మళ్లీ వాడారు.", // TODO: needs native speaker review
    flag_f12: "గ్యాలరీ నుండి పాత ఫోటో పెట్టారు.", // TODO: needs native speaker review
    flag_f13: "చేతితో చూస్తే మెత్తని పండ్లు దొరికాయి.", // TODO: needs native speaker review
    flag_f14: "ఎంపిక సమయంలో ఇద్దరూ లేరు.", // TODO: needs native speaker review
    flag_f15: "నాణెం అరిగిపోయింది లేదా సరైనది కాదు.", // TODO: needs native speaker review
    flag_f16: "వేర్వేరు రకాల టమాటాలు కలిసి ఉన్నాయి.", // TODO: needs native speaker review
    flag_f17: "తీవ్రమైన ఎండ లేదా రంగు తేడా ఉంది.", // TODO: needs native speaker review
    flag_f18: "లోపలి కుళ్ళు ఫోటోలో కనిపించదు.", // TODO: needs native speaker review
    flag_f19: "పరిమాణం సుమారు మాత్రమే.", // TODO: needs native speaker review
    f18: "లోపలి కుళ్ళు ఫోటోలో కనిపించదు.", // TODO: needs native speaker review
    f19: "పరిమాణం సుమారు మాత్రమే.", // TODO: needs native speaker review
    F18: "లోపలి కుళ్ళు ఫోటోలో కనిపించదు.", // TODO: needs native speaker review
    F19: "పరిమాణం సుమారు మాత్రమే.", // TODO: needs native speaker review
    btn_debug_view: "డీబగ్ వీక్షణ", // TODO: needs native speaker review
    indicative_title_all: "INDICATIVE ONLY / सिर्फ़ संकेत / కేవలం సూచన మాత్రమే", // TODO: needs native speaker review

    // Agreement & Audit
    ack_heading: "మీ పరస్పర మాటల రికార్డు", // TODO: needs native speaker review
    party_label: "మీ పాత్ర", // TODO: needs native speaker review
    party_farmer: "రైతు", // TODO: needs native speaker review
    party_buyer: "కొనుగోలుదారు / వ్యాపారి", // TODO: needs native speaker review
    verdict_accept: "ఈ గ్రేడ్‌కు అంగీకరిస్తున్నాను", // TODO: needs native speaker review
    verdict_dispute: "అసమ్మతి / పునరాలోచన", // TODO: needs native speaker review
    pin_label: "4 అంకెల పిన్ నమోదు చేయండి", // TODO: needs native speaker review
    pin_placeholder: "4 అంకెలు", // TODO: needs native speaker review
    pin_unverified: "ఎవరు సంతకం చేశారో ధృవీకరించబడలేదు", // TODO: needs native speaker review
    note_label: "గమనిక / కారణం", // TODO: needs native speaker review
    note_placeholder: "ఉదా. 5% రాయితీతో అంగీకరించారు.", // TODO: needs native speaker review
    btn_submit_ack: "రికార్డును భద్రపరచండి", // TODO: needs native speaker review
    ack_recorded_msg: "రికార్డు భద్రపరచబడింది.", // TODO: needs native speaker review

    // Share & QR
    share_heading: "రిపోర్టును షేర్ చేయండి", // TODO: needs native speaker review
    btn_whatsapp_share: "వాట్సాప్‌లో పంపండి", // TODO: needs native speaker review
    btn_copy_link: "లింక్ కాపీ చేయండి", // TODO: needs native speaker review
    btn_download_qr: "QR కోడ్ డౌన్‌లోడ్", // TODO: needs native speaker review
    btn_print_pdf: "ప్రింట్ / PDF", // TODO: needs native speaker review
    btn_delete_photos: "నా ఫోటోలు తొలగించండి", // TODO: needs native speaker review
    delete_photos: "నా ఫోటోలు తొలగించండి", // TODO: needs native speaker review
    privacy: "ఫోటోలు ఈ నివేదిక కోసం మాత్రమే వాడతాము.", // TODO: needs native speaker review
    privacy_note: "ఫోటోలు ఈ నివేదిక కోసం మాత్రమే వాడతాము.", // TODO: needs native speaker review
    photos_deleted_msg: "సర్వర్ నుండి ఫోటోలు తొలగించబడ్డాయి.", // TODO: needs native speaker review

    // Admin & Tests
    admin_test_title: "టెస్ట్ మోడ్: CSV తో చేతి గ్రేడ్ల పోలిక", // TODO: needs native speaker review
    admin_sim_title: "శాంప్లింగ్ సిమ్యులేషన్ (100-పండ్ల క్రేట్)", // TODO: needs native speaker review
    admin_cal_title: "కాలిపర్ పారలాక్స్ క్రమాంకనం", // TODO: needs native speaker review
    admin_checklist_title: "ఫీల్డ్ టెస్ట్ చెక్‌లిస్ట్", // TODO: needs native speaker review
    btn_export_csv: "CSV డౌన్‌లోడ్", // TODO: needs native speaker review
    btn_run_sim: "సిమ్యులేషన్ రన్ చేయండి", // TODO: needs native speaker review
    btn_save_cal: "పారలాక్స్ ఫ్యాక్టర్ భద్రపరచండి" // TODO: needs native speaker review
  }
};

let currentLanguage = (typeof localStorage !== "undefined" && localStorage.getItem("agrigrade_lang")) || "en";

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("agrigrade_lang", lang);
    }
    applyTranslations();
  }
}

function getLanguage() {
  return currentLanguage;
}

function t(key, vars = {}) {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  let str;
  if (key && typeof key === "string" && key.includes(".")) {
    const parts = key.split(".");
    str = parts.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
    if (str === undefined) {
      str = parts.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS.en);
    }
  }
  if (str === undefined) {
    str = dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] !== undefined ? TRANSLATIONS.en[key] : key);
  }
  if (typeof str !== "string") {
    return str;
  }
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return str;
}

function applyTranslations() {
  if (typeof document === "undefined") return;

  const titleText = t("title");
  if (titleText && titleText !== "title") {
    document.title = titleText;
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const metaText = t("meta");
    if (metaText && metaText !== "meta") {
      metaDesc.setAttribute("content", metaText);
    }
  }

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      const translated = t(key);
      if (typeof translated === "string") {
        el.textContent = translated;
      }
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      const translated = t(key);
      if (typeof translated === "string") {
        el.placeholder = translated;
      }
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      const translated = t(key);
      if (typeof translated === "string") {
        el.title = translated;
      }
    }
  });

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLanguage);
  });

  if (document.documentElement) {
    document.documentElement.lang = currentLanguage;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TRANSLATIONS, t, getLanguage, setLanguage, applyTranslations };
}

