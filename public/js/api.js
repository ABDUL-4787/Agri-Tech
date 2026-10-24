// AgriGrade API Client Module

const AgriGradeAPI = (() => {
  const getBaseUrl = () => {
    // If configured via global variable or window location
    if (window.AGRIGRADE_API_BASE) {
      return window.AGRIGRADE_API_BASE.replace(/\/$/, "");
    }
    return ""; // Relative path /api/... works locally and on Vercel deployment
  };

  const request = async (endpoint, options = {}) => {
    const url = `${getBaseUrl()}${endpoint}`;
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        let errDetail = `Server returned status ${response.status}`;
        if (response.status === 413) {
          errDetail = "Image file size exceeded server limit (4.5 MB). Please select a smaller photo or fewer images.";
        }
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errDetail = errData.detail;
          }
        } catch (_) {}
        throw new Error(errDetail);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  };

  return {
    async checkHealth() {
      return request("/api/health");
    },

    async getCrops() {
      return request("/api/crops");
    },

    async getStandards(crop = "tomato") {
      return request(`/api/standards/${encodeURIComponent(crop)}`);
    },

    async submitGrading(formData) {
      return request("/api/grade", {
        method: "POST",
        body: formData
      });
    },

    async saveReport(reportData) {
      return request("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reportData)
      });
    },

    async getReport(reportId) {
      return request(`/api/reports/${encodeURIComponent(reportId)}`);
    },

    async submitAcknowledgement(reportId, ackData) {
      return request(`/api/reports/${encodeURIComponent(reportId)}/ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ackData)
      });
    },

    async listReports(ids = null) {
      let endpoint = "/api/reports";
      if (ids) {
        endpoint += `?ids=${encodeURIComponent(ids)}`;
      }
      return request(endpoint);
    },

    async getPrices() {
      return request("/api/prices");
    },

    async getConfig() {
      return request("/api/config");
    },

    async calibrate(caliperMeasurements) {
      return request("/api/admin/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caliper_measurements: caliperMeasurements })
      });
    },

    async deletePhotos(reportId) {
      return request(`/api/reports/${encodeURIComponent(reportId)}/photos`, {
        method: "DELETE"
      });
    }
  };
})();
