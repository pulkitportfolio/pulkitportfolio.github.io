/* Per-item scroll reveal helper (project cards, experience cards).
   Renderers add .item-reveal and call observeReveals() after inserting markup. */
var observeReveals = (function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = null;
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
  }
  return function () {
    document.querySelectorAll(".item-reveal:not(.in)").forEach(function (el) {
      if (io) io.observe(el);
      else el.classList.add("in");
    });
  };
})();

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function escapeAttr(s) { return escapeHtml(s); }

/* Mobile nav toggle + highlight the current page's nav link */
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }
  var here = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a[href]").forEach(function (a) {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });
})();

/* Project cards — grid with filters; data-limit caps the count on the home page */
(function () {
  var grid = document.getElementById("grid");
  if (!grid) return;

  var projects = window.getProjectsForView();
  var current = "all";
  // keep the preview flag on links so unpublished (draft) projects stay viewable
  var previewQS = (new URLSearchParams(location.search).get("preview") === "1") ? "&preview=1" : "";

  function media(p) {
    if (p.thumbnail) {
      return '<img src="' + escapeAttr(p.thumbnail) + '" alt="' + escapeAttr(p.title) +
        '" loading="lazy" decoding="async" onerror="this.parentNode.innerHTML=\'' +
        '<div class=&quot;ph&quot;>' + escapeAttr(p.title) + '</div>\'">';
    }
    return '<div class="ph">' + escapeHtml(p.title) + "</div>";
  }

  var limit = parseInt(grid.getAttribute("data-limit") || "0", 10);

  function render() {
    var list = projects.filter(function (p) {
      return current === "all" || p.category === current;
    });
    if (limit > 0) {
      // home page: projects ticked "Selected" in admin come first; if fewer than
      // the minimum (4), the newest others fill the remaining slots
      var feat = list.filter(function (p) { return p.featured; });
      var rest = list.filter(function (p) { return !p.featured; });
      list = feat.concat(rest).slice(0, Math.max(limit, feat.length));
    }

    if (!list.length) {
      grid.innerHTML = '<div class="empty">No projects here yet. Open <b>admin.html</b> to add your work.</div>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var label = p.category === "app" ? "App" : "Website";
      var csHref = p.customUrl || ("case-study.html?id=" + encodeURIComponent(p.id) + previewQS);
      return '' +
        '<article class="pcard item-reveal" tabindex="0" data-href="' + escapeAttr(csHref) + '">' +
          '<div class="pbody">' +
            '<div class="plabels"><span class="pl-a">' + escapeHtml(label) + '</span><span class="pl-b">' + escapeHtml(p.year || "") + "</span></div>" +
            "<h3>" + escapeHtml(p.title) + "</h3>" +
            '<p class="psummary">' + escapeHtml(p.summary || "") + "</p>" +
            '<div class="prule"></div>' +
            '<a class="plink" href="' + escapeAttr(csHref) + '">' + escapeHtml(p.ctaText || "Read case study") + ' <span class="arw">&rarr;</span></a>' +
            (p.cardCtaLabel && p.cardCtaUrl
              ? '<a class="plink sec" href="' + escapeAttr(p.cardCtaUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.cardCtaLabel) + ' <span class="arw">&#8599;</span></a>'
              : "") +
          "</div>" +
          '<div class="pthumb">' + media(p) + "</div>" +
        "</article>";
    }).join("");

    // whole card is clickable (except real links inside it)
    grid.querySelectorAll(".pcard").forEach(function (card) {
      var go = function () { var h = card.getAttribute("data-href"); if (h) location.href = h; };
      card.addEventListener("click", function (e) { if (!e.target.closest("a")) go(); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
    observeReveals();
  }

  // filters
  var filters = document.querySelectorAll(".filter");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      filters.forEach(function (x) { x.classList.remove("active"); });
      f.classList.add("active");
      current = f.getAttribute("data-filter");
      render();
    });
  });

  render();
})();

/* Brand icons for the "Tools I work with" chips (keyed by lowercase tool name) */
var TOOL_ICONS = {
  "figma": '<span class="ticon"><svg viewBox="0 0 38 57" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg></span>',
  "adobe xd": '<span class="ticon badge" style="background:#470137;color:#FF61F6">Xd</span>',
  "claude code": '<span class="ticon"><svg viewBox="0 0 24 24" fill="none" stroke="#D97757" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3 5.3 18.7"/></svg></span>',
  "relume": '<span class="ticon badge" style="background:#0F0F0F">Re</span>',
  "gemini": '<span class="ticon"><svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gemg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285F4"/><stop offset="1" stop-color="#9B72CB"/></linearGradient></defs><path fill="url(#gemg)" d="M12 1c.6 6 5 10.4 11 11-6 .6-10.4 5-11 11-.6-6-5-10.4-11-11 6-.6 10.4-5 11-11z"/></svg></span>',
  "chatgpt": '<span class="ticon"><svg viewBox="0 0 24 24" fill="#0F0F0F" aria-hidden="true"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zM13.2599 22.4301a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6455zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg></span>',
  "gpt": '<span class="ticon"><svg viewBox="0 0 24 24" fill="#0F0F0F" aria-hidden="true"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zM13.2599 22.4301a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6455zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg></span>',
  "google stitch": '<span class="ticon"><img src="images/tools/stitch.png" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px"></span>',
  "framer": '<span class="ticon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#0F0F0F" d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z"/></svg></span>'
};
function toolIcon(name) {
  var key = String(name || "").trim().toLowerCase();
  if (TOOL_ICONS[key]) return TOOL_ICONS[key];
  var initial = (key.charAt(0) || "•").toUpperCase();
  return '<span class="ticon badge" style="background:#6E6E6E">' + escapeHtml(initial) + "</span>";
}

/* Render all editable site content from SITE (managed in the CMS) */
(function () {
  var s = window.getSiteForView ? window.getSiteForView() : (window.SITE || {});
  if (!s || typeof s !== "object") return;

  function esc(x) { return escapeHtml(x); }
  function txt(id, v) { var e = document.getElementById(id); if (e && v != null && v !== "") e.textContent = v; }
  function html(id, v) { var e = document.getElementById(id); if (e && v != null) e.innerHTML = v; }

  /* ---- hero ---- */
  var heroName = [s.name, s.nameLast].filter(Boolean).join(" ").trim();
  txt("site-hero-name", heroName);
  txt("site-hero-a", s.heroTitleA);
  txt("site-hero-b", s.heroTitleB);
  txt("site-hero-strong", s.heroLeadStrong);
  txt("site-hero-lead", s.heroLead);

  /* ---- words of trust: one wide card, arrows switch recommendations ---- */
  (function () {
    var slide = document.getElementById("trust-slide");
    if (!slide) return;
    var items = Array.isArray(s.testimonials) ? s.testimonials : null;
    if (items && !items.length) {
      var ts = document.getElementById("trust");
      if (ts) ts.style.display = "none";
      return;
    }
    if (!items) {
      items = [
        { quote: "Recommendation text goes here. Open the admin panel, Site content tab, and replace these sample cards with real words from people you have worked with.", name: "Name Surname", role: "Role, Company" },
        { quote: "A second sample recommendation. One or two sentences work best, spoken in the person's own voice.", name: "Name Surname", role: "Role, Company" },
        { quote: "A third sample recommendation. The arrows below switch between however many you add.", name: "Name Surname", role: "Role, Company" }
      ];
    }
    var idx = 0, count = document.getElementById("trust-count");
    function show(i, instant) {
      idx = (i + items.length) % items.length;
      function paint() {
        var t = items[idx];
        slide.querySelector(".tq").textContent = t.quote || "";
        slide.querySelector(".tn").textContent = t.name || "";
        slide.querySelector(".tr").textContent = t.role || "";
        if (count) count.textContent = (idx + 1) + " / " + items.length;
        slide.classList.remove("swap");
      }
      if (instant) { paint(); return; }
      slide.classList.add("swap");
      setTimeout(paint, 220);
    }
    var prev = document.getElementById("trust-prev"), next = document.getElementById("trust-next");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });
    show(0, true);
  })();

  var pill = document.getElementById("site-avail-pill");
  if (pill && s.openToWork === false) pill.style.display = "none";

  var facts = [];
  if (s.location) facts.push('<span class="pbadge">📍 ' + esc(s.location) + "</span>");
  if (s.experienceBadge) facts.push('<span class="pbadge">' + esc(s.experienceBadge) + "</span>");
  if (facts.length) html("site-facts", facts.join(""));

  var ln = (s.linkedin || "").trim();
  var heroLn = document.getElementById("hero-linkedin");
  if (heroLn) { if (ln) heroLn.href = ln; else heroLn.style.display = "none"; }

  /* ---- approach statement (word-split for the grey → dark scroll reveal) ---- */
  var ap = s.approach || {};
  txt("site-approach-kicker", ap.kicker);
  var apEl = document.getElementById("site-approach");
  if (apEl) {
    var apText = (ap.text != null && ap.text !== "") ? ap.text : apEl.textContent.replace(/\s+/g, " ").trim();
    apEl.innerHTML = apText.split(/\s+/).map(function (w) {
      return '<span class="word">' + esc(w) + "</span>";
    }).join(" ");
  }

  /* ---- experience: left column ---- */
  var about = s.about || {};
  txt("site-about-desc", about.description);
  var toolsEl = document.getElementById("site-tools");
  if (toolsEl && Array.isArray(about.tools)) {
    toolsEl.innerHTML = about.tools.map(function (t) {
      return '<span class="tool-chip">' + toolIcon(t) + esc(t) + "</span>";
    }).join("");
  }
  if (about.education) {
    var ed = about.education;
    html("site-education",
      '<div class="deg">' + esc(ed.degree || "") + "</div>" +
      '<div class="sch">' + esc([ed.school, ed.year].filter(Boolean).join(" · ")) + "</div>");
  }

  /* ---- experience: right column stacking cards ----
     Each card is sticky with a slightly deeper top offset than the one before,
     so earlier cards stay pinned with their title strip visible while the next
     card slides up over them. */
  var tl = document.getElementById("site-timeline");
  if (tl && Array.isArray(about.experience)) {
    tl.innerHTML = about.experience.map(function (x) {
      var loc = x.location ? ' <span class="loc">· ' + esc(x.location) + "</span>" : "";
      return '<div class="xp-card">' +
        '<div class="xp-top">' +
          '<div class="co">' + esc(x.company || "") + "</div>" +
          '<div class="when">' + esc(x.when || "") + "</div>" +
        "</div>" +
        '<div class="role">' + esc(x.role || "") + loc + "</div>" +
        "<p>" + esc(x.detail || "") + "</p>" +
      "</div>";
    }).join("");
    var base = 110, step = 74;
    tl.querySelectorAll(".xp-card").forEach(function (card, i) {
      card.style.top = (base + i * step) + "px";
      card.style.zIndex = i + 1;
    });
  }

  /* ---- about page ---- */
  var apg = s.aboutPage || {};
  var ah = document.getElementById("site-aboutpage-heading");
  if (ah && apg.heading) {
    // split-colour heading: everything grey except the final word
    var hw = apg.heading.trim().split(/\s+/);
    var hwLast = hw.pop();
    ah.innerHTML = (hw.length ? '<span class="g">' + esc(hw.join(" ")) + "</span> " : "") + esc(hwLast);
  }
  var at = document.getElementById("site-aboutpage-text");
  if (at && apg.text) {
    // bold the artist statement's opening phrase, keep the rest muted
    at.innerHTML = esc(apg.text).replace(/^(Before a product designer, I am an artist\.)/, "<b>$1</b>");
  }

  /* ---- contact page ---- */
  var c = s.contact || {};
  txt("site-contact-text", c.text);
  var wa = String(s.whatsapp || "").replace(/[^\d]/g, "");
  ["contact-whatsapp", "footer-whatsapp"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (wa) el.href = "https://wa.me/" + wa;
    else el.style.display = "none";
  });
  ["contact-linkedin", "footer-linkedin"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (ln) el.href = ln;
    else el.style.display = "none";
  });

  /* ---- footer + takeaway card contact rows ---- */
  if (c.email) {
    ["footer-email", "footer-mail"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { if (el.classList.contains("fmail")) el.textContent = c.email; el.href = "mailto:" + c.email; }
    });
    var te = document.getElementById("take-email");
    if (te) { te.textContent = c.email; te.href = "mailto:" + c.email; }
    var teBtn = te && te.parentNode.querySelector(".copy-btn");
    if (teBtn) teBtn.setAttribute("data-copy", c.email);
  }
  if (c.phone) {
    var fp = document.getElementById("footer-phone");
    if (fp) { fp.textContent = c.phone; fp.href = "tel:" + String(c.phone).replace(/\s+/g, ""); }
    var tp = document.getElementById("take-phone");
    if (tp) { tp.textContent = c.phone; tp.href = "tel:" + String(c.phone).replace(/\s+/g, ""); }
    var tpBtn = tp && tp.parentNode.querySelector(".copy-btn");
    if (tpBtn) tpBtn.setAttribute("data-copy", c.phone);
  }

  observeReveals();
})();

/* Approach statement — words darken grey → dark, one after another, on scroll */
(function () {
  var block = document.getElementById("site-approach");
  if (!block) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;   // CSS forces full opacity for reduced motion

  var MIN = 0.13;       // resting opacity (matches the CSS default)
  var TAIL = 3;         // words mid-fade at once — small, so it reads word by word

  function update() {
    var vh = window.innerHeight;
    var words = block.querySelectorAll(".word");
    if (!words.length) return;
    var r = block.getBoundingClientRect();
    // scrub starts as the text enters at 92% and ends when its bottom passes ~72%
    var start = vh * 0.92;
    var end = Math.min(vh * 0.30, vh * 0.72 - r.height);
    var p = (start - r.top) / (start - end);
    p = Math.max(0, Math.min(1, p));
    var f = p * (words.length + TAIL);   // fractional word index of the front
    words.forEach(function (w, i) {
      var t = Math.max(0, Math.min(1, (f - i) / TAIL));
      w.style.opacity = (MIN + (1 - MIN) * t).toFixed(3);
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

/* Nav hides while scrolling, reappears as soon as scrolling stops (always shown near the top) */
(function () {
  var nav = document.querySelector(".nav");
  if (!nav) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var timer = null;
  window.addEventListener("scroll", function () {
    if (window.scrollY > 80 && !document.querySelector(".nav-links.open")) {
      nav.classList.add("is-scrolling");
    }
    clearTimeout(timer);
    timer = setTimeout(function () { nav.classList.remove("is-scrolling"); }, 220);
  }, { passive: true });
})();

/* Hero floating tool icons — gentle bob + parallax toward the cursor */
(function () {
  var hero = document.querySelector(".hero");
  var floats = hero ? Array.prototype.slice.call(hero.querySelectorAll(".float")) : [];
  if (!floats.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // keep icons static for reduced-motion users

  floats.forEach(function (f, i) {
    f._depth = ((i % 3) + 1) * 9;      // how far it drifts with the mouse
    f._phase = i * 1.15;               // desync the bob
    f._dir = i % 2 ? 1 : -1;           // rotation direction
  });

  var mx = 0, my = 0, tmx = 0, tmy = 0, start = null;
  window.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1
    tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  window.addEventListener("mouseout", function (e) { if (!e.relatedTarget) { tmx = 0; tmy = 0; } });

  function frame(t) {
    if (start === null) start = t;
    var el = (t - start) / 1000;
    mx += (tmx - mx) * 0.06;   // easing toward the pointer
    my += (tmy - my) * 0.06;
    floats.forEach(function (f) {
      var bob = Math.sin(el * 1.1 + f._phase) * 9;
      var px = mx * f._depth;
      var py = my * f._depth + bob;
      var rot = Math.sin(el * 0.8 + f._phase) * 3 * f._dir;
      f.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg)";
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* Hero fluid cursor trail — soft ink blobs that bloom and fade along the pointer path */
(function () {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  var canvas = document.createElement("canvas");
  canvas.className = "hero-fluid";
  canvas.setAttribute("aria-hidden", "true");
  hero.insertBefore(canvas, hero.firstChild);
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    canvas.width = hero.clientWidth * dpr;
    canvas.height = hero.clientHeight * dpr;
  }
  size();
  window.addEventListener("resize", size, { passive: true });

  var parts = [], last = null;
  hero.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    if (last) {
      var dx = x - last.x, dy = y - last.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var steps = Math.max(1, Math.floor(dist / 7));
      for (var i = 0; i < steps; i++) {
        parts.push({
          x: last.x + dx * i / steps, y: last.y + dy * i / steps,
          r: 26 + Math.random() * 16, a: 0.10,
          vx: dx * 0.05, vy: dy * 0.05
        });
      }
    }
    last = { x: x, y: y };
    if (parts.length > 240) parts.splice(0, parts.length - 240);
  }, { passive: true });
  hero.addEventListener("mouseleave", function () { last = null; });

  (function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
      p.r *= 1.016; p.a *= 0.95;
      if (p.a < 0.004) { parts.splice(i, 1); continue; }
      var g = ctx.createRadialGradient(p.x * dpr, p.y * dpr, 0, p.x * dpr, p.y * dpr, p.r * dpr);
      // warm sand gold — a soft watery ripple on the cream background
      g.addColorStop(0, "rgba(196,150,58," + p.a.toFixed(3) + ")");
      g.addColorStop(1, "rgba(196,150,58,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  })();
})();

/* Footer headline — the white line swaps phrases automatically */
(function () {
  var el = document.querySelector(".foot-big .js-cycle");
  if (!el) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;   // keep the first phrase static
  var phrases = ["Let's create", "Let's design", "Let's build"];
  var i = 0;
  setInterval(function () {
    el.classList.add("out");
    setTimeout(function () {
      i = (i + 1) % phrases.length;
      el.textContent = phrases[i];
      el.classList.remove("out");
    }, 400);
  }, 3000);
})();

/* Scroll reveal — sections slide up as they enter the viewport */
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();

/* Footer back-to-top */
(function () {
  var btn = document.querySelector(".to-top");
  if (!btn) return;
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* Copy-to-clipboard buttons (email / phone on the contact card) */
(function () {
  document.querySelectorAll(".copy-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-copy") || "";
      if (!t || !navigator.clipboard) return;
      navigator.clipboard.writeText(t).then(function () {
        b.classList.add("copied");
        setTimeout(function () { b.classList.remove("copied"); }, 1200);
      }).catch(function () {});
    });
  });
})();

/* Preview-mode banner: makes it obvious whether you're seeing saved draft changes */
(function () {
  try { if (new URLSearchParams(location.search).get("preview") !== "1") return; } catch (e) { return; }
  var hasDraft = !!(window.loadDraft && window.loadDraft());
  var bar = document.createElement("div");
  bar.className = "preview-bar " + (hasDraft ? "ok" : "warn");
  bar.innerHTML = hasDraft
    ? "Preview mode: showing your unsaved draft changes."
    : "Preview mode: no saved draft found at this address. Open admin from the SAME address (e.g. http://localhost:8777/admin.html), add your project, then Save.";
  document.body.appendChild(bar);
})();
