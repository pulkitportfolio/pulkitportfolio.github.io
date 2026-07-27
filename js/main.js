/* Per-item scroll reveal helper (project rows, experience rows, How I Work blocks).
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

/* Mobile nav toggle (runs on every page) */
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }
})();

/* Project list — rows with filters; data-limit caps the count on the home page */
(function () {
  var grid = document.getElementById("grid");
  if (!grid) return;

  var projects = window.getProjectsForView();
  var current = "all";
  // keep the preview flag on links so unpublished (draft) projects stay viewable
  var previewQS = (new URLSearchParams(location.search).get("preview") === "1") ? "&preview=1" : "";

  function ph(text) {
    return '<div class="ph">' + escapeHtml(text) + "</div>";
  }
  function media(p) {
    if (p.thumbnail) {
      return '<img src="' + escapeAttr(p.thumbnail) + '" alt="' + escapeAttr(p.title) +
        '" onerror="this.parentNode.innerHTML=\'' +
        '<div class=&quot;ph&quot;>' + escapeAttr(p.title) + '</div>\'">';
    }
    return ph(p.title);
  }
  function chips(tags) {
    return (tags || []).slice(0, 3).map(function (t) {
      return '<span class="chip">' + escapeHtml(t) + "</span>";
    }).join("");
  }

  var limit = parseInt(grid.getAttribute("data-limit") || "0", 10);

  function render() {
    var list = projects.filter(function (p) {
      return current === "all" || p.category === current;
    });
    if (limit > 0) list = list.slice(0, limit);

    if (!list.length) {
      grid.innerHTML = '<div class="empty">No projects here yet. Open <b>admin.html</b> to add your work.</div>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var label = p.category === "app" ? "App" : "Website";
      var csHref = "case-study.html?id=" + encodeURIComponent(p.id) + previewQS;
      var kicker = [label, p.year].filter(Boolean).join(" · ");
      return '' +
        '<div class="work-row item-reveal" tabindex="0" data-cursor="view" data-href="' + escapeAttr(csHref) + '">' +
          '<div class="row-info">' +
            '<div class="row-kicker">' + escapeHtml(kicker) + "</div>" +
            "<h3>" + escapeHtml(p.title) + "</h3>" +
            '<p class="row-summary">' + escapeHtml(p.summary || "") + "</p>" +
            '<div class="row-links">' +
              '<a class="view-link" href="' + escapeAttr(csHref) + '">View project <span class="arw">&rarr;</span></a>' +
            "</div>" +
          "</div>" +
          '<div class="row-thumb">' + media(p) + "</div>" +
        "</div>";
    }).join("");

    // whole row is clickable (except real links inside it)
    grid.querySelectorAll(".work-row").forEach(function (card) {
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

  // count stats
  var el = document.getElementById("stat-projects");
  if (el) el.textContent = projects.length + "+";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }
})();

/* Floating design icons — gentle bob + mouse parallax */
(function () {
  var floats = Array.prototype.slice.call(document.querySelectorAll(".namehero .float"));
  if (!floats.length) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return; // keep icons static for reduced-motion users

  var hero = document.querySelector(".namehero");
  floats.forEach(function (f, i) {
    f._depth = ((i % 3) + 1) * 9;      // how far it drifts with the mouse
    f._phase = i * 1.15;               // desync the bob
    f._dir = i % 2 ? 1 : -1;           // rotation direction
  });

  var mx = 0, my = 0, tmx = 0, tmy = 0, start = null;
  // spotlight glow: current (sx,sy) eases toward target (tsx,tsy) in px
  var sx = null, sy = null, tsx = 0, tsy = 0;

  window.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1
    tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
    tsx = e.clientX - r.left;
    tsy = e.clientY - r.top;
    if (sx === null) { sx = tsx; sy = tsy; }            // first move: no glide-in from 0
  }, { passive: true });

  // reset target when the pointer leaves the window
  window.addEventListener("mouseout", function (e) { if (!e.relatedTarget) { tmx = 0; tmy = 0; } });

  function frame(t) {
    if (start === null) start = t;
    var el = (t - start) / 1000;
    mx += (tmx - mx) * 0.06;   // easing toward the pointer
    my += (tmy - my) * 0.06;
    floats.forEach(function (f) {
      var bob = Math.sin(el * 1.1 + f._phase) * 10;
      var px = mx * f._depth;
      var py = my * f._depth + bob;
      var rot = Math.sin(el * 0.8 + f._phase) * 3 * f._dir;
      f.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg)";
    });
    if (sx !== null) {
      sx += (tsx - sx) * 0.12;   // smooth spotlight follow
      sy += (tsy - sy) * 0.12;
      hero.style.setProperty("--mx", sx.toFixed(1) + "px");
      hero.style.setProperty("--my", sy.toFixed(1) + "px");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* Render all editable site content from SITE (managed in the CMS) */
(function () {
  var s = window.getSiteForView ? window.getSiteForView() : (window.SITE || {});
  if (!s || typeof s !== "object") return;
  var projects = window.getProjectsForView ? window.getProjectsForView() : (window.PROJECTS || []);

  function esc(x) {
    return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function txt(id, v) { var e = document.getElementById(id); if (e && v != null && v !== "") e.textContent = v; }
  function html(id, v) { var e = document.getElementById(id); if (e && v != null) e.innerHTML = v; }

  // (profile photo is no longer shown on the site; SITE.avatar is kept for the admin only)

  // hero — name splits across two giant lines (top-left / bottom-right)
  txt("site-kicker", s.kicker);
  var nameFirst = (s.name || "").trim();
  var nameLast = (s.nameLast || "").trim();
  if (!nameLast && /\s/.test(nameFirst)) {
    var parts = nameFirst.split(/\s+/);
    nameFirst = parts.shift();
    nameLast = parts.join(" ");
  }
  txt("site-name", nameFirst);
  var lastEl = document.getElementById("site-name-last");
  if (lastEl) {
    if (nameLast) lastEl.textContent = nameLast;
    else lastEl.style.display = "none";
  }
  txt("site-tagline", s.tagline);

  // CTA buttons: set the editable label + link (the arrow stays)
  function setCta(id, label, href, hideIfNoHref) {
    var a = document.getElementById(id);
    if (!a) return;
    var lbl = a.querySelector(".cta-label");
    if (lbl && label != null && label !== "") lbl.textContent = label;
    if (href) { a.href = href; a.style.display = ""; }
    else if (hideIfNoHref) { a.style.display = "none"; }
  }
  var ln = (s.linkedin || "").trim();
  setCta("hero-linkedin", s.linkedinLabel, ln, true);
  setCta("intro-linkedin", s.linkedinLabel, ln, true);
  setCta("intro-resume", s.resumeLabel, (s.resumeUrl || "Pulkit_Awasthi_CV.pdf"), false);
  // availability badge in the intro CTA row (tied to Open to Work)
  var avail = document.getElementById("site-available");
  if (avail) {
    if (s.openToWork === false) {
      avail.style.display = "none";
    } else {
      var at = document.getElementById("site-available-text");
      if (at && s.availableText != null && s.availableText !== "") at.textContent = s.availableText;
    }
  }

  var facts = [];
  if (s.openToWork) facts.push('<span class="pbadge work"><span class="dot"></span> Open to Work</span>');
  if (s.location) facts.push('<span class="pbadge">📍 ' + esc(s.location) + "</span>");
  if (s.experienceBadge) facts.push('<span class="pbadge">' + esc(s.experienceBadge) + "</span>");
  if (facts.length) html("site-facts", facts.join(""));

  // intro headline split into words so they darken from light grey to black
  var intro = s.intro || {};
  var hd = document.getElementById("site-headline");
  if (hd) {
    var headline = (intro.headline != null && intro.headline !== "") ? intro.headline : hd.textContent;
    hd.innerHTML = headline.split(/\s+/).map(function (w) {
      return '<span class="word">' + esc(w) + "</span>";
    }).join(" ");
  }
  // bio gets the same word-split scroll-brightening treatment as the headline
  var bioEl = document.getElementById("site-bio");
  if (bioEl) {
    var bioText = (intro.bio != null && intro.bio !== "") ? intro.bio : bioEl.textContent.replace(/\s+/g, " ").trim();
    bioEl.innerHTML = bioText.split(/\s+/).map(function (w) {
      return '<span class="word">' + esc(w) + "</span>";
    }).join(" ");
  }


  // companies (mono = first letter)
  if (Array.isArray(s.companies)) {
    html("site-companies", s.companies.map(function (name) {
      var m = ((name || "").trim().charAt(0) || "•").toUpperCase();
      return '<span class="company"><span class="mono">' + esc(m) + "</span> " + esc(name) + "</span>";
    }).join(""));
  }

  // about
  var about = s.about || {};
  txt("site-about-heading", about.heading);
  txt("site-about-desc", about.description);
  if (Array.isArray(about.experience)) {
    html("site-timeline", about.experience.map(function (x) {
      var loc = x.location
        ? ' <span class="exp-loc"><svg class="pin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg>' + esc(x.location) + "</span>"
        : "";
      return '<div class="tl-item item-reveal">' +
        '<div class="tl-head">' +
          "<div>" +
            '<div class="role">' + esc(x.role || "") + "</div>" +
            '<div class="co">' + esc(x.company || "") + loc + "</div>" +
          "</div>" +
          '<div class="when">' + esc(x.when || "") + "</div>" +
        "</div>" +
        "<p>" + esc(x.detail || "") + "</p></div>";
    }).join(""));
  }
  if (Array.isArray(about.skills)) html("site-skills", about.skills.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join(""));
  if (Array.isArray(about.tools)) html("site-tools", about.tools.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join(""));

  // intro merge-strip: skills scroll one way, tools the other (duplicated for a seamless loop)
  var stripPill = function (t) { return '<span class="strip-pill">' + esc(t) + "</span>"; };
  var skTrack = document.getElementById("intro-skills-track");
  if (skTrack) {
    var allTags = [].concat(Array.isArray(about.skills) ? about.skills : [], Array.isArray(about.tools) ? about.tools : []);
    var h = allTags.map(stripPill).join("");
    skTrack.innerHTML = h + h;   // duplicated for a seamless left-scrolling loop
  }

  // How I Work — numbered blocks with mono checklists (hidden when empty)
  var hiwSection = document.getElementById("how");
  var hiwWrap = document.getElementById("site-hiw");
  var hiwList = Array.isArray(s.howIWork) ? s.howIWork.filter(function (x) { return x && (x.title || "").trim(); }) : [];
  if (hiwWrap && hiwList.length) {
    hiwWrap.innerHTML = hiwList.map(function (step, i) {
      var num = (i + 1 < 10 ? "0" : "") + (i + 1);
      var points = (Array.isArray(step.points) ? step.points : []).filter(Boolean).map(function (pt) {
        return "<li>" + esc(pt) + "</li>";
      }).join("");
      return '<div class="hiw-item item-reveal">' +
        "<div>" +
          '<div class="hiw-num">' + num + "</div>" +
          "<h3>" + esc(step.title) + "</h3>" +
          (step.desc ? '<p class="hiw-desc">' + esc(step.desc) + "</p>" : "") +
        "</div>" +
        (points ? '<ul class="hiw-points">' + points + "</ul>" : "") +
      "</div>";
    }).join("");
    if (hiwSection) hiwSection.style.display = "";
  } else if (hiwSection) {
    hiwSection.style.display = "none";
  }

  if (about.education) {
    var ed = about.education;
    html("site-education",
      '<div class="role" style="font-size:15px">' + esc(ed.degree || "") + "</div>" +
      '<div class="when">' + esc([ed.school, ed.year].filter(Boolean).join(" · ")) + "</div>");
  }

  // contact band (heading is the big right-hand line; the button keeps its own label)
  var c = s.contact || {};
  txt("site-contact-heading", c.heading);
  txt("site-contact-text", c.text);
  if (c.email) {
    var eb = document.getElementById("site-email-btn");
    if (eb) eb.href = "mailto:" + c.email;
  }
  var cl = document.getElementById("site-contact-links");
  if (cl) {
    var links = [];
    if (c.email) links.push('<a href="mailto:' + esc(c.email) + '">Contact me</a>');
    if (c.phone) links.push('<a href="tel:' + esc(String(c.phone).replace(/\s+/g, "")) + '">' + esc(c.phone) + "</a>");
    if (links.length) cl.innerHTML = links.join("");
  }

  // big footer: giant name + detail columns (email/phone with copy, location, links)
  var fn = document.getElementById("footer-name");
  if (fn) fn.textContent = ((nameFirst || "") + " " + (nameLast || "")).trim().toUpperCase();
  if (c.email) {
    var fe = document.getElementById("footer-email");
    if (fe) { fe.textContent = c.email; fe.href = "mailto:" + c.email; }
    var feBtn = fe && fe.parentNode.querySelector(".copy-btn");
    if (feBtn) feBtn.setAttribute("data-copy", c.email);
  }
  if (c.phone) {
    var fp = document.getElementById("footer-phone");
    if (fp) { fp.textContent = c.phone; fp.href = "tel:" + String(c.phone).replace(/\s+/g, ""); }
    var fpBtn = fp && fp.parentNode.querySelector(".copy-btn");
    if (fpBtn) fpBtn.setAttribute("data-copy", c.phone);
  }
  var fl2 = document.getElementById("footer-links2");
  if (fl2) {
    // anchors scroll on the home page; other pages link back to the home sections
    var isHome = !!document.querySelector(".namehero");
    var pre = isHome ? "" : "index.html";
    var contactHref = document.getElementById("contact") ? "#contact" : "index.html#contact";
    var fLinks = [
      '<a href="' + pre + '#work">Work</a>',
      '<a href="' + pre + '#about">About</a>',
      '<a href="' + contactHref + '">Contact</a>'
    ];
    var resume = (s.resumeUrl || "").trim() || "Pulkit_Awasthi_CV.pdf";
    fLinks.push('<a href="' + esc(resume) + '" ' + (/^https?:/i.test(resume) ? 'target="_blank" rel="noopener noreferrer"' : "download") + ">Resumé</a>");
    if (ln) fLinks.push('<a href="' + esc(ln) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>');
    fl2.innerHTML = fLinks.join("");
  }

  observeReveals();
})();

/* Contact band — cycling headline ("Have a project?" → "Let's chat!" → …) */
(function () {
  var el = document.querySelector(".js-cycle");
  if (!el) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;   // keep the first phrase static
  var phrases = ["Have a project?", "Let's chat!", "Schedule a call?"];
  var i = 0;
  setInterval(function () {
    el.classList.add("out");
    setTimeout(function () {
      i = (i + 1) % phrases.length;
      el.textContent = phrases[i];
      el.classList.remove("out");
    }, 360);
  }, 3000);
})();

/* Footer back-to-top */
(function () {
  var btn = document.querySelector(".to-top");
  if (!btn) return;
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* Intro headline + bio — words brighten ONE BY ONE, slowly, as you scroll.
   The scrub range spans almost the whole viewport travel of each block, so the
   reveal keeps pace with reading speed and pulls the eye through every word. */
(function () {
  var blocks = [document.getElementById("site-headline"), document.getElementById("site-bio")].filter(Boolean);
  if (!blocks.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;   // CSS forces full opacity for reduced motion

  var MIN = 0.16;       // resting opacity (matches the CSS default)
  var TAIL = 2;         // words mid-fade at once — small, so it reads word by word

  function update() {
    var vh = window.innerHeight;
    blocks.forEach(function (b) {
      var list = b.querySelectorAll(".word");
      if (!list.length) return;
      var r = b.getBoundingClientRect();
      // long scrub: starts when the block enters at 96% and finishes only near the top (6%)
      var start = vh * 0.96, end = vh * 0.06;
      var p = (start - r.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      var f = p * (list.length + TAIL);   // fractional word index of the front
      list.forEach(function (w, i) {
        var t = Math.max(0, Math.min(1, (f - i) / TAIL));
        w.style.opacity = (MIN + (1 - MIN) * t).toFixed(3);
      });
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

/* (Experience now uses stacking cards + a pinned right column, handled in CSS.) */

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

/* Custom cursor — white dot that follows the mouse (inverts over light sections)
   and grows into a "View Project" badge over elements with data-cursor="view" */
(function () {
  var dot = document.querySelector(".cursor-dot");
  if (!dot) return;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;
  document.documentElement.classList.add("has-cursor");

  var x = -100, y = -100, tx = -100, ty = -100, seen = false;
  document.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { x = tx; y = ty; seen = true; dot.classList.add("on"); }
  }, { passive: true });
  document.addEventListener("mouseleave", function () { dot.classList.remove("on"); });
  document.addEventListener("mouseenter", function () { if (seen) dot.classList.add("on"); });
  document.addEventListener("mouseover", function (e) {
    var v = e.target.closest && e.target.closest('[data-cursor="view"]');
    dot.classList.toggle("is-view", !!v);
    // hero only: the dot becomes a white outlined smiley saying "Hi"
    var hero = e.target.closest && e.target.closest(".namehero");
    dot.classList.toggle("is-hi", !!hero && !v);
  });

  function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    dot.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(-50%, -50%)";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* Experience cards — zoom in one after another while scrolling through them
   (the card in the middle of the viewport scales up; hover does the same) */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  var items = document.querySelectorAll("#site-timeline .tl-item");
  if (!items.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle("zoom", e.isIntersecting); });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  items.forEach(function (el) { io.observe(el); });
})();

/* Footer copy-to-clipboard buttons (email / phone) */
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
