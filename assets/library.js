/* Inner Cirql member library renderer.
   Reads window.LIBRARY = { kind:'slides'|'training', series:[...], items:[...] }
   and renders the billboard hero, the rows, and the modal player into #library.

   Item fields (all strings unless noted):
     id, date (YYYY-MM-DD or null), dateLabel, series (series id), week (number|null),
     name (episode name), title (full title), headline [line1, line2], sub, desc (HTML ok),
     href (deck URL), pdf (path|null), slides (number|null),
     embed (Vimeo player URL, training only), thumb (poster path, training only)
   Series fields: id, name, total (number|null), meta (row-right label), extra (boolean: not a coaching series)
*/
(function () {
  var L = window.LIBRARY;
  if (!L) return;
  var root = document.getElementById("library");
  if (!root) return;

  var NEW_DAYS = 21;
  var WATCH_KEY = "ic-library-watched-" + L.kind;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function parseDate(d) { return d ? new Date(d + "T12:00:00") : null; }
  function daysAgo(d) {
    var dt = parseDate(d);
    return dt ? (Date.now() - dt.getTime()) / 86400000 : Infinity;
  }
  function seriesOf(item) {
    for (var i = 0; i < L.series.length; i++) if (L.series[i].id === item.series) return L.series[i];
    return null;
  }
  function byDateDesc(a, b) { return (b.date || "").localeCompare(a.date || ""); }
  function byWeekAsc(a, b) { return (a.week || 0) - (b.week || 0) || (a.date || "").localeCompare(b.date || ""); }
  function isVideo(item) { return !!item.embed; }
  function shortDate(d) {
    var dt = parseDate(d);
    if (!dt) return "";
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function weekLabel(item) {
    var s = seriesOf(item);
    if (!item.week) return "";
    return "Week " + item.week + (s && s.total ? " of " + s.total : "");
  }
  function badgesFor(item) {
    var out = [];
    if (item === newest) out.push('<span class="badge badge-live"><span class="dot"></span>' + (L.kind === "slides" ? "This Week" : "Latest") + "</span>");
    else if (item.date && daysAgo(item.date) <= NEW_DAYS) out.push('<span class="badge badge-new">New</span>');
    return out.join("");
  }
  function headlineHtml(item) {
    if (item.headline && item.headline.length === 2) return esc(item.headline[0]) + " <em>" + esc(item.headline[1]) + "</em>";
    return esc(item.name || item.title);
  }

  /* ---------- watched (Continue Watching) ---------- */
  function getWatched() {
    try { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]"); } catch (e) { return []; }
  }
  function markWatched(id) {
    try {
      var w = getWatched().filter(function (x) { return x !== id; });
      w.unshift(id);
      localStorage.setItem(WATCH_KEY, JSON.stringify(w.slice(0, 12)));
    } catch (e) { /* storage unavailable */ }
    renderContinue();
  }

  /* ---------- cover art ---------- */
  /* The Open Cirql mark, exact paths from the locked kit (assets/brand/innercirql-icon.svg). */
  var MARK = '<g transform="translate(1010,40) scale(1.3)">' + '<path d="M 31 17 A 38 38 0 0 0 31 83" stroke="#c9a96e" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M 39 31 A 22 22 0 0 0 39 69" stroke="#c9a96e" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="50" cy="50" r="6" fill="#c9a96e"/><path d="M 61 31 A 22 22 0 0 1 61 69" stroke="#c9a96e" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M 69 17 A 38 38 0 0 1 69 83" stroke="#c9a96e" stroke-width="6" stroke-linecap="round" fill="none"/>' + '</g>';

  function coverSvg(item, opts) {
    opts = opts || {};
    var uid = "g" + item.id.replace(/[^a-z0-9]/gi, "");
    var l1 = item.headline ? item.headline[0] : (item.name || item.title);
    var l2 = item.headline ? item.headline[1] : "";
    var kicker = item.date ? "WED · " + shortDate(item.date).toUpperCase() : (item.kicker || "");
    var sub = item.sub || "";
    var foot = [];
    if (item.slides) foot.push(item.slides + " slides");
    var wl = weekLabel(item);
    if (wl) foot.push(wl);
    var size = 78;
    if (Math.max(l1.length, l2.length) > 15) size = 64;
    if (Math.max(l1.length, l2.length) > 20) size = 54;
    return '<svg viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="' + uid + '" cx="88%" cy="10%" r="70%"><stop offset="0" stop-color="#c9a96e" stop-opacity="0.28"/><stop offset="1" stop-color="#c9a96e" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1200" height="675" fill="#000000"/>' +
      '<rect width="1200" height="675" fill="url(#' + uid + ')"/>' +
      '<rect x="0" y="0" width="1200" height="675" fill="none" stroke="rgba(255,255,255,0.06)"/>' +
      (opts.plain ? "" : MARK) +
      (opts.plain ? "" :
        '<text x="72" y="286" fill="#c9a96e" font-family="DM Sans, Inter, sans-serif" font-weight="700" font-size="16" letter-spacing="5">' + esc(kicker) + "</text>" +
        '<text x="72" y="372" fill="#ffffff" font-family="DM Sans, Inter, sans-serif" font-weight="700" font-size="' + size + '" letter-spacing="-2">' + esc(l1) + "</text>" +
        '<text x="72" y="' + (372 + size * 1.08) + '" fill="#c9a96e" font-family="Instrument Serif, Georgia, serif" font-weight="400" font-style="italic" font-size="' + (size * 1.08) + '" letter-spacing="0">' + esc(l2) + "</text>" +
        '<text x="72" y="' + (372 + size * 1.08 + 52) + '" fill="rgba(255,255,255,0.55)" font-family="Inter, sans-serif" font-weight="400" font-size="22">' + esc(sub) + "</text>" +
        (foot.length ? '<text x="72" y="612" fill="rgba(255,255,255,0.35)" font-family="DM Sans, Inter, sans-serif" font-weight="700" font-size="14" letter-spacing="3">' + esc(foot.join("  ·  ").toUpperCase()) + "</text>" : "")) +
      "</svg>";
  }
  function coverHtml(item) {
    if (item.thumb) return '<img src="' + esc(item.thumb) + '" alt="" loading="lazy">';
    return coverSvg(item);
  }

  /* ---------- icons ---------- */
  var I_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  var I_OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
  var I_INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var I_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v13M6 11l6 6 6-6M4 21h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
  var I_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';
  var I_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';

  /* ---------- data prep ---------- */
  var items = L.items.slice();
  var byId = {};
  items.forEach(function (it) { byId[it.id] = it; });
  var dated = items.filter(function (it) { return !!it.date; }).sort(byDateDesc);
  var newest = dated[0] || items[0];

  /* ---------- billboard ---------- */
  function primaryAction(item, cls) {
    if (isVideo(item)) return '<button type="button" class="' + cls + '" data-play="' + esc(item.id) + '">' + I_PLAY + "<span>Play Replay</span></button>";
    return '<a class="' + cls + '" href="' + esc(item.href) + '" target="_blank" rel="noopener">' + I_OPEN + "<span>Open Slides</span></a>";
  }
  function renderBillboard(item) {
    var s = seriesOf(item);
    var meta = [];
    if (item.dateLabel || item.date) meta.push("<b>" + esc(item.dateLabel || shortDate(item.date)) + "</b>");
    if (weekLabel(item)) meta.push(esc(weekLabel(item)));
    if (item.slides) meta.push(item.slides + " slides");
    if (isVideo(item)) meta.push("Edited replay");
    var bg = item.thumb
      ? '<img src="' + esc(item.thumb) + '" alt="">'
      : coverSvg(item, { plain: true });
    var art = item.thumb ? "" : '<div class="billboard-art" aria-hidden="true">' + coverSvg(item) + "</div>";
    var more = isVideo(item)
      ? '<button type="button" class="btn btn-secondary" data-info="' + esc(item.id) + '">' + I_INFO + "<span>More Info</span></button>"
      : '<a class="btn btn-secondary" href="#row-' + esc(item.series) + '">' + I_INFO + "<span>See the Series</span></a>";
    return el(
      '<section class="billboard" aria-label="Featured">' +
        '<div class="billboard-bg">' + bg + "</div><div class=\"billboard-shade\"></div>" +
        '<div class="billboard-inner"><div class="billboard-copy">' +
          '<div class="bb-badges">' + badgesFor(item) + (s ? '<span class="badge badge-series">' + esc(s.name) + "</span>" : "") + "</div>" +
          '<h1 class="bb-title">' + headlineHtml(item) + "</h1>" +
          '<div class="bb-meta">' + meta.join("<span>·</span>") + "</div>" +
          '<p class="bb-desc">' + (item.desc || "") + "</p>" +
          '<div class="bb-actions">' + primaryAction(item, "btn btn-primary") + more + "</div>" +
        "</div>" + art + "</div>" +
      "</section>"
    );
  }

  /* ---------- tiles ---------- */
  function tile(item, opts) {
    opts = opts || {};
    var wl = weekLabel(item);
    var sub = [];
    if (item.dateLabel || item.date) sub.push(item.dateLabel || shortDate(item.date));
    else if (item.kicker) sub.push(item.kicker);
    if (item.slides) sub.push(item.slides + " slides");
    var actions = isVideo(item)
      ? '<button type="button" class="tbtn tbtn-primary" data-play="' + esc(item.id) + '">' + I_PLAY + "Play</button>" +
        (item.href ? '<a class="tbtn tbtn-ghost" href="' + esc(item.href) + '" target="_blank" rel="noopener">Slides</a>' : "")
      : '<a class="tbtn tbtn-primary" href="' + esc(item.href) + '" target="_blank" rel="noopener">' + I_OPEN + "Open</a>" +
        (item.pdf ? '<button type="button" class="tbtn tbtn-ghost" data-pdf="' + esc(item.pdf) + '" data-deck="' + esc(item.title) + '">' + I_DL + "PDF</button>" : "");
    var t = el(
      '<article class="tile' + (isVideo(item) ? " is-video" : "") + '" tabindex="0" data-id="' + esc(item.id) + '" aria-label="' + esc(item.title) + '">' +
        '<div class="tile-cover">' + coverHtml(item) + "</div>" +
        '<div class="tile-badges"><span>' + badgesFor(item) + "</span>" + (wl ? '<span class="badge badge-week">' + esc(wl) + "</span>" : "") + "</div>" +
        (isVideo(item) ? '<div class="tile-play"><span>' + I_PLAY + "</span></div>" : "") +
        '<div class="tile-info"><div class="tile-name">' + esc(item.name || item.title) + '</div><div class="tile-sub">' + esc(sub.join(" · ")) + '</div><div class="tile-actions">' + actions + "</div></div>" +
        (opts.progress ? '<div class="progress"><i></i></div>' : "") +
      "</article>"
    );
    return t;
  }

  /* ---------- rows ---------- */
  function row(id, title, sub, meta, list, opts) {
    opts = opts || {};
    var r = el(
      '<section class="row" id="row-' + esc(id) + '" aria-label="' + esc(title) + '">' +
        '<div class="row-head"><h2 class="row-title">' + esc(title) + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</h2>" + (meta ? '<span class="row-meta">' + esc(meta) + "</span>" : "") + "</div>" +
        '<div class="row-body"><button type="button" class="row-arrow prev" aria-label="Scroll back">' + I_L + '</button><div class="row-track"></div><button type="button" class="row-arrow next" aria-label="Scroll forward">' + I_R + "</button></div>" +
      "</section>"
    );
    var track = r.querySelector(".row-track");
    list.forEach(function (it) { track.appendChild(tile(it, opts)); });
    var prev = r.querySelector(".prev"), next = r.querySelector(".next");
    function update() {
      prev.hidden = track.scrollLeft <= 4;
      next.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -track.clientWidth * 0.9, behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: track.clientWidth * 0.9, behavior: "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    setTimeout(update, 0);
    return r;
  }

  var rowsEl = el('<div class="rows"></div>');
  var continueHost = el('<div id="continue-host"></div>');

  function renderContinue() {
    continueHost.replaceChildren();
    if (L.kind !== "training") return;
    var list = getWatched().map(function (id) { return byId[id]; }).filter(Boolean);
    if (!list.length) return;
    continueHost.appendChild(row("continue", "Continue Watching", "Picked up where you left off", "", list, { progress: true }));
  }

  function build() {
    root.replaceChildren();
    root.appendChild(renderBillboard(newest));

    rowsEl.replaceChildren();
    rowsEl.appendChild(row("recent", "Recently Added", "", "Newest first", dated.slice(0, 8)));
    rowsEl.appendChild(continueHost);
    renderContinue();

    L.series.forEach(function (s) {
      var list = items.filter(function (it) { return it.series === s.id; });
      if (!list.length) return;
      list = s.extra ? list : list.slice().sort(byWeekAsc);
      var meta = s.meta || (s.total ? list.length + " of " + s.total + " weeks" : list.length + " items");
      rowsEl.appendChild(row(s.id, s.name, s.tagline || "", meta, list));
    });
    root.appendChild(rowsEl);
  }

  /* ---------- modal player ---------- */
  var modal = el(
    '<div class="lib-modal" id="lib-modal" role="dialog" aria-modal="true" aria-label="Replay">' +
      '<div class="lib-modal-box"><button type="button" class="lib-modal-close" aria-label="Close">&#215;</button>' +
        '<div class="lib-modal-frame"></div><div class="lib-modal-body"><div class="lib-modal-main"></div><aside class="lib-modal-side"></aside></div>' +
      "</div></div>"
  );
  document.body.appendChild(modal);
  var mFrame = modal.querySelector(".lib-modal-frame"), mMain = modal.querySelector(".lib-modal-main"), mSide = modal.querySelector(".lib-modal-side");
  var lastFocus = null;

  function openModal(item, autoplay) {
    if (!item || !item.embed) return;
    lastFocus = document.activeElement;
    var s = seriesOf(item);
    var f = document.createElement("iframe");
    f.src = item.embed + (autoplay ? "&autoplay=1" : "");
    f.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share";
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    f.title = item.title;
    mFrame.replaceChildren(f);
    var meta = [];
    if (item.dateLabel || item.date) meta.push("<b>" + esc(item.dateLabel || shortDate(item.date)) + "</b>");
    if (weekLabel(item)) meta.push(esc(weekLabel(item)));
    meta.push("Edited replay");
    mMain.innerHTML =
      '<div class="lib-modal-badges">' + badgesFor(item) + (s ? '<span class="badge badge-series">' + esc(s.name) + "</span>" : "") + "</div>" +
      '<h2 class="lib-modal-title">' + headlineHtml(item) + "</h2>" +
      '<div class="lib-modal-meta">' + meta.join("<span>·</span>") + "</div>" +
      '<p class="lib-modal-desc">' + (item.desc || "") + "</p>";
    var siblings = s ? items.filter(function (it) { return it.series === s.id && it !== item && it.embed; }).sort(byWeekAsc) : [];
    mSide.innerHTML =
      (s ? '<p class="k">Series</p><div class="v">' + esc(s.name) + "</div>" : "") +
      '<p class="k">Recorded</p><div class="v">' + esc(item.dateLabel || shortDate(item.date) || "On demand") + "</div>" +
      '<div class="actions">' +
        (item.href ? '<a class="btn btn-primary" href="' + esc(item.href) + '" target="_blank" rel="noopener">' + I_OPEN + "<span>Open This Week's Slides</span></a>" : "") +
        (siblings.length ? '<p class="k" style="margin-top:14px">More in this series</p>' + siblings.map(function (it) {
          return '<button type="button" class="btn btn-secondary" data-play="' + esc(it.id) + '">' + I_PLAY + "<span>" + esc(weekLabel(it) ? weekLabel(it).replace(/ of \d+$/, "") + " · " : "") + esc(it.name || it.title) + "</span></button>";
        }).join("") : "") +
      "</div>";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".lib-modal-close").focus();
    markWatched(item.id);
  }
  function closeModal() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    mFrame.replaceChildren();
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.querySelector(".lib-modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  /* ---------- delegated clicks ---------- */
  document.addEventListener("click", function (e) {
    var play = e.target.closest("[data-play]");
    if (play) { e.preventDefault(); openModal(byId[play.getAttribute("data-play")], true); return; }
    var info = e.target.closest("[data-info]");
    if (info) { e.preventDefault(); openModal(byId[info.getAttribute("data-info")], false); return; }
    var pdf = e.target.closest("[data-pdf]");
    if (pdf) {
      e.preventDefault(); e.stopPropagation();
      document.dispatchEvent(new CustomEvent("lib:pdf", { detail: { pdf: pdf.getAttribute("data-pdf"), deck: pdf.getAttribute("data-deck") } }));
      return;
    }
    var t = e.target.closest(".tile");
    if (t && !e.target.closest("a,button")) {
      var item = byId[t.getAttribute("data-id")];
      if (!item) return;
      if (isVideo(item)) openModal(item, true);
      else if (item.href) window.open(item.href, "_blank", "noopener");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var t = e.target.closest && e.target.closest(".tile");
    if (!t || e.target !== t) return;
    var item = byId[t.getAttribute("data-id")];
    if (!item) return;
    if (isVideo(item)) openModal(item, true);
    else if (item.href) window.open(item.href, "_blank", "noopener");
  });

  /* ---------- chrome ---------- */
  var top = document.querySelector(".lib-top");
  function onScroll() { if (top) top.classList.toggle("solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });

  build();
  onScroll();
})();
