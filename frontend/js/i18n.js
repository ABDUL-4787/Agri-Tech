// AgriGrade Internationalization (i18n) Module
// Supported Languages: English (en), Hindi (hi), Telugu (te)

const TRANSLATIONS = {
  en: {
    app_title: "AgriGrade",
    tagline: "AI-Powered Tomato Quality & Size Grading",
    subtitle: "Independent, transparent quality benchmarking for Indian farmers and mandi buyers",
    disclaimer_banner: "AgriGrade is an independent negotiation reference, not a certified grading authority.",
    
    // Navigation
    nav_home: "Home",
    nav_new_grade: "New Grading",
    nav_history: "Reports History",
    nav_methodology: "How We Grade",
    nav_standards: "Standards & Rules",
    nav_language: "Language",
    
    // Home Screen
    hero_title: "Grade Tomatoes Fairly with AI & Reference Coin",
    hero_subtitle: "Snap a photo of your tomatoes with a ₹10 or ₹5 coin. Measure exact fruit size in mm, inspect surface blemishes, and generate a tamper-evident grade report for mandi negotiations.",
    btn_start_grading: "Start Tomato Grading",
    btn_view_history: "View Saved Reports",
    btn_learn_more: "How It Works",
    photo_guide_heading: "Photo Guidelines for Reliable Grading",
    guide_step1: "Place 1 to 20 tomatoes separated on a flat, light-coloured surface (newspaper, white cloth, or tray).",
    guide_step2: "Place a standard ₹10 or ₹5 coin flat beside the tomatoes at the same height.",
    guide_step3: "Photograph directly from above in clear daylight. Avoid harsh shadows or strong camera tilt.",
    guide_step4: "Ensure fruit do not overlap heavily so individual contours can be measured accurately.",

    // Upload & Options
    upload_heading: "Photograph Upload & Calibration",
    upload_desc: "Capture or select 1 to 3 photographs of your tomatoes with the reference coin.",
    camera_btn: "Open Camera",
    gallery_btn: "Upload Photos",
    drag_drop_text: "Drag & drop photos here or tap to upload",
    max_photos_hint: "Up to 3 photographs allowed (JPG, PNG, WebP up to 15MB each)",
    reference_heading: "Select Reference Object",
    ref_coin_10: "Indian ₹10 Coin (27 mm nominal diameter)",
    ref_coin_5: "Indian ₹5 Coin (23 mm nominal diameter)",
    ref_custom: "Custom Card / Object (Enter exact mm)",
    custom_mm_label: "Custom Dimension (mm)",
    custom_mm_placeholder: "e.g. 50.0",
    price_heading: "Optional Mandi Base Price (₹/kg)",
    price_hint: "Enter your local mandi benchmark rate to calculate indicative price per grade.",
    price_placeholder: "e.g. 25.00",
    btn_submit_grade: "Analyze & Grade Tomatoes",
    btn_clear: "Reset Selection",

    // Progress
    progress_heading: "AI Computer Vision in Progress...",
    step_validating: "Validating image resolution, sharpness, and daylight lighting...",
    step_calibrating: "Detecting reference coin and computing pixel-to-millimetre scale...",
    step_segmenting: "Executing watershed contour segmentation on touching tomatoes...",
    step_defects: "Measuring color ripening stage and surface blemish percentage...",
    step_lot: "Applying AGMARK/UNECE tolerance rules and generating lot fingerprint...",

    // Results & Reports
    report_title: "Observed Lot Grading Report",
    report_id_label: "Report ID",
    created_at_label: "Created At",
    observed_fruit_label: "Observed Fruit Count",
    lot_grade_label: "Overall Observed Lot Grade",
    tamper_verified: "SHA-256 Verified Authentic",
    tamper_invalid: "Integrity Warning: Report Tampered!",
    tamper_chain_corrupt: "Warning: Acknowledgement Chain Disrupted",
    calibration_status_label: "Calibration Status",
    size_uncalibrated: "Size Not Measured (Coin Uncalibrated)",
    lot_reasons_label: "Why This Lot Grade Was Assigned",
    lot_warnings_label: "Sampling & Calibration Notices",
    indicative_price_title: "Indicative Mandi Valuation",
    base_price_label: "Base Benchmark Price",
    multiplier_label: "Quality Class Multiplier",
    indicative_rate_label: "Estimated Lot Rate",
    price_formula_label: "Calculation",
    price_disclaimer: "Indicative estimate for negotiation reference only. Mandi prices vary by local supply, moisture, and transport costs.",

    // Quality Classes
    class_extra: "Extra Class",
    class_1: "Class I",
    class_2: "Class II",
    class_below: "Below Standard",

    // Color Stages
    color_mature_green: "Mature Green (0-2% red)",
    color_breaker: "Breaker (2-10% red)",
    color_turning: "Turning (10-30% red)",
    color_pink: "Pink (30-60% red)",
    color_red: "Red (60-90% red)",
    color_mature_red: "Mature Red (>90% red)",

    // Fruit results
    fruit_list_title: "Individual Fruit Inspection Breakdown",
    fruit_id_col: "Fruit #",
    fruit_size_col: "Diameter (mm)",
    fruit_size_code_col: "Size Code",
    fruit_shape_col: "Shape (Axis Ratio)",
    fruit_color_col: "Color Stage",
    fruit_defects_col: "Surface Defects",
    fruit_grade_col: "Assigned Grade",
    fruit_reasons_col: "Rule Reasons",

    // Acknowledgements
    ack_heading: "Farmer & Buyer Acknowledgement (Append-Only Audit Trail)",
    ack_desc: "Both parties can formally record agreement or dispute. Each acknowledgement is cryptographically chained to the report SHA-256 fingerprint.",
    farmer_ack_title: "Farmer Verdict",
    buyer_ack_title: "Buyer / Mandi Trader Verdict",
    party_label: "Your Role",
    verdict_label: "Verdict",
    verdict_accept: "Accept Grade & Pricing",
    verdict_dispute: "Dispute / Renegotiate",
    note_label: "Comments / Reason for dispute",
    note_placeholder: "e.g., Moisture content high, accepted at 5% discount, or agreed on Class I rate.",
    btn_submit_ack: "Sign & Record Acknowledgement",
    ack_recorded_msg: "Acknowledgement cryptographically recorded and chained.",
    already_acked_msg: "Acknowledgement already submitted for this party.",

    // Sharing & QR
    share_heading: "Share & Verify Grading Report",
    share_desc: "Anyone can scan this QR code or open the report link to inspect the exact measurements and verify tamper-proof integrity.",
    btn_copy_link: "Copy Report Link",
    btn_download_qr: "Download QR Code",
    btn_share_native: "Share via WhatsApp / Mobile",
    btn_read_aloud: "Read Report Aloud",
    read_aloud_stop: "Stop Reading",
    read_aloud_unsupported: "Speech synthesis is not available in your browser for this language.",

    // Standards Page
    standards_title: "Tomato Grading Standards & Thresholds",
    standards_intro: "AgriGrade applies deterministic engineering interpretations based on DMI/AGMARK (Directorate of Marketing & Inspection, Government of India) and UNECE FFV-36 standards.",
    standards_table_class: "Class",
    standards_table_defects: "Max Surface Defects",
    standards_table_shape: "Min Axis Ratio",
    standards_table_notes: "Requirements & Tolerances",
    standards_extra_desc: "Superficial defects < 1%, axis ratio >= 0.90, uniform color, no cracks/decay.",
    standards_class1_desc: "Defects <= 3%, axis ratio >= 0.80, slight shape variation allowed.",
    standards_class2_desc: "Defects <= 8%, axis ratio >= 0.65, greenback allowed provided fruit is firm.",
    standards_below_desc: "Defects > 8%, axis ratio < 0.65, undersized fruit (<35mm round, <30mm oblong), or cracks/decay.",
    tolerances_note: "Lot Tolerances: Extra allows maximum 5% out-of-grade; Class I and Class II allow maximum 10% out-of-grade.",
    agmark_field_note: "Field Validation Notice: These thresholds are provisional interpretations for market transparency and dispute resolution. Formal certification requires an authorized AGMARK grading inspector.",

    // History
    history_title: "Grading History & Audit Records",
    history_empty: "No grading reports found yet. Start your first grading above!",
    btn_view_report: "View Report",
    history_status_col: "Status",
    history_fruit_col: "Observed Fruit",

    // Errors & Alerts
    err_network: "Network connection error. Please verify your connection or backend server status.",
    err_select_image: "Please select at least 1 photograph to proceed.",
    err_invalid_image: "Selected file is not a supported image format. Please use JPG, PNG, or WebP.",
    err_max_images: "Maximum 3 photographs can be submitted per report.",
    copied_alert: "Report link copied to clipboard!",
    link_shared_alert: "Report ready to share."
  },

  hi: {
    app_title: "एग्रीग्रेड (AgriGrade)",
    tagline: "टमाटर गुणवत्ता और आकार ग्रेडिंग मंच",
    subtitle: "भारतीय किसानों और मंडी व्यापारियों के लिए स्वतंत्र, पारदर्शी गुणवत्ता मूल्यांकन",
    disclaimer_banner: "एग्रीग्रेड मंडी सौदों के लिए एक स्वतंत्र संदर्भ है, सरकारी प्रमाण पत्र नहीं।",
    
    // Navigation
    nav_home: "होम",
    nav_new_grade: "नया ग्रेडिंग",
    nav_history: "रिपोर्ट इतिहास",
    nav_methodology: "ग्रेडिंग विधि",
    nav_standards: "मानक और नियम",
    nav_language: "भाषा (Language)",
    
    // Home Screen
    hero_title: "सिक्के और एआई के साथ टमाटर की निष्पक्ष ग्रेडिंग करें",
    hero_subtitle: "₹10 या ₹5 के सिक्के के साथ अपने टमाटरों की तस्वीर लें। मिलीमीटर में फल का सटीक आकार मापें, दाग-धब्बे जांचें और मंडी में मोलभाव के लिए छेड़छाड़-मुक्त रिपोर्ट बनाएं।",
    btn_start_grading: "टमाटर ग्रेडिंग शुरू करें",
    btn_view_history: "पुरानी रिपोर्टें देखें",
    btn_learn_more: "यह कैसे काम करता है",
    photo_guide_heading: "सटीक ग्रेडिंग के लिए फोटो नियम",
    guide_step1: "1 से 20 टमाटरों को एक हल्के रंग की समतल सतह (सफेद कपड़ा, ट्रे या कागज) पर अलग-अलग रखें।",
    guide_step2: "टमाटरों के ठीक बगल में ₹10 या ₹5 का मानक सिक्का रखें।",
    guide_step3: "दिन की रोशनी में बिल्कुल ऊपर से सीधी फोटो लें। तिरछी फोटो या छाया से बचें।",
    guide_step4: "टमाटर आपस में ज्यादा चिपके न हों ताकि हर फल की सीमा स्पष्ट पहचानी जा सके।",

    // Upload & Options
    upload_heading: "फोटो अपलोड और पैमाना चयन",
    upload_desc: "सिक्के के साथ टमाटरों की 1 से 3 तस्वीरें कैमरे से लें या अपलोड करें।",
    camera_btn: "कैमरा खोलें",
    gallery_btn: "गैलरी से चुनें",
    drag_drop_text: "यहाँ फोटो खींचें या चुनने के लिए टैप करें",
    max_photos_hint: "अधिकतम 3 तस्वीरें (JPG, PNG, WebP प्रारूप, 15MB तक)",
    reference_heading: "संदर्भ सिक्का चुनें",
    ref_coin_10: "भारतीय ₹10 का सिक्का (27 मिमी व्यास)",
    ref_coin_5: "भारतीय ₹5 का सिक्का (23 मिमी व्यास)",
    ref_custom: "कस्टम कार्ड / वस्तु (मिमी दर्ज करें)",
    custom_mm_label: "कस्टम माप (मिमी)",
    custom_mm_placeholder: "उदा. 50.0",
    price_heading: "वैकल्पिक मंडी आधार भाव (₹/किलो)",
    price_hint: "ग्रेड के अनुसार अनुमानित दर जानने के लिए स्थानीय मंडी का भाव दर्ज करें।",
    price_placeholder: "उदा. 25.00",
    btn_submit_grade: "टमाटरों की जांच और ग्रेडिंग करें",
    btn_clear: "रीसेट करें",

    // Progress
    progress_heading: "कंप्यूटर विजन विश्लेषण जारी है...",
    step_validating: "फोटो स्पष्टता, रिज़ॉल्यूशन और रोशनी की जांच हो रही है...",
    step_calibrating: "सिक्के का पता लगाकर पिक्सेल से मिलीमीटर पैमाना तैयार किया जा रहा है...",
    step_segmenting: "वाटरशेड तकनीक से प्रत्येक टमाटर को अलग किया जा रहा है...",
    step_defects: "टमाटर के पकने का रंग और सतह के दाग-धब्बों की गणना की जा रही है...",
    step_lot: "एगमार्क/यूएनईसीई नियमों के आधार पर लॉट रिपोर्ट और हैश फिंगरप्रिंट तैयार हो रहा है...",

    // Results & Reports
    report_title: "टमाटर लॉट ग्रेडिंग रिपोर्ट",
    report_id_label: "रिपोर्ट क्रमांक (ID)",
    created_at_label: "तैयार होने का समय",
    observed_fruit_label: "जांचे गए टमाटरों की संख्या",
    lot_grade_label: "कुल लॉट का ग्रेड",
    tamper_verified: "SHA-256 सुरक्षित: रिपोर्ट असली व असंशोधित है",
    tamper_invalid: "चेतावनी: रिपोर्ट में छेड़छाड़ पाई गई!",
    tamper_chain_corrupt: "चेतावनी: सहमति हैश श्रृंखला टूट गई है",
    calibration_status_label: "माप पैमाना स्थिति",
    size_uncalibrated: "आकार नहीं मापा गया (सिक्का नहीं मिला)",
    lot_reasons_label: "यह ग्रेड मिलने का कारण",
    lot_warnings_label: "नमूना व माप संबंधित सूचनाएं",
    indicative_price_title: "अनुमानित मंडी मूल्य मूल्यांकन",
    base_price_label: "दर्ज आधार भाव",
    multiplier_label: "ग्रेड गुणक (Multiplier)",
    indicative_rate_label: "अनुमानित दर प्रति किलो",
    price_formula_label: "गणना सूत्र",
    price_disclaimer: "यह केवल बातचीत के लिए सांकेतिक मूल्य है। वास्तविक मंडी मूल्य आवक और नमी पर निर्भर करता है।",

    // Quality Classes
    class_extra: "एक्स्ट्रा क्लास (उत्कृष्ट)",
    class_1: "क्लास I (प्रथम श्रेणी)",
    class_2: "क्लास II (द्वितीय श्रेणी)",
    class_below: "मानक से कम (Below Standard)",

    // Color Stages
    color_mature_green: "पक्का हरा (0-2% लाल)",
    color_breaker: "ब्रेकर (2-10% हल्का लाल)",
    color_turning: "टर्निंग (10-30% गुलाबी/लाल)",
    color_pink: "गुलाबी (30-60% लाल)",
    color_red: "लाल (60-90% लाल)",
    color_mature_red: "पूर्ण परिपक्व लाल (>90% गहरा लाल)",

    // Fruit results
    fruit_list_title: "प्रत्येक टमाटर की विस्तृत जांच",
    fruit_id_col: "टमाटर #",
    fruit_size_col: "व्यास (मिमी)",
    fruit_size_code_col: "साइज़ कोड",
    fruit_shape_col: "आकार अनुपात",
    fruit_color_col: "रंग अवस्था",
    fruit_defects_col: "दाग-धब्बे (%)",
    fruit_grade_col: "प्राप्त ग्रेड",
    fruit_reasons_col: "ग्रेड का कारण",

    // Acknowledgements
    ack_heading: "किसान और व्यापारी सहमति (अपरिवर्तनीय ऑडिट ट्रेल)",
    ack_desc: "दोनों पक्ष ग्रेड पर अपनी सहमति या असहमति दर्ज कर सकते हैं। प्रत्येक प्रविष्टि क्रिप्टोग्राफिक हैश द्वारा सुरक्षित रहती है।",
    farmer_ack_title: "किसान का निर्णय",
    buyer_ack_title: "खरीदार / आढ़ती का निर्णय",
    party_label: "आपकी भूमिका",
    verdict_label: "निर्णय",
    verdict_accept: "ग्रेड और भाव स्वीकार है",
    verdict_dispute: "आपत्ति / दोबारा मोलभाव",
    note_label: "टिप्पणी / आपत्ति का कारण",
    note_placeholder: "उदा. नमी अधिक है, 5% छूट पर तय हुआ, या क्लास I दर मंजूर है।",
    btn_submit_ack: "हस्ताक्षर व सहमति दर्ज करें",
    ack_recorded_msg: "सहमति सफलतापूर्वक हैश श्रृंखला में दर्ज हो गई।",
    already_acked_msg: "इस पक्ष द्वारा पहले ही सहमति दर्ज की जा चुकी है।",

    // Sharing & QR
    share_heading: "रिपोर्ट साझा करें और जांचें",
    share_desc: "कोई भी व्यक्ति इस क्यूआर कोड को स्कैन करके रिपोर्ट की प्रामाणिकता की पुष्टि कर सकता है।",
    btn_copy_link: "रिपोर्ट लिंक कॉपी करें",
    btn_download_qr: "क्यूआर कोड डाउनलोड करें",
    btn_share_native: "व्हाट्सएप पर भेजें",
    btn_read_aloud: "रिपोर्ट बोलकर सुनाएं (Audio)",
    read_aloud_stop: "बोलना रोकें",
    read_aloud_unsupported: "आपके ब्राउज़र में हिंदी आवाज उपलब्ध नहीं है।",

    // Standards Page
    standards_title: "टमाटर ग्रेडिंग मानक और सीमाएं",
    standards_intro: "एग्रीग्रेड भारत सरकार के एगमार्क (DMI/AGMARK) और UNECE FFV-36 नियमों पर आधारित पारदर्शी नियमों का उपयोग करता है।",
    standards_table_class: "श्रेणी (Class)",
    standards_table_defects: "अधिकतम दाग सीमा",
    standards_table_shape: "न्यूनतम गोल अनुपात",
    standards_table_notes: "विशेषताएं और सहनशीलता",
    standards_extra_desc: "दाग < 1%, अनुपात >= 0.90, एक समान रंग, दरार या सड़न बिल्कुल नहीं।",
    standards_class1_desc: "दाग <= 3%, अनुपात >= 0.80, मामूली आकार भिन्नता मान्य।",
    standards_class2_desc: "दाग <= 8%, अनुपात >= 0.65, हरा कंधा मान्य यदि फल सख्त हो।",
    standards_below_desc: "दाग > 8%, अनुपात < 0.65, छोटा आकार (<35मिमी गोल, <30मिमी लंबा), या सड़े-फटे फल।",
    tolerances_note: "लॉट छूट (Tolerances): एक्स्ट्रा में 5% तक और क्लास I व II में 10% तक निम्न फल मान्य हैं।",
    agmark_field_note: "क्षेत्र सत्यापन सूचना: ये नियम बाजार में निष्पक्ष बातचीत के लिए हैं। कानूनी प्रमाण के लिए अधिकृत ग्रेडर से जांच कराएं।",

    // History
    history_title: "पिछली ग्रेडिंग रिपोर्टें",
    history_empty: "अभी तक कोई रिपोर्ट नहीं है। ऊपर दिए गए बटन से नई ग्रेडिंग शुरू करें!",
    btn_view_report: "रिपोर्ट खोलें",
    history_status_col: "स्थिति",
    history_fruit_col: "कुल फल",

    // Errors & Alerts
    err_network: "सर्वर से संपर्क नहीं हो पाया। कृपया नेटवर्क या बैकएंड की स्थिति जांचें।",
    err_select_image: "कृपया जांच के लिए कम से कम 1 फोटो चुनें।",
    err_invalid_image: "चुनी गई फाइल सही फोटो प्रारूप में नहीं है। JPG या PNG का उपयोग करें।",
    err_max_images: "एक रिपोर्ट में अधिकतम 3 फोटो ही अपलोड किए जा सकते हैं।",
    copied_alert: "रिपोर्ट लिंक कॉपी कर लिया गया है!",
    link_shared_alert: "रिपोर्ट साझा करने के लिए तैयार है।"
  },

  te: {
    app_title: "అగ్రిగ్రేడ్ (AgriGrade)",
    tagline: "ఏఐ ఆధారిత టమోటా నాణ్యత & సైజు గ్రేడింగ్",
    subtitle: "రైతులు మరియు వ్యాపారుల కోసం పారదర్శకమైన టమోటా నాణ్యత నిర్ధారణ వేదిక",
    disclaimer_banner: "అగ్రిగ్రేడ్ మార్కెట్ ధరల చర్చలకు స్వతంత్ర మార్గదర్శి మాత్రమే, ప్రభుత్వ ధృవీకరణ పత్రం కాదు.",
    
    // Navigation
    nav_home: "హోమ్",
    nav_new_grade: "కొత్త గ్రేడింగ్",
    nav_history: "రిపోర్టుల హిస్టరీ",
    nav_methodology: "గ్రేడింగ్ విధానం",
    nav_standards: "నాణ్యత ప్రమాణాలు",
    nav_language: "భాష (Language)",
    
    // Home Screen
    hero_title: "నాణెం మరియు ఏఐ సహాయంతో టమోటా నాణ్యతను కొలవండి",
    hero_subtitle: "₹10 లేదా ₹5 నాణెంతో మీ టమోటాల ఫోటో తీయండి. మిల్లీమీటర్లలో పరిమాణం, మచ్చలు మరియు రంగు ఆధారంగా సురక్షితమైన గ్రేడింగ్ రిపోర్టును పొందండి.",
    btn_start_grading: "టమోటా గ్రేడింగ్ ప్రారంభించండి",
    btn_view_history: "పాత రిపోర్టులు చూడండి",
    btn_learn_more: "ఇది ఎలా పనిచేస్తుంది",
    photo_guide_heading: "ఖచ్చితమైన గ్రేడింగ్ కోసం ఫోటో సూచనలు",
    guide_step1: "1 నుండి 20 టమోటాలను తెల్లని బట్ట లేదా ట్రేపై ఒకదానికొకటి తాకకుండా విడిగా ఉంచండి.",
    guide_step2: "టమోటాల పక్కనే ఒక ₹10 లేదా ₹5 నాణేన్ని సమతలంగా ఉంచండి.",
    guide_step3: "పగటి వెలుతురులో పైనుండి నిలువుగా స్పష్టమైన ఫోటో తీయండి. నీడలు పడకుండా చూసుకోండి.",
    guide_step4: "టమోటాలు ఒకదానిపై ఒకటి ఉండకూడదు, ప్రతి టమోటా స్పష్టంగా కనిపించాలి.",

    // Upload & Options
    upload_heading: "ఫోటో అప్‌లోడ్ & కొలత నాణెం",
    upload_desc: "నాణెంతో ఉన్న 1 నుండి 3 టమోటా ఫోటోలను కెమెరా ద్వారా తీయండి లేదా అప్‌లోడ్ చేయండి.",
    camera_btn: "కెమెరా తెరవండి",
    gallery_btn: "గ్యాలరీ నుండి ఎంచుకోండి",
    drag_drop_text: "ఫోటోలను ఇక్కడ లాగండి లేదా ఎంచుకోవడానికి నొక్కండి",
    max_photos_hint: "గరిష్టంగా 3 ఫోటోలు (JPG, PNG, WebP, గరిష్ట పరిమాణం 15MB)",
    reference_heading: "నాణెం రకం ఎంచుకోండి",
    ref_coin_10: "భారతీయ ₹10 నాణెం (27 మి.మీ వ్యాసం)",
    ref_coin_5: "భారతీయ ₹5 నాణెం (23 మి.మీ వ్యాసం)",
    ref_custom: "ఇతర కొలత కార్డు / వస్తువు (మి.మీ నమోదు చేయండి)",
    custom_mm_label: "కొలత పరిమాణం (మి.మీ)",
    custom_mm_placeholder: "ఉదా. 50.0",
    price_heading: "ఐచ్ఛిక మార్కెట్ ధర (₹/కిలో)",
    price_hint: "గ్రేడ్ ప్రకారం ధర అంచనా వేయడానికి మీ స్థానిక మార్కెట్ ధరను నమోదు చేయండి.",
    price_placeholder: "ఉదా. 25.00",
    btn_submit_grade: "టమోటా నాణ్యతను పరీక్షించండి",
    btn_clear: "రీసెట్ చేయండి",

    // Progress
    progress_heading: "కంప్యూటర్ విజన్ విశ్లేషణ జరుగుతోంది...",
    step_validating: "చిత్రం స్పష్టత మరియు కాంతిని పరీక్షిస్తోంది...",
    step_calibrating: "నాణేన్ని గుర్తించి పిక్సెల్-మిల్లీమీటర్ కొలతను లెక్కిస్తోంది...",
    step_segmenting: "వాటర్‌షెడ్ విధానం ద్వారా ప్రతి టమోటాను వేరు చేస్తోంది...",
    step_defects: "పండు రంగు మరియు ఉపరితల మచ్చలను గణిస్తోంది...",
    step_lot: "అగ్‌మార్క్ నియమాల ప్రకారం లాట్ గ్రేడ్ మరియు హాష్ ఫింగర్‌ప్రింట్‌ను సిద్ధం చేస్తోంది...",

    // Results & Reports
    report_title: "టమోటా లాట్ గ్రేడింగ్ నివేదిక",
    report_id_label: "రిపోర్ట్ నంబర్ (ID)",
    created_at_label: "తయారైన సమయం",
    observed_fruit_label: "పరీక్షించిన టమోటాల సంఖ్య",
    lot_grade_label: "మొత్తం లాట్ గ్రేడ్",
    tamper_verified: "SHA-256 ధృవీకరించబడింది: నివేదిక అసలైనది",
    tamper_invalid: "హెచ్చరిక: నివేదికలో మార్పులు జరిగాయి!",
    tamper_chain_corrupt: "హెచ్చరిక: ఆమోద గొలుసులో లోపం ఉంది",
    calibration_status_label: "కొలత స్థితి",
    size_uncalibrated: "పరిమాణం కొలవబడలేదు (నాణెం కనుగొనబడలేదు)",
    lot_reasons_label: "ఈ గ్రేడ్ రావడానికి గల కారణాలు",
    lot_warnings_label: "నమూనా మరియు కొలతల వివరాలు",
    indicative_price_title: "అంచనా మార్కెట్ విలువ",
    base_price_label: "నమోదు చేసిన మూల ధర",
    multiplier_label: "నాణ్యత గుణకం (Multiplier)",
    indicative_rate_label: "అంచనా ధర ప్రతి కిలోకు",
    price_formula_label: "లెక్కింపు విధానం",
    price_disclaimer: "ఇది మార్కెట్ బేరసారాల కోసం సూచనాత్మక ధర మాత్రమే. తేమ మరియు రవాణా ఖర్చులపై ఆధారపడి ధర మారవచ్చు.",

    // Quality Classes
    class_extra: "ఎక్స్‌ట్రా క్లాస్ (ఉత్తమ నాణ్యత)",
    class_1: "క్లాస్ I (మొదటి రకం)",
    class_2: "క్లాస్ II (రెండవ రకం)",
    class_below: "ప్రమాణం కంటే తక్కువ (Below Standard)",

    // Color Stages
    color_mature_green: "ముదురు ఆకుపచ్చ (0-2% ఎరుపు)",
    color_breaker: "బ్రేకర్ (2-10% కొద్దిగా ఎరుపు)",
    color_turning: "టర్నింగ్ (10-30% ఎరుపు)",
    color_pink: "గులాబీ (30-60% ఎరుపు)",
    color_red: "ఎరుపు (60-90% ఎరుపు)",
    color_mature_red: "పూర్తి ఎరుపు (>90% ముదురు ఎరుపు)",

    // Fruit results
    fruit_list_title: "ప్రతి టమోటా వ్యక్తిగత పరిశీలన",
    fruit_id_col: "టమోటా #",
    fruit_size_col: "వ్యాసం (మి.మీ)",
    fruit_size_code_col: "సైజు కోడ్",
    fruit_shape_col: "ఆకారం నిష్పత్తి",
    fruit_color_col: "రంగు దశ",
    fruit_defects_col: "మచ్చల శాతం (%)",
    fruit_grade_col: "వచ్చిన గ్రేడ్",
    fruit_reasons_col: "కారణాలు",

    // Acknowledgements
    ack_heading: "రైతు & వ్యాపారి ఆమోదం (ఆడిట్ రికార్డు)",
    ack_desc: "ఇరుపక్షాలు రిపోర్టుపై తమ ఆమోదం లేదా అభ్యంతరాన్ని నమోదు చేసుకోవచ్చు. ఇది హాష్ భద్రతతో శాశ్వతంగా నిల్వ చేయబడుతుంది.",
    farmer_ack_title: "రైతు నిర్ణయం",
    buyer_ack_title: "కొనుగోలుదారు / వ్యాపారి నిర్ణయం",
    party_label: "మీ పాత్ర",
    verdict_label: "నిర్ణయం",
    verdict_accept: "గ్రేడ్ మరియు ధర ఆమోదించబడింది",
    verdict_dispute: "అభ్యంతరం / పునరాలోచన",
    note_label: "వ్యాఖ్య / అభ్యంతరానికి గల కారణం",
    note_placeholder: "ఉదా. తేమ ఎక్కువగా ఉంది, 5% తగ్గింపుతో ఒప్పందం కుదిరింది.",
    btn_submit_ack: "సంతకం చేసి నమోదు చేయండి",
    ack_recorded_msg: "ఆమోదం విజయవంతంగా నమోదు చేయబడింది.",
    already_acked_msg: "ఈ పక్షం నుండి ఇప్పటికే నిర్ణయం నమోదు చేయబడింది.",

    // Sharing & QR
    share_heading: "నివేదికను భాగస్వామ్యం చేయండి",
    share_desc: "ఈ క్యూఆర్ కోడ్ స్కాన్ చేసి ఎవరైనా రిపోర్టు నిజమైనదా కాదా అని తనిఖీ చేయవచ్చు.",
    btn_copy_link: "రిపోర్ట్ లింక్ కాపీ చేయండి",
    btn_download_qr: "క్యూఆర్ కోడ్ డౌన్‌లోడ్ చేయండి",
    btn_share_native: "వాట్సాప్ ద్వారా పంపండి",
    btn_read_aloud: "రిపోర్టును చదివి వినిపించండి (Audio)",
    read_aloud_stop: "ఆపండి",
    read_aloud_unsupported: "మీ బ్రౌజర్‌లో తెలుగు వాయిస్ సపోర్ట్ అందుబాటులో లేదు.",

    // Standards Page
    standards_title: "టమోటా నాణ్యతా ప్రమాణాలు & నిబంధనలు",
    standards_intro: "అగ్రిగ్రేడ్ భారత ప్రభుత్వ అగ్‌మార్క్ (AGMARK) మరియు UNECE FFV-36 అంతర్జాతీయ ప్రమాణాల ఆధారంగా పనిచేస్తుంది.",
    standards_table_class: "తరగతి (Class)",
    standards_table_defects: "గరిష్ట మచ్చల శాతం",
    standards_table_shape: "గుండ్రని నిష్పత్తి",
    standards_table_notes: "లక్షణాలు మరియు నిబంధనలు",
    standards_extra_desc: "మచ్చలు < 1%, నిష్పత్తి >= 0.90, ఒకే విధమైన రంగు, పగుళ్లు లేదా కుళ్లు ఉండకూడదు.",
    standards_class1_desc: "మచ్చలు <= 3%, నిష్పత్తి >= 0.80, స్వల్ప ఆకార మార్పు అనుమతించబడుతుంది.",
    standards_class2_desc: "మచ్చలు <= 8%, నిష్పత్తి >= 0.65, కాయ గట్టిగా ఉంటే ఆకుపచ్చ భుజాలు అనుమతించబడతాయి.",
    standards_below_desc: "మచ్చలు > 8%, నిష్పత్తి < 0.65, చిన్న సైజు (<35మి.మీ గుండ్రని, <30మి.మీ పొడవు), లేదా పగుళ్లు/కుళ్లు.",
    tolerances_note: "లాట్ మినహాయింపులు: ఎక్స్‌ట్రాలో 5% వరకు మరియు క్లాస్ I & II లలో 10% వరకు నాణ్యత తేడాలు అనుమతించబడతాయి.",
    agmark_field_note: "క్షేత్ర స్థాయి గమనిక: ఇవి మార్కెట్ పారదర్శకత కోసం రూపొందించబడినవి. చట్టబద్ధమైన ధృవీకరణ కోసం అధికారిక ఇన్స్పెక్టర్ పరిశీలన అవసరం.",

    // History
    history_title: "మునుపటి గ్రేడింగ్ నివేదికలు",
    history_empty: "ఇప్పటివరకు ఎలాంటి నివేదికలు లేవు. పై బటన్ నొక్కి కొత్త గ్రేడింగ్ చేయండి!",
    btn_view_report: "నివేదిక చూడండి",
    history_status_col: "స్థితి",
    history_fruit_col: "పండ్ల సంఖ్య",

    // Errors & Alerts
    err_network: "సర్వర్ అనుసంధానం విఫలమైంది. దయచేసి నెట్‌వర్క్ తనిఖీ చేయండి.",
    err_select_image: "దయచేసి కనీసం 1 ఫోటోను ఎంచుకోండి.",
    err_invalid_image: "ఎంచుకున్న ఫైల్ సరైన చిత్రం కాదు. JPG లేదా PNG ఫైళ్లను ఉపయోగించండి.",
    err_max_images: "ఒక నివేదికకు గరిష్టంగా 3 ఫోటోలు మాత్రమే అనుమతించబడతాయి.",
    copied_alert: "రిపోర్ట్ లింక్ కాపీ చేయబడింది!",
    link_shared_alert: "రిపోర్ట్ షేరింగ్ కోసం సిద్ధంగా ఉంది."
  }
};

let currentLanguage = localStorage.getItem("agrigrade_lang") || "en";

function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem("agrigrade_lang", lang);
    applyTranslations();
  }
}

function t(key) {
  const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.placeholder = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.title = t(key);
    }
  });

  // Update active state on language buttons
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLanguage);
  });

  // Document language attribute
  document.documentElement.lang = currentLanguage;
}
