/* =========================================================
   Data access — designed so nobody but you can change the
   live site.

   * The PUBLIC site (index.html, case-study.html) always
     reads from projects.js — the published file. Nothing a
     visitor does in their browser can alter it.
   * The CRM (admin.html) writes only to a private draft in
     YOUR browser (localStorage). It never affects visitors.
     You "publish" by downloading projects.js and replacing
     the file.
   * You can preview unpublished drafts by opening a page with
     ?preview=1 (the CRM links do this for you).
   ========================================================= */
(function () {
  var KEY = "pulkit_projects_draft";
  var SKEY = "pulkit_site_draft";

  function draftOrNull() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) { var a = JSON.parse(s); if (Array.isArray(a) && a.length) return a; }
    } catch (e) {}
    return null;
  }

  // What the PUBLIC site shows. Published data only — uneditable by visitors.
  window.getProjectsForView = function () {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("preview") === "1") {
        var d = draftOrNull();
        if (d) return d;
      }
    } catch (e) {}
    return window.PROJECTS || [];
  };

  // Private CRM draft helpers (used by admin.html only).
  window.loadDraft = draftOrNull;
  window.saveDraft = function (arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); }
    catch (e) { alert("Could not save. Browser storage may be full (large images). Try smaller images."); }
  };
  window.clearDraft = function () { localStorage.removeItem(KEY); localStorage.removeItem(SKEY); };

  /* ---- site settings (e.g. profile photo) ---- */
  function siteDraftOrNull() {
    try {
      var s = localStorage.getItem(SKEY);
      if (s) { var o = JSON.parse(s); if (o && typeof o === "object") return o; }
    } catch (e) {}
    return null;
  }
  window.getSiteForView = function () {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("preview") === "1") { var d = siteDraftOrNull(); if (d) return d; }
    } catch (e) {}
    return window.SITE || {};
  };
  window.loadSiteDraft = siteDraftOrNull;
  window.saveSiteDraft = function (o) {
    try { localStorage.setItem(SKEY, JSON.stringify(o)); }
    catch (e) { alert("Could not save photo, browser storage may be full. Try a smaller image."); }
  };
})();
