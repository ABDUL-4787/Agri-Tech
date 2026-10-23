// AgriGrade Main Application Controller

const AgriGradeApp = (() => {
  // State
  let selectedFiles = [];
  let currentReport = null;
  let synthUtterance = null;

  // DOM Elements
  const dom = {};

  const init = () => {
    cacheDom();
    bindEvents();
    applyTranslations();
    handleHashNavigation();
    window.addEventListener("hashchange", handleHashNavigation);

    // Initial check of recent reports & health
    loadRecentReports();
  };

  const cacheDom = () => {
    dom.views = document.querySelectorAll(".view-panel");
    dom.navLinks = document.querySelectorAll(".nav-link");
    dom.langBtns = document.querySelectorAll(".lang-btn");
    dom.mobileToggle = document.querySelector(".mobile-nav-toggle");
    dom.navLinksContainer = document.querySelector(".nav-links");

    // Upload & Options
    dom.fileInput = document.getElementById("file-input");
    dom.cameraInput = document.getElementById("camera-input");
    dom.dropzone = document.getElementById("photo-dropzone");
    dom.previewGallery = document.getElementById("preview-gallery");
    dom.customMmGroup = document.getElementById("custom-mm-group");
    dom.customMmInput = document.getElementById("custom-dimension-mm");
    dom.mandiPriceInput = document.getElementById("mandi-price-input");
    dom.btnSubmitGrade = document.getElementById("btn-submit-grade");
    dom.btnClear = document.getElementById("btn-clear-selection");

    // Progress
    dom.progressSteps = document.querySelectorAll(".progress-step-item");

    // Report
    dom.reportIdDisplay = document.getElementById("report-id-display");
    dom.reportDateDisplay = document.getElementById("report-date-display");
    dom.tamperBadge = document.getElementById("tamper-badge");
    dom.tamperText = document.getElementById("tamper-text");
    dom.lotGradePill = document.getElementById("lot-grade-pill");
    dom.fruitCountStat = document.getElementById("fruit-count-stat");
    dom.calStatusStat = document.getElementById("cal-status-stat");
    dom.annotatedImg = document.getElementById("annotated-img");
    dom.pricingCard = document.getElementById("pricing-card");
    dom.pricingRate = document.getElementById("pricing-rate");
    dom.pricingFormula = document.getElementById("pricing-formula");
    dom.lotReasonsList = document.getElementById("lot-reasons-list");
    dom.lotWarningsList = document.getElementById("lot-warnings-list");
    dom.fruitTableBody = document.getElementById("fruit-table-body");
    dom.qrImg = document.getElementById("report-qr-img");
    dom.btnCopyLink = document.getElementById("btn-copy-link");
    dom.btnDownloadQr = document.getElementById("btn-download-qr");
    dom.btnShareNative = document.getElementById("btn-share-native");
    dom.btnReadAloud = document.getElementById("btn-read-aloud");

    // Ack
    dom.ackForm = document.getElementById("ack-form");
    dom.ackParty = document.getElementById("ack-party");
    dom.ackVerdict = document.getElementById("ack-verdict");
    dom.ackNote = document.getElementById("ack-note");
    dom.ackRecordsList = document.getElementById("ack-records-list");

    // History
    dom.historyTableBody = document.getElementById("history-table-body");
    dom.historyEmpty = document.getElementById("history-empty");
  };

  const bindEvents = () => {
    // Language buttons
    dom.langBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        setLanguage(btn.dataset.lang);
        if (currentReport) renderReport(currentReport);
      });
    });

    // Mobile nav toggle
    if (dom.mobileToggle) {
      dom.mobileToggle.addEventListener("click", () => {
        dom.navLinksContainer.classList.toggle("mobile-open");
      });
    }

    // Navigation links
    dom.navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const viewId = link.getAttribute("data-view");
        if (viewId) {
          e.preventDefault();
          window.location.hash = `#${viewId}`;
          if (dom.navLinksContainer) dom.navLinksContainer.classList.remove("mobile-open");
        }
      });
    });

    // File Input / Camera
    if (dom.fileInput) {
      dom.fileInput.addEventListener("change", handleFileSelect);
    }
    if (dom.cameraInput) {
      dom.cameraInput.addEventListener("change", handleFileSelect);
    }

    // Drag & drop
    if (dom.dropzone) {
      ["dragenter", "dragover"].forEach(name => {
        dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dom.dropzone.classList.add("dragover");
        });
      });
      ["dragleave", "drop"].forEach(name => {
        dom.dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          dom.dropzone.classList.remove("dragover");
        });
      });
      dom.dropzone.addEventListener("drop", (e) => {
        if (e.dataTransfer && e.dataTransfer.files) {
          addFiles(Array.from(e.dataTransfer.files));
        }
      });
    }

    // Radio reference cards
    document.querySelectorAll("input[name='ref-type']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        const isCustom = e.target.value === "custom_card";
        if (dom.customMmGroup) {
          dom.customMmGroup.style.display = isCustom ? "block" : "none";
        }
      });
    });

    // Reset button
    if (dom.btnClear) {
      dom.btnClear.addEventListener("click", () => {
        selectedFiles = [];
        renderPreviews();
      });
    }

    // Submit Grading Button
    if (dom.btnSubmitGrade) {
      dom.btnSubmitGrade.addEventListener("click", submitGrading);
    }

    // Ack form
    if (dom.ackForm) {
      dom.ackForm.addEventListener("submit", submitAcknowledgement);
    }

    // Share buttons
    if (dom.btnCopyLink) {
      dom.btnCopyLink.addEventListener("click", copyReportLink);
    }
    if (dom.btnDownloadQr) {
      dom.btnDownloadQr.addEventListener("click", downloadQrCode);
    }
    if (dom.btnShareNative) {
      dom.btnShareNative.addEventListener("click", shareReportNative);
    }
    if (dom.btnReadAloud) {
      dom.btnReadAloud.addEventListener("click", toggleReadAloud);
    }
  };

  const handleHashNavigation = () => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || hash === "home") {
      showView("view-home");
    } else if (hash === "new") {
      showView("view-new-grade");
    } else if (hash === "history") {
      showView("view-history");
      loadRecentReports();
    } else if (hash === "methodology") {
      showView("view-methodology");
    } else if (hash === "standards") {
      showView("view-standards");
    } else if (hash.startsWith("report-")) {
      const reportId = hash.replace(/^report-/, "");
      fetchAndShowReport(reportId);
    } else {
      showView("view-home");
    }
  };

  const showView = (viewId) => {
    dom.views.forEach(view => {
      view.classList.toggle("active-view", view.id === viewId);
    });

    // Update nav link active state
    dom.navLinks.forEach(link => {
      const target = link.getAttribute("data-view");
      link.classList.toggle("active", `view-${target}` === viewId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const addFiles = (files) => {
    const valid = files.filter(f => f.type.startsWith("image/"));
    if (valid.length === 0) {
      alert(t("err_invalid_image"));
      return;
    }

    for (const file of valid) {
      if (selectedFiles.length >= 3) {
        alert(t("err_max_images"));
        break;
      }
      selectedFiles.push(file);
    }
    renderPreviews();
  };

  const removeFile = (idx) => {
    selectedFiles.splice(idx, 1);
    renderPreviews();
  };

  const renderPreviews = () => {
    if (!dom.previewGallery) return;
    dom.previewGallery.innerHTML = "";

    selectedFiles.forEach((file, idx) => {
      const item = document.createElement("div");
      item.className = "preview-item";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      item.appendChild(img);

      const delBtn = document.createElement("button");
      delBtn.className = "preview-remove-btn";
      delBtn.innerHTML = "&times;";
      delBtn.addEventListener("click", () => removeFile(idx));
      item.appendChild(delBtn);

      dom.previewGallery.appendChild(item);
    });
  };

  const submitGrading = async () => {
    if (selectedFiles.length === 0) {
      alert(t("err_select_image"));
      return;
    }

    showView("view-progress");
    animateProgress();

    const selectedRef = document.querySelector("input[name='ref-type']:checked")?.value || "coin_10";
    const customMm = dom.customMmInput ? dom.customMmInput.value : "";
    const mandiPrice = dom.mandiPriceInput ? dom.mandiPriceInput.value : "";

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append("images", file);
    });
    formData.append("reference_type", selectedRef);
    if (customMm) formData.append("custom_dimension_mm", customMm);
    if (mandiPrice) formData.append("mandi_price_per_kg", mandiPrice);

    try {
      const report = await AgriGradeAPI.submitGrading(formData);
      currentReport = report;
      renderReport(report);
      window.location.hash = `#report-${report.id}`;
      // Clear selected files after successful submission
      selectedFiles = [];
      renderPreviews();
    } catch (err) {
      alert(`${t("err_network")}: ${err.message}`);
      showView("view-new-grade");
    }
  };

  const animateProgress = () => {
    let currentStep = 0;
    const interval = setInterval(() => {
      dom.progressSteps.forEach((step, idx) => {
        step.classList.toggle("active", idx <= currentStep);
      });
      currentStep++;
      if (currentStep >= dom.progressSteps.length) {
        clearInterval(interval);
      }
    }, 600);
  };

  const fetchAndShowReport = async (reportId) => {
    showView("view-progress");
    try {
      const report = await AgriGradeAPI.getReport(reportId);
      currentReport = report;
      renderReport(report);
      showView("view-report");
    } catch (err) {
      alert(`Could not load report '${reportId}': ${err.message}`);
      showView("view-history");
    }
  };

  const renderReport = (report) => {
    showView("view-report");

    // Header Meta
    dom.reportIdDisplay.textContent = report.id;
    dom.reportDateDisplay.textContent = new Date(report.created_at).toLocaleString();

    // Tamper badge
    if (report.tamper_status === "VERIFIED_AUTHENTIC") {
      dom.tamperBadge.className = "tamper-badge verified";
      dom.tamperText.textContent = t("tamper_verified");
    } else {
      dom.tamperBadge.className = "tamper-badge tampered";
      dom.tamperText.textContent = t("tamper_invalid");
    }

    // Lot Grade
    const lotClass = report.lot_class || "Ungraded";
    dom.lotGradePill.textContent = lotClass;
    dom.lotGradePill.className = `grade-pill ${lotClass.replace(/\s+/g, "-")}`;

    // Stats
    dom.fruitCountStat.textContent = report.n_fruit || 0;
    const cal = report.calibration;
    if (cal && cal.pixels_per_mm) {
      dom.calStatusStat.textContent = `${cal.reference_type} (${cal.pixels_per_mm} px/mm)`;
    } else {
      dom.calStatusStat.textContent = t("size_uncalibrated");
    }

    // Annotated Image
    if (report.annotated_image_urls && report.annotated_image_urls.length > 0) {
      dom.annotatedImg.src = report.annotated_image_urls[0];
      dom.annotatedImg.style.display = "block";
    } else {
      dom.annotatedImg.style.display = "none";
    }

    // Pricing
    const priceData = report.lot_report?.indicative_price;
    if (priceData) {
      dom.pricingCard.style.display = "block";
      dom.pricingRate.textContent = `₹${priceData.indicative_price_per_kg.toFixed(2)} / kg`;
      dom.pricingFormula.textContent = priceData.calculation_formula;
    } else {
      dom.pricingCard.style.display = "none";
    }

    // Lot Reasons & Warnings
    dom.lotReasonsList.innerHTML = "";
    (report.lot_report?.reasons || []).forEach(r => {
      const li = document.createElement("li");
      li.textContent = r;
      dom.lotReasonsList.appendChild(li);
    });

    dom.lotWarningsList.innerHTML = "";
    (report.pipeline_warnings || report.lot_report?.warnings || []).forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      dom.lotWarningsList.appendChild(li);
    });

    // Individual fruit breakdown table
    renderFruitTable(report.fruit_results || []);

    // Acknowledgements
    renderAcknowledgements(report.acknowledgements || []);

    // QR Code
    if (report.qr_data_url) {
      dom.qrImg.src = report.qr_data_url;
    } else {
      dom.qrImg.src = `/api/reports/${report.id}/qr`;
    }
  };

  const renderFruitTable = (fruits) => {
    dom.fruitTableBody.innerHTML = "";
    if (fruits.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="8" style="text-align:center; padding: 20px; color: var(--text-muted);">No individual tomatoes detected.</td>`;
      dom.fruitTableBody.appendChild(tr);
      return;
    }

    fruits.forEach(f => {
      const tr = document.createElement("tr");
      const dia = f.diameter_mm !== null ? `${f.diameter_mm.toFixed(1)} mm` : "N/A";
      const sizeCd = f.size_code !== null ? `Size ${f.size_code}` : "Uncalibrated";
      const qClass = f.quality_class;

      tr.innerHTML = `
        <td><strong>#${f.fruit_id}</strong></td>
        <td>${dia}</td>
        <td>${sizeCd}</td>
        <td>${f.shape_category} (${f.axis_ratio.toFixed(2)})</td>
        <td>${f.color_stage}</td>
        <td>${f.defect_area_pct.toFixed(1)}%</td>
        <td><span class="grade-pill ${qClass.replace(/\s+/g, "-")}" style="font-size:0.78rem; padding: 4px 10px;">${qClass}</span></td>
        <td style="font-size:0.8rem; color: var(--text-secondary); max-width: 240px;">${(f.reasons || []).join("; ")}</td>
      `;
      dom.fruitTableBody.appendChild(tr);
    });
  };

  const renderAcknowledgements = (acks) => {
    dom.ackRecordsList.innerHTML = "";
    if (acks.length === 0) {
      dom.ackRecordsList.innerHTML = `<p style="font-size:0.85rem; color: var(--text-muted);">No party acknowledgements signed yet.</p>`;
      return;
    }

    acks.forEach(ack => {
      const div = document.createElement("div");
      div.className = `ack-record-item ${ack.verdict}`;
      const partyTitle = ack.party === "farmer" ? t("farmer_ack_title") : t("buyer_ack_title");
      const verdictText = ack.verdict === "accept" ? t("verdict_accept") : t("verdict_dispute");

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-weight: 600;">
          <span>${partyTitle}</span>
          <span style="color: ${ack.verdict === 'accept' ? 'var(--primary-700)' : 'var(--accent-red)'}">${verdictText}</span>
        </div>
        <p style="margin: 4px 0 6px;">${ack.note ? `"${ack.note}"` : "Signed without additional notes."}</p>
        <div class="ack-hash-code">
          <span>Timestamp: ${new Date(ack.created_at).toLocaleString()}</span><br/>
          <span>Prev Hash: ${ack.prev_hash.slice(0, 16)}...</span><br/>
          <span>Ack Hash: ${ack.ack_hash}</span>
        </div>
      `;
      dom.ackRecordsList.appendChild(div);
    });
  };

  const submitAcknowledgement = async (e) => {
    e.preventDefault();
    if (!currentReport) return;

    const party = dom.ackParty.value;
    const verdict = dom.ackVerdict.value;
    const note = dom.ackNote.value;

    try {
      const resp = await AgriGradeAPI.submitAcknowledgement(currentReport.id, {
        party,
        verdict,
        note
      });

      alert(t("ack_recorded_msg"));
      dom.ackNote.value = "";
      // Refresh report
      fetchAndShowReport(currentReport.id);
    } catch (err) {
      alert(`Error submitting acknowledgement: ${err.message}`);
    }
  };

  const loadRecentReports = async () => {
    if (!dom.historyTableBody) return;
    try {
      const reports = await AgriGradeAPI.listReports();
      dom.historyTableBody.innerHTML = "";

      if (reports.length === 0) {
        if (dom.historyEmpty) dom.historyEmpty.style.display = "block";
        return;
      }
      if (dom.historyEmpty) dom.historyEmpty.style.display = "none";

      reports.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${r.id}</strong></td>
          <td>${new Date(r.created_at).toLocaleDateString()}</td>
          <td>${r.n_fruit}</td>
          <td><span class="grade-pill ${r.lot_class.replace(/\s+/g, "-")}" style="font-size:0.75rem; padding: 3px 8px;">${r.lot_class}</span></td>
          <td>${r.acknowledgements_count > 0 ? `${r.acknowledgements_count} Signed` : "Pending"}</td>
          <td><a href="#report-${r.id}" class="btn btn-secondary btn-sm">${t("btn_view_report")}</a></td>
        `;
        dom.historyTableBody.appendChild(tr);
      });
    } catch (err) {
      console.warn("Could not load recent reports:", err);
    }
  };

  const copyReportLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert(t("copied_alert"));
    }).catch(() => {
      prompt("Copy report link:", url);
    });
  };

  const downloadQrCode = () => {
    if (!currentReport) return;
    const a = document.createElement("a");
    a.href = `/api/reports/${currentReport.id}/qr`;
    a.download = `AgriGrade_${currentReport.id}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareReportNative = () => {
    if (navigator.share && currentReport) {
      navigator.share({
        title: `AgriGrade Report ${currentReport.id}`,
        text: `Tomato Quality Report: Grade ${currentReport.lot_class} (${currentReport.n_fruit} tomatoes observed).`,
        url: window.location.href
      }).catch(() => {});
    } else {
      copyReportLink();
    }
  };

  const toggleReadAloud = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("read_aloud_unsupported"));
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      dom.btnReadAloud.textContent = t("btn_read_aloud");
      return;
    }

    if (!currentReport) return;

    let textToSpeak = "";
    if (currentLanguage === "hi") {
      textToSpeak = `एग्रीग्रेड रिपोर्ट क्रमांक ${currentReport.id}। कुल जाँचे गए टमाटर: ${currentReport.n_fruit}। प्राप्त लॉट ग्रेड: ${currentReport.lot_class}। रिपोर्ट अखंडता: असंशोधित व सुरक्षित।`;
      if (currentReport.lot_report?.indicative_price) {
        textToSpeak += ` अनुमानित मंडी भाव: ${currentReport.lot_report.indicative_price.indicative_price_per_kg} रुपये प्रति किलो।`;
      }
    } else if (currentLanguage === "te") {
      textToSpeak = `అగ్రిగ్రేడ్ రిపోర్ట్ సంఖ్య ${currentReport.id}। మొత్తం టమోటాలు: ${currentReport.n_fruit}। వచ్చిన లాట్ గ్రేడ్: ${currentReport.lot_class}। రిపోర్ట్ సురక్షితమైనది.`;
      if (currentReport.lot_report?.indicative_price) {
        textToSpeak += ` అంచనా మార్కెట్ ధర: కిలోకి ${currentReport.lot_report.indicative_price.indicative_price_per_kg} రూపాయలు.`;
      }
    } else {
      textToSpeak = `AgriGrade Report ID ${currentReport.id}. Observed fruit count: ${currentReport.n_fruit}. Overall lot grade: ${currentReport.lot_class}. Report integrity is verified authentic.`;
      if (currentReport.lot_report?.indicative_price) {
        textToSpeak += ` Indicative rate is ${currentReport.lot_report.indicative_price.indicative_price_per_kg} Rupees per kilogram.`;
      }
    }

    synthUtterance = new SpeechSynthesisUtterance(textToSpeak);
    synthUtterance.lang = currentLanguage === "hi" ? "hi-IN" : (currentLanguage === "te" ? "te-IN" : "en-IN");
    
    synthUtterance.onend = () => {
      dom.btnReadAloud.textContent = t("btn_read_aloud");
    };

    dom.btnReadAloud.textContent = t("read_aloud_stop");
    window.speechSynthesis.speak(synthUtterance);
  };

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", AgriGradeApp.init);
