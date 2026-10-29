// AgriGrade Flags Catalog & Top Strip Renderer
// Defines every flag: { code, severity, icon, textKey }
// Flags show in a strip at the TOP, in the chosen language. Cannot be hidden.

const AgriGradeFlags = {
  CATALOG: {
    F0: { code: "F0", severity: "block", icon: "🛑", textKey: "flag_f0" },
    F0b: { code: "F0b", severity: "block", icon: "🛑", textKey: "flag_f0b" },
    F0c: { code: "F0c", severity: "block", icon: "🛑", textKey: "flag_f0c" },
    F0d: { code: "F0d", severity: "block", icon: "🛑", textKey: "flag_f0d" },
    F1: { code: "F1", severity: "warning", icon: "⚠️", textKey: "flag_f1" },
    F2: { code: "F2", severity: "warning", icon: "⚠️", textKey: "flag_f2" },
    F3: { code: "F3", severity: "warning", icon: "⚠️", textKey: "flag_f3" },
    F4: { code: "F4", severity: "warning", icon: "⚠️", textKey: "flag_f4" },
    F5: { code: "F5", severity: "warning", icon: "⚠️", textKey: "flag_f5" },
    F6: { code: "F6", severity: "warning", icon: "⚠️", textKey: "flag_f6" },
    F7: { code: "F7", severity: "warning", icon: "⚠️", textKey: "flag_f7" },
    F8: { code: "F8", severity: "block", icon: "🛑", textKey: "flag_f8" },
    F9: { code: "F9", severity: "warning", icon: "⚠️", textKey: "flag_f9" },
    F10: { code: "F10", severity: "warning", icon: "⚠️", textKey: "flag_f10" },
    F11: { code: "F11", severity: "warning", icon: "⚠️", textKey: "flag_f11" },
    F12: { code: "F12", severity: "warning", icon: "⚠️", textKey: "flag_f12" },
    F13: { code: "F13", severity: "warning", icon: "⚠️", textKey: "flag_f13" },
    F14: { code: "F14", severity: "warning", icon: "⚠️", textKey: "flag_f14" },
    F15: { code: "F15", severity: "warning", icon: "⚠️", textKey: "flag_f15" },
    F16: { code: "F16", severity: "warning", icon: "⚠️", textKey: "flag_f16" },
    F17: { code: "F17", severity: "warning", icon: "⚠️", textKey: "flag_f17" },
    F18: { code: "F18", severity: "info", icon: "ℹ️", textKey: "flag_f18" },
    F19: { code: "F19", severity: "info", icon: "ℹ️", textKey: "flag_f19" }
  },

  getFlag(code) {
    const upper = (code || "").toUpperCase();
    return this.CATALOG[upper] || this.CATALOG[code] || {
      code,
      severity: "warning",
      icon: "⚠️",
      textKey: `flag_${(code || "").toLowerCase()}`
    };
  },

  isBlocking(code) {
    const f = this.getFlag(code);
    return f.severity === "block";
  },

  renderTopStrip(flags, containerElement, tFunction) {
    if (!containerElement) return;
    if (!flags || flags.length === 0) {
      containerElement.style.display = "none";
      containerElement.innerHTML = "";
      return;
    }

    const t = tFunction || (typeof window !== "undefined" && window.t) || ((k) => k);

    containerElement.innerHTML = "";
    containerElement.style.display = "flex";

    flags.forEach(flagItem => {
      const code = typeof flagItem === "string" ? flagItem : flagItem.code;
      const meta = this.getFlag(code);
      let text = (typeof flagItem === "object" && flagItem.text) ? flagItem.text : (t(meta.textKey) || t(code) || t((code || "").toLowerCase()));
      // Prevent double code e.g. "F0b: F0b:" -> show code once
      if (text && typeof text === "string") {
        text = text.replace(new RegExp(`^${code}:\\s*`, 'i'), '');
      }

      const itemDiv = document.createElement("div");
      itemDiv.className = `flag-strip-item ${meta.severity}`;
      itemDiv.innerHTML = `<span>${meta.icon}</span> <span><strong>${code}:</strong> ${text}</span>`;
      containerElement.appendChild(itemDiv);
    });
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = AgriGradeFlags;
}
if (typeof window !== "undefined") {
  window.AgriGradeFlags = AgriGradeFlags;
}
