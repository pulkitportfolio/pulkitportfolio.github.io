/* Home page — render project grid + filters + mobile nav */
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

  function render() {
    var list = projects.filter(function (p) {
      return current === "all" || p.category === current;
    });

    if (!list.length) {
      grid.innerHTML = '<div class="empty">No projects here yet. Open <b>admin.html</b> to add your work.</div>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var label = p.category === "app" ? "App" : "Website";
      var csHref = "case-study.html?id=" + encodeURIComponent(p.id) + previewQS;
      var live = p.liveUrl && String(p.liveUrl).trim();
      var liveLabel = p.category === "app" ? "View live app" : "View live site";
      var liveLink = live
        ? '<a class="live-link" href="' + escapeAttr(live) + '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(liveLabel) + ' <span aria-hidden="true">&#8599;</span></a>'
        : "";
      return '' +
        '<div class="card" tabindex="0" data-href="' + escapeAttr(csHref) + '">' +
          '<div class="card-media">' +
            '<span class="card-tag">' + label + "</span>" +
            media(p) +
          "</div>" +
          '<div class="card-body">' +
            "<h3>" + escapeHtml(p.title) + "</h3>" +
            "<p>" + escapeHtml(p.summary || "") + "</p>" +
            '<div class="card-foot">' +
              '<div class="card-chips">' + chips(p.tags) + "</div>" +
              '<div class="card-links">' +
                '<a class="view-link" href="' + escapeAttr(csHref) + '">View project <span class="arw">&rarr;</span></a>' +
                liveLink +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>";
    }).join("");

    // whole card is clickable (except real links inside it)
    grid.querySelectorAll(".card").forEach(function (card) {
      var go = function () { var h = card.getAttribute("data-href"); if (h) location.href = h; };
      card.addEventListener("click", function (e) { if (!e.target.closest("a")) go(); });
      card.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    });
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

  // mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

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

  // small circular profile image
  var av = document.getElementById("avatar-img");
  if (av && s.avatar) av.src = s.avatar;

  // hero
  txt("site-kicker", s.kicker);
  txt("site-name", s.name);
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
    hd.innerHTML = headline.split(/\s+/).map(function (w, i) {
      return '<span class="word" style="transition-delay:' + (i * 45) + 'ms">' + esc(w) + "</span>";
    }).join(" ");
  }
  txt("site-bio", intro.bio);

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
        ? '<div class="exp-loc"><svg class="pin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg>' + esc(x.location) + "</div>"
        : "";
      return '<div class="tl-item">' +
        loc +
        '<div class="role">' + esc(x.role || "") + "</div>" +
        '<div class="co">' + esc(x.company || "") + "</div>" +
        '<div class="when">' + esc(x.when || "") + "</div>" +
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

  // "Explorations & mockups" strips: a separate image set (NOT the case studies)
  var moreImgs = Array.isArray(s.otherWorks) ? s.otherWorks.filter(Boolean) : [];
  var moreSection = document.getElementById("more");
  if (moreImgs.length) {
    var thumb = function (src) { return '<div class="more-thumb"><img src="' + esc(src) + '" alt="" loading="lazy"></div>'; };
    var r1 = moreImgs.map(thumb).join("");
    var r2 = moreImgs.slice().reverse().map(thumb).join("");
    var e1 = document.getElementById("more-row1"); if (e1) e1.innerHTML = r1 + r1;
    var e2 = document.getElementById("more-row2"); if (e2) e2.innerHTML = r2 + r2;
    if (moreSection) moreSection.style.display = "";
  } else if (moreSection) {
    moreSection.style.display = "none";   // nothing to show yet
  }
  if (about.education) {
    var ed = about.education;
    html("site-education",
      '<div class="role" style="font-size:15px">' + esc(ed.degree || "") + "</div>" +
      '<div class="when">' + esc([ed.school, ed.year].filter(Boolean).join(" · ")) + "</div>");
  }

  // contact
  var c = s.contact || {};
  txt("site-contact-heading", c.heading);
  txt("site-contact-text", c.text);
  if (c.email) {
    var eb = document.getElementById("site-email-btn");
    if (eb) { eb.textContent = c.email; eb.href = "mailto:" + c.email; }
  }
  var cl = document.getElementById("site-contact-links");
  if (cl) {
    var links = [];
    if (c.email) links.push('<a href="mailto:' + esc(c.email) + '">Contact me</a>');
    if (c.phone) links.push('<a href="tel:' + esc(String(c.phone).replace(/\s+/g, "")) + '">' + esc(c.phone) + "</a>");
    if (links.length) cl.innerHTML = links.join("");
  }
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

/* Smiling cursor buddy — trails the mouse, fades out when idle */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var noHover = window.matchMedia && window.matchMedia("(hover: none)").matches;
  if (reduce || noHover) return;
  var buddy = document.querySelector(".cursor-buddy");
  var hero = document.querySelector(".namehero");
  if (!buddy || !hero) return;

  var x = -100, y = -100, tx = -100, ty = -100, idle;
  // only trails the cursor while it's over the hero section
  hero.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY;
    if (x < 0) { x = tx; y = ty; }        // avoid a fly-in from the corner
    buddy.classList.add("show");
    clearTimeout(idle);
    idle = setTimeout(function () { buddy.classList.remove("show"); }, 1500);
  }, { passive: true });
  hero.addEventListener("mouseleave", function () {
    clearTimeout(idle);
    buddy.classList.remove("show");
  });

  function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    buddy.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) translate(18px, 18px)";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* Full-page preview: click any Explorations image to open it large */
(function () {
  var lb = document.getElementById("lightbox");
  if (!lb) return;
  var img = document.getElementById("lightbox-img");

  function open(src) {
    if (!src) return;
    img.src = src;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    img.src = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var thumb = e.target.closest && e.target.closest(".more-thumb");
    if (thumb) {
      var im = thumb.querySelector("img");
      if (im) open(im.getAttribute("src"));
    }
  });
  lb.addEventListener("click", close);              // click anywhere in the overlay to close
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
})();
