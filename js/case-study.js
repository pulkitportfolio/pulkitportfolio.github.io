/* Case study template — reads ?id=slug and renders that project */
(function () {
  var root = document.getElementById("cs-root");
  if (!root) return;

  var projects = window.getProjectsForView();
  var params = new URLSearchParams(location.search);
  var isPreview = params.get("preview") === "1";
  var pv = isPreview ? "&preview=1" : "";
  var homeHref = "index.html" + (isPreview ? "?preview=1" : "");
  var id = params.get("id");
  var idx = projects.findIndex(function (p) { return p.id === id; });
  var p = projects[idx];

  if (!p) {
    root.innerHTML =
      '<div class="container" style="padding:120px 0;text-align:center">' +
        "<h1>Project not found</h1>" +
        '<p class="lead" style="margin:16px 0 28px">This case study doesn\'t exist yet.</p>' +
        '<a class="btn btn-primary" href="' + homeHref + '">Back to work</a>' +
      "</div>";
    document.title = "Not found | Pulkit Awasthi";
    return;
  }

  document.title = p.title + " | Pulkit Awasthi";

  var prev = projects[(idx - 1 + projects.length) % projects.length];
  var next = projects[(idx + 1) % projects.length];

  function cover(src, big) {
    if (src) {
      return '<img src="' + attr(src) + '" alt="' + attr(p.title) +
        '" onerror="this.parentNode.innerHTML=\'<div class=&quot;ph&quot;>' + attr(p.title) + '</div>\'">';
    }
    return '<div class="ph">' + esc(p.title) + "</div>";
  }

  function processList(arr) {
    if (!arr || !arr.length) return "";
    if (typeof arr === "string") arr = arr.split("\n").filter(Boolean);
    return "<ul>" + arr.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
  }

  function block(title, body) {
    if (!body || !body.trim()) return "";
    return '<div class="cs-block"><h2>' + esc(title) + "</h2>" + body + "</div>";
  }

  function gallery(arr) {
    if (!arr || !arr.length) return "";
    var cls = arr.length === 1 ? "cs-gallery full" : "cs-gallery";
    return '<div class="' + cls + '">' + arr.map(function (src) {
      return "<figure>" +
        '<img src="' + attr(src) + '" alt="' + attr(p.title) + ' mockup" ' +
        'onerror="this.parentNode.innerHTML=\'<div class=&quot;ph&quot;>Mockup</div>\'">' +
        "</figure>";
    }).join("") + "</div>";
  }

  var label = p.category === "app" ? "App" : "Website";
  var hasEmbed = !!(p.embed && String(p.embed).trim());

  root.innerHTML =
    '<section class="cs-hero"><div class="container">' +
      '<a class="cs-back" href="' + homeHref + '">&larr; All work</a>' +
      '<div class="eyebrow">' + esc(label) + " &middot; " + esc(p.year || "") + "</div>" +
      "<h1>" + esc(p.title) + "</h1>" +
      '<p class="lead">' + esc(p.summary || "") + "</p>" +
      (p.liveUrl && String(p.liveUrl).trim()
        ? '<div style="margin-top:24px"><a class="btn btn-primary" href="' + attr(p.liveUrl) +
          '" target="_blank" rel="noopener noreferrer">Visit live ' + (p.category === "app" ? "app" : "site") +
          ' <span aria-hidden="true">&#8599;</span></a></div>'
        : "") +
      '<div class="cs-meta">' +
        metaItem("Role", p.role) +
        metaItem("Category", label) +
        metaItem("Year", p.year) +
        metaItem("Skills", (p.tags || []).join(", ")) +
      "</div>" +
    "</div></section>" +

    // no cover image at the top when a prototype is provided
    (hasEmbed
      ? ""
      : '<div class="container"><div class="cs-cover">' + cover(p.cover || p.thumbnail) + "</div></div>") +

    '<div class="container"><div class="cs-body">' +
      block("Overview", p.overview ? "<p>" + esc(p.overview) + "</p>" : "") +
      block("The problem", p.problem ? "<p>" + esc(p.problem) + "</p>" : "") +
      block("Process", processList(p.process)) +
      block("Outcome", p.outcome ? "<p>" + esc(p.outcome) + "</p>" : "") +
    "</div></div>" +

    (p.gallery && p.gallery.length
      ? '<div class="container" style="margin:20px auto 0"><div class="cs-body"><div class="cs-block" style="border:none;padding-bottom:10px"><h2>Screens</h2></div></div>' + gallery(p.gallery) + "</div>"
      : "") +

    // prototype preview goes last, below the whole case study
    embedBlock(p.embed, p.embedPortrait) +

    '<div class="container"><div class="cs-nav">' +
      '<a href="case-study.html?id=' + enc(prev.id) + pv + '">Previous<b>' + esc(prev.title) + "</b></a>" +
      '<a style="text-align:right" href="case-study.html?id=' + enc(next.id) + pv + '">Next<b>' + esc(next.title) + "</b></a>" +
    "</div></div>";

  function metaItem(k, v) {
    if (!v) return "";
    return '<div><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + "</div></div>";
  }
  // Figma prototype: accepts a full <iframe> embed code (injected as-is, owner-trusted)
  // or a plain figma.com prototype link (wrapped into an embed iframe).
  function embedBlock(embed, portrait) {
    embed = (embed == null ? "" : String(embed)).trim();
    if (!embed) return "";
    var inner;
    if (embed.indexOf("<iframe") !== -1) {
      inner = embed;
    } else {
      var src = /figma\.com/i.test(embed)
        ? "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(embed)
        : embed;
      inner = '<iframe src="' + attr(src) + '" allowfullscreen loading="lazy"></iframe>';
    }
    return '<section class="cs-embed">' +
      '<div class="inner"><h2>Screens</h2></div>' +
      '<div class="frame' + (portrait ? " portrait" : "") + '">' + inner + "</div></section>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function attr(s) { return esc(s); }
  function enc(s) { return encodeURIComponent(s); }
})();
