/* ==========================================================
   APP — reads the JSON file named in <body data-content="...">,
   builds every section, then hands over to motion.js.
   Non-coders: edit the files in /content, not this file.
   ========================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var body = document.body;
  var PAGE = body.dataset.page;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function slot(name) { return $('[data-slot="' + name + '"]'); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function list(a) { return Array.isArray(a) ? a.filter(function (x) { return x !== null && x !== undefined && x !== ""; }) : []; }
  function arr(a) { return Array.isArray(a) ? list(a) : (a ? [a] : []); }
  function setText(name, value) { var el = slot(name); if (el && value != null) el.textContent = value; return el; }
  function setHTML(name, html) { var el = slot(name); if (el) el.innerHTML = html; return el; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function motionOn() { return !!window.gsap && !document.documentElement.classList.contains("no-motion"); }
  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }
  function paras(a, cls) { return arr(a).map(function (p) { return "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + esc(p) + "</p>"; }).join(""); }
  function lines(a) { return arr(a).map(function (l) { return '<span class="hl"><span>' + esc(l) + "</span></span>"; }).join(" "); }

  /* Links: an empty link becomes a visible placeholder that does nothing */
  function linkAttrs(link) {
    link = String(link || "").trim();
    if (!link) return 'href="#" data-placeholder aria-disabled="true" title="Link coming soon"';
    var ext = /^https?:\/\//.test(link) || /^mailto:|^tel:/.test(link);
    return 'href="' + esc(link) + '"' + (/^https?:\/\//.test(link) ? ' target="_blank" rel="noopener"' : "") + (ext ? "" : "");
  }
  function linkHTML(obj, cls) {
    if (!obj || !obj.label) return "";
    return '<a class="' + (cls || "") + '" ' + linkAttrs(obj.link) +
      (obj.preselect ? ' data-preselect="' + esc(obj.preselect) + '"' : "") + ">" + esc(obj.label) + "</a>";
  }
  function setLink(name, obj) {
    var el = slot(name);
    if (!el) return;
    if (!obj || !obj.label) { el.hidden = true; return; }
    el.textContent = obj.label;
    var link = String(obj.link || "").trim();
    if (link) {
      el.setAttribute("href", link);
      if (/^https?:\/\//.test(link)) { el.target = "_blank"; el.rel = "noopener"; }
    } else {
      el.setAttribute("href", "#"); el.setAttribute("data-placeholder", ""); el.setAttribute("aria-disabled", "true"); el.title = "Link coming soon";
    }
    if (obj.preselect) el.setAttribute("data-preselect", obj.preselect);
  }

  document.addEventListener("click", function (e) {
    var ph = e.target.closest("[data-placeholder]");
    if (ph) {
      e.preventDefault(); e.stopPropagation();
      ph.classList.remove("is-placeholder-flash"); void ph.offsetWidth; ph.classList.add("is-placeholder-flash");
      return;
    }
    var pre = e.target.closest("[data-preselect]");
    if (pre && window.Booking) window.Booking.preselect($("#bookingForm"), pre.getAttribute("data-preselect"));
  }, true);

  var ICONS = {
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 9.5c3.5-1 7.3-.7 10 .9M7.6 12.7c2.9-.8 5.8-.5 8.1.8M8.3 15.7c2.2-.6 4.3-.4 6 .6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.5 2.3-2.5S16 11.4 16 13v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14l4-4M9 7h-1a5 5 0 0 0 0 10h1M15 7h1a5 5 0 0 1 0 10h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  function icon(name) { return ICONS[String(name || "").toLowerCase()] || ICONS.link; }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }
  function parseDate(str) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function longDate(str) { var p = parseDate(str); return p ? p.d + " " + MONTHS[p.m] + " " + p.y : (str || ""); }

  function youtubeId(url) {
    var m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(url || "");
    return m ? m[1] : null;
  }
  function videoEmbed(url, cls) {
    if (!url) return "";
    var id = youtubeId(url);
    if (id) return '<div class="' + cls + '"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '" title="Project video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
    return '<div class="' + cls + '"><video src="' + esc(url) + '" controls playsinline preload="metadata"></video></div>';
  }

  /* ---------- reusable blocks ---------- */
  function renderMarquee(items) {
    var el = slot("marquee");
    if (!el) return;
    var group = '<div class="marquee-group">' + list(items).map(function (t) {
      return '<span class="marquee-item">' + esc(t) + '</span><span class="marquee-dot"></span>';
    }).join("") + "</div>";
    el.innerHTML = group + group + group + group;
  }

  function renderSlider(el, items) {
    items = list(items);
    if (!el || !items.length) return false;
    el.innerHTML =
      '<div class="slides">' + items.map(function (t, i) {
        return '<figure class="slide' + (i === 0 ? " is-active" : "") + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + items.length + '">' +
          '<blockquote><p class="slide-quote">' + esc(t.quote) + '</p></blockquote>' +
          '<figcaption class="slide-cite"><strong>' + esc(t.name) + '</strong><span>' + esc(t.role) + '</span></figcaption></figure>';
      }).join("") + "</div>" +
      (items.length > 1 ?
        '<div class="slider-controls">' +
          '<button class="slider-btn" data-dir="-1" aria-label="Previous">&#8592;</button>' +
          '<button class="slider-btn" data-dir="1" aria-label="Next">&#8594;</button>' +
          '<div class="slider-dots">' + items.map(function (_, i) {
            return '<button class="slider-dot" aria-label="Show ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + '></button>';
          }).join("") + '</div>' +
          '<span class="slider-count" aria-live="polite">01 / ' + pad(items.length) + '</span>' +
        '</div>' : "");
    initSlider(el);
    return true;
  }

  function initSlider(root) {
    var slides = $$(".slide", root);
    if (slides.length < 2) return;
    var dots = $$(".slider-dot", root), count = $(".slider-count", root);
    var i = 0, timer = null, busy = false;
    function go(n) {
      if (busy) return;
      n = (n + slides.length) % slides.length;
      if (n === i) return;
      var from = slides[i], to = slides[n], dir = n > i ? 1 : -1;
      if (motionOn()) {
        busy = true;
        window.gsap.timeline({ onComplete: function () { busy = false; } })
          .to(from, { autoAlpha: 0, y: -30 * dir, duration: .4, ease: "power2.in" })
          .add(function () { from.classList.remove("is-active"); to.classList.add("is-active"); })
          .fromTo(to, { autoAlpha: 0, y: 40 * dir }, { autoAlpha: 1, y: 0, duration: .7, ease: "power3.out" })
          .fromTo($(".slide-quote", to), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power2.out" }, "<");
      } else { from.classList.remove("is-active"); to.classList.add("is-active"); }
      i = n;
      dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      if (count) count.textContent = pad(i + 1) + " / " + pad(slides.length);
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 7000); }
    root.addEventListener("click", function (e) {
      var b = e.target.closest(".slider-btn"); if (b) { go(i + parseInt(b.dataset.dir, 10)); restart(); }
      var d = e.target.closest(".slider-dot"); if (d) { go(dots.indexOf(d)); restart(); }
    });
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); restart(); }
      sx = null;
    });
    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", restart);
    restart();
  }

  function socialList(items, withIcons) {
    return list(items).map(function (s) {
      return "<li><a " + linkAttrs(s.link) + ">" + (withIcons ? icon(s.name) : "") + esc(s.name) + "</a></li>";
    }).join("");
  }
  function footerBase(f, name) {
    var el = slot("footer.base");
    if (!el) return;
    var legal = list(f.legal).map(function (l) { return linkHTML(l, ""); }).join("");
    el.innerHTML = '<span>&copy; ' + new Date().getFullYear() + " " + esc(f.copyright || name || "") + "</span>" +
      (legal ? '<span class="footer-legal-inline">' + legal + "</span>" : "") +
      (f.credit && f.credit.label ? linkHTML(f.credit, "dev-credit") : "");
  }

  /* ---------- shared parts ---------- */
  function renderShared(data) {
    if (data.meta) {
      if (data.meta.title) document.title = data.meta.title;
      var md = $('meta[name="description"]');
      if (md && data.meta.description) md.setAttribute("content", data.meta.description);
    }
    setHTML("nav", list(data.nav).map(function (n) { return "<li>" + linkHTML(n, "") + "</li>"; }).join(""));
    setLink("navButton", data.navButton);
    renderMarquee((data.marquee || {}).items);
  }

  /* ---------- KOMMZ HUB ---------- */
  var projects = [];

  function renderHeroVideo(h) {
    var v = slot("hero.video");
    if (!v) return;
    var hero = $(".kh-hero");
    var ov = parseFloat(h.overlay);
    hero.style.setProperty("--overlay", isNaN(ov) ? 0 : Math.max(0, Math.min(.9, ov)));
    if (h.poster) v.setAttribute("poster", h.poster);
    var src = "";
    if (h.video) src += '<source src="' + esc(h.video) + '"' + (/\.mp4$/i.test(h.video) ? ' type="video/mp4"' : /\.webm$/i.test(h.video) ? ' type="video/webm"' : "") + ">";
    if (h.videoFallback) src += '<source src="' + esc(h.videoFallback) + '">';
    v.innerHTML = src;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    if (!src) return;
    v.load();
    // Keep trying to start the muted video: as soon as it can play, on the
    // visitor's first scroll or tap (if the browser blocked autoplay), and
    // when they come back to the tab.
    function tryPlay() {
      if (!v.paused) return;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    tryPlay();
    ["loadedmetadata", "canplay"].forEach(function (ev) { v.addEventListener(ev, tryPlay); });
    ["touchstart", "scroll", "click", "keydown"].forEach(function (ev) {
      window.addEventListener(ev, tryPlay, { once: true, passive: true });
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
    var btn = $(".kh-sound");
    if (btn && h.soundButton) {
      v.addEventListener("loadeddata", function () { btn.hidden = false; }, { once: true });
      btn.addEventListener("click", function () {
        v.muted = !v.muted;
        if (!v.muted) { var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
        btn.setAttribute("aria-pressed", String(!v.muted));
        $(".kh-sound-label", btn).textContent = v.muted ? "Sound on" : "Sound off";
      });
    }
  }

  function renderKommz(d) {
    var h = d.hero || {};
    setHTML("hero.lines", arr(h.lines).map(function (l) { return '<span class="line"><span>' + esc(l) + "</span></span>"; }).join(""));
    setHTML("hero.paragraphs", paras(h.paragraphs));
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);
    renderHeroVideo(h);

    var a = d.about || {};
    setHTML("about.heading", lines(a.heading));
    setText("about.lead", a.lead);
    setHTML("about.paragraphs", paras(a.paragraphs));
    setText("about.question", a.question);
    setText("about.closing", a.closing);
    setText("about.philosophyTitle", a.philosophyTitle);
    setHTML("about.philosophy", list(a.philosophy).map(function (p, i) {
      return '<li class="kh-phil"><span class="kh-phil-num">' + pad(i + 1) + '</span><h4>' + esc(p.title) + "</h4><p>" + esc(p.text) + "</p></li>";
    }).join(""));

    var dr = d.drives || {};
    setText("drives.title", dr.title);
    setHTML("drives.items", list(dr.items).map(function (it) {
      return '<article class="kh-drive"><h3>' + esc(it.title) + "</h3>" + paras(it.text) + "</article>";
    }).join(""));

    var sv = d.services || {};
    setHTML("services.heading", lines(sv.heading));
    setHTML("services.intro", paras(sv.intro));
    setHTML("services.items", list(sv.items).map(function (s, i) {
      return '<article class="kh-scard' + (i % 2 ? " is-light" : "") + '" style="--i:' + i + '">' +
        '<div class="kh-scard-inner">' +
          '<div class="kh-scard-main">' +
            '<span class="kh-scard-num">' + pad(i + 1) + "</span>" +
            '<h3 class="kh-scard-title">' + esc(s.title) + "</h3>" +
            '<p class="kh-scard-headline">' + esc(s.headline) + "</p>" +
            '<div class="kh-scard-text">' + paras(s.text) + "</div>" +
            linkHTML(s.button, "btn " + (i % 2 ? "btn-dark" : "btn-light")) +
          "</div>" +
          '<div class="kh-scard-side">' +
            (s.image ? '<div class="kh-scard-media"><img src="' + esc(s.image) + '" alt="" loading="lazy"></div>' : "") +
            (list(s.list).length ? '<p class="kh-scard-listlabel">' + esc(sv.listLabel || "Our services include") + '</p><ul class="kh-scard-list">' +
              list(s.list).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>" +
        "</div></article>";
    }).join(""));

    var band = d.wordmarkBand || {};
    var rows = Math.max(1, Math.min(14, parseInt(band.rows, 10) || 7)), rowHTML = "";
    for (var r = 0; r < rows; r++) {
      var t = rows === 1 ? 0 : r / (rows - 1), c = Math.round(13 + 147 * t);
      rowHTML += '<div class="kh-band-row" style="--row-color: rgb(' + c + ',' + c + ',' + c + ')" data-speed-x="' + ((r % 2 ? -1 : 1) * (0.6 + r * 0.08)).toFixed(2) + '"></div>';
    }
    setHTML("wordmarkBand", rowHTML);

    renderWork(d.work || {});
    renderTeam(d.team || {});

    var u = d.upclose || {};
    setHTML("upclose.heading", lines(u.heading));
    setHTML("upclose.intro", paras(u.intro));
    setText("upclose.host", u.host);
    setLink("upclose.primaryButton", u.primaryButton);
    setLink("upclose.secondaryButton", u.secondaryButton);

    var cl = d.clients || {};
    setText("clients.heading", cl.heading);
    setHTML("clients.paragraphs", paras(cl.paragraphs));
    setHTML("clients.logos", list(cl.logos).map(function (c) {
      var inner = c.logo ? '<img src="' + esc(c.logo) + '" alt="' + esc(c.name) + '" loading="lazy">' : '<span>' + esc(c.name) + "</span>";
      return '<li class="kh-logo">' + (c.link ? "<a " + linkAttrs(c.link) + ">" + inner + "</a>" : inner) + "</li>";
    }).join(""));
    setText("clients.testimonialsTitle", cl.testimonialsTitle);
    if (renderSlider(slot("clients.testimonials"), cl.testimonials)) slot("clients.testimonialsWrap").hidden = false;

    var b = d.booking || {};
    setHTML("booking.heading", lines(b.heading));
    setHTML("booking.paragraphs", paras(b.paragraphs));
    var ct = d.contact || {}, dl = "";
    setText("contact.title", ct.title);
    if (ct.location) dl += "<div><dt>Location</dt><dd>" + esc(ct.location) + "</dd></div>";
    if (ct.email) dl += '<div><dt>Email</dt><dd><a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + "</a></dd></div>";
    if (ct.phone) dl += '<div><dt>Phone / WhatsApp</dt><dd><a href="tel:' + esc(String(ct.phone).replace(/\s+/g, "")) + '">' + esc(ct.phone) + "</a></dd></div>";
    if (list(ct.socials).length) dl += '<div><dt>Social media</dt><dd><ul class="contact-socials">' + socialList(ct.socials, true) + "</ul></dd></div>";
    setHTML("contact", dl);
    window.Booking.init($("#bookingForm"), b, { buttonClass: "btn-dark", siteName: "Kommz Hub website" });

    var f = d.footer || {};
    setHTML("footer.heading", lines(f.heading));
    setText("footer.text", f.text);
    setLink("footer.button", f.button);
    setHTML("footer.company", "<strong>" + esc(f.company) + "</strong><span>" + esc(f.tagline) + "</span><span>" + esc(f.location) + "</span>");
    setHTML("footer.quickLinks", list(f.quickLinks).map(function (l) { return "<li>" + linkHTML(l, "") + "</li>"; }).join(""));
    setHTML("footer.socials", socialList(f.socials, false));
    setHTML("footer.legal", list(f.legal).map(function (l) { return "<li>" + linkHTML(l, "") + "</li>"; }).join(""));
    footerBase({ copyright: f.copyright, credit: f.credit }, "Kommz Hub Ltd.");
  }

  function renderUpcloseTeaser(uc, labels) {
    var el = slot("upclose.episodes");
    if (!el) return;
    labels = labels || {};
    var items = list(((uc || {}).episodes || {}).items);
    var channel = {};
    list(((uc || {}).listen || {}).platforms).forEach(function (p) { channel[String(p.name).toLowerCase()] = p.link; });
    if (!items.length) { el.innerHTML = '<p class="kh-uc-more">' + esc(labels.moreComing || "") + "</p>"; return; }
    function watch(e) { return e.youtube || e.spotify || channel.youtube || ""; }
    var f = items[0];
    var html = '<article class="kh-uc-feature">' +
      (f.image ? '<div class="kh-uc-thumb" data-reveal-img><img src="' + esc(f.image) + '" alt="' + esc(f.imageAlt) + '" loading="lazy"></div>' : "") +
      '<div class="kh-uc-feature-body">' +
        '<p class="kh-uc-kicker">Latest episode' + (f.date ? " · " + esc(longDate(f.date)) : "") + "</p>" +
        '<h3 class="kh-uc-guest">' + esc(f.guest) + "</h3>" +
        '<p class="kh-uc-title">' + esc(f.theme) + "</p>" +
        (f.summary ? '<p class="kh-uc-summary">' + esc(f.summary) + "</p>" : "") +
        '<a class="btn btn-gold" ' + linkAttrs(watch(f)) + ">" + icon("play") + esc(labels.watchLabel || "Watch") + "</a>" +
      "</div></article>";
    var rest = items.slice(1, 4);
    html += '<div class="kh-uc-cards">' + rest.map(function (e) {
      return '<article class="kh-uc-card">' +
        (e.image ? '<div class="kh-uc-card-thumb"><img src="' + esc(e.image) + '" alt="' + esc(e.imageAlt) + '" loading="lazy"></div>' : "") +
        '<div><h4>' + esc(e.guest) + "</h4><p class=\"kh-uc-card-title\">" + esc(e.theme) + "</p>" +
        (e.summary ? "<p>" + esc(e.summary) + "</p>" : "") +
        '<a class="kh-uc-watch" ' + linkAttrs(watch(e)) + ">" + icon("play") + esc(labels.watchLabel || "Watch") + "</a></div></article>";
    }).join("") + (rest.length < 3 ? '<p class="kh-uc-more">' + esc(labels.moreComing || "") + "</p>" : "") + "</div>";
    el.innerHTML = html;
  }

  function renderWork(w) {
    setHTML("work.heading", lines(w.heading));
    setHTML("work.intro", paras(w.intro));
    projects = list(w.items);
    var filters = list(w.filters).filter(function (f) {
      return projects.some(function (p) { return list(p.filters).indexOf(f) >= 0; });
    });
    setHTML("work.filters", '<button class="kh-filter" aria-pressed="true" data-filter="*">All<sup>' + projects.length + "</sup></button>" +
      filters.map(function (f) {
        var n = projects.filter(function (p) { return list(p.filters).indexOf(f) >= 0; }).length;
        return '<button class="kh-filter" aria-pressed="false" data-filter="' + esc(f) + '">' + esc(f) + "<sup>" + n + "</sup></button>";
      }).join(""));
    setHTML("work.items", projects.map(function (p, i) {
      var cover = p.image
        ? '<img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '" loading="lazy">'
        : '<div class="kh-cover kh-cover-' + (i % 4) + '" aria-hidden="true"><span class="kh-cover-client">' + esc(p.coverText || p.client) + '</span><img src="assets/img/kommz-mark-white.svg" alt=""></div>';
      return '<article class="kh-card" data-index="' + i + '" data-filters="' + esc(list(p.filters).join("|")) + '" data-cursor="View">' +
        '<div class="kh-card-media" data-reveal-img>' + cover + "</div>" +
        '<div class="kh-card-body">' +
          '<p class="kh-card-cat">' + esc(p.categoryText) + "</p>" +
          "<h3>" + esc(p.title) + "</h3>" +
          '<p class="kh-card-client">' + esc(p.client) + (p.year ? " · " + esc(p.year) : "") + "</p>" +
          (arr(p.overview).length ? '<p class="kh-card-summary">' + esc(arr(p.overview)[0]) + "</p>" : "") +
          '<button class="btn btn-ghost-light kh-card-btn" type="button" aria-haspopup="dialog">' + esc(w.buttonLabel || "View Project") + "</button>" +
        "</div></article>";
    }).join(""));
    initFilters();
    initModal();
  }

  function renderTeam(t) {
    setText("team.heading", t.heading);
    setHTML("team.intro", paras(t.intro));
    function socials(m) {
      return (m.linkedin ? '<a href="' + esc(m.linkedin) + '" target="_blank" rel="noopener" aria-label="' + esc(m.name) + ' on LinkedIn">' + icon("linkedin") + "</a>" : "") +
        (m.instagram ? '<a href="' + esc(m.instagram) + '" target="_blank" rel="noopener" aria-label="' + esc(m.name) + ' on Instagram">' + icon("instagram") + "</a>" : "");
    }
    function photo(m) {
      return m.photo ? '<img src="' + esc(m.photo) + '" alt="Portrait of ' + esc(m.name) + '" loading="lazy">'
        : '<div class="kh-member-initials" aria-hidden="true">' + esc(initials(m.name)) + '<img src="assets/img/kommz-mark-white.svg" alt=""></div>';
    }
    var f = t.founder;
    setHTML("team.founder", f && f.name ?
      '<article class="kh-founder">' +
        '<div class="kh-founder-photo kh-member-photo" data-reveal-img>' + photo(f) + (socials(f) ? '<div class="kh-member-socials">' + socials(f) + "</div>" : "") + "</div>" +
        '<div class="kh-founder-body"><p class="kh-founder-role">' + esc(f.role) + "</p><h3>" + esc(f.name) + "</h3>" + paras(f.bio) + "</div>" +
      "</article>" : "");
    setHTML("team.members", list(t.members).map(function (m) {
      return '<article class="kh-member"><div class="kh-member-photo" data-reveal-img>' + photo(m) +
        (socials(m) ? '<div class="kh-member-socials">' + socials(m) + "</div>" : "") + "</div>" +
        "<h3>" + esc(m.name) + '</h3><p class="kh-member-role">' + esc(m.role) + "</p>" +
        (m.bio ? '<p class="kh-member-bio">' + esc(m.bio) + "</p>" : "") + "</article>";
    }).join(""));
  }

  function initFilters() {
    var bar = slot("work.filters");
    if (!bar) return;
    var empty = $(".kh-work-empty");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".kh-filter");
      if (!btn) return;
      var f = btn.dataset.filter;
      $$(".kh-filter", bar).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      var cards = $$(".kh-card");
      function apply() {
        cards.forEach(function (c) { c.hidden = !(f === "*" || c.dataset.filters.split("|").indexOf(f) >= 0); });
        var shown = cards.filter(function (c) { return !c.hidden; });
        if (empty) empty.hidden = shown.length > 0;
        if (motionOn()) window.gsap.fromTo(shown, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .08, ease: "power3.out", clearProps: "transform" });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }
      var visible = cards.filter(function (c) { return !c.hidden; });
      if (motionOn() && visible.length) window.gsap.to(visible, { autoAlpha: 0, y: -20, duration: .25, stagger: .03, onComplete: apply });
      else apply();
    });
  }

  function initModal() {
    var modal = $("#projectModal");
    if (!modal) return;
    var bodyEl = $(".modal-body", modal), panel = $(".modal-panel", modal), lastFocus = null, current = 0;
    function block(title, content) { return content ? '<section class="cs-block"><h3>' + esc(title) + "</h3>" + content + "</section>" : ""; }
    function fill(i) {
      current = i;
      var p = projects[i];
      var metrics = list(p.metrics).filter(function (m) { return m && String(m.value || "").trim(); });
      var gallery = list(p.gallery);
      var work = videoEmbed(p.video, "cs-video") +
        (gallery.length ? '<div class="cs-gallery">' + gallery.map(function (g) { return '<img src="' + esc(g) + '" alt="" loading="lazy">'; }).join("") + "</div>" : "");
      bodyEl.innerHTML =
        '<div class="cs-head"><p class="cs-cat">' + esc(p.categoryText) + "</p>" +
        '<h2 class="cs-title" id="modalTitle">' + esc(p.title) + "</h2>" +
        '<p class="cs-meta"><span><strong>Client</strong> ' + esc(p.client) + "</span>" + (p.year ? "<span><strong>Year</strong> " + esc(p.year) + "</span>" : "") + "</p></div>" +
        (p.image && !p.video ? '<img class="cs-hero" src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '">' : "") +
        '<div class="cs-flow">' +
          block("Project overview", paras(p.overview)) +
          block("The challenge", paras(p.challenge)) +
          block("Our approach", paras(p.approach)) +
          block("The work", work) +
          block("The outcome", paras(p.outcome)) +
          (metrics.length ? '<dl class="cs-metrics">' + metrics.map(function (m) { return "<div><dd>" + esc(m.value) + "</dd><dt>" + esc(m.label) + "</dt></div>"; }).join("") + "</dl>" : "") +
          block("Our contribution", paras(p.contribution)) +
        "</div>" +
        '<div class="cs-nav"><span></span>' +
          (projects.length > 1 ? '<button class="btn btn-dark" type="button" data-next>Next project</button>' : "") + "</div>";
      panel.scrollTop = 0;
    }
    function open(i) {
      lastFocus = document.activeElement;
      fill(i);
      modal.hidden = false;
      document.documentElement.classList.add("modal-lock");
      if (window.KHMotion) window.KHMotion.pause(true);
      if (motionOn()) {
        window.gsap.fromTo($(".modal-backdrop", modal), { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
        window.gsap.fromTo(panel, { yPercent: 12, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .6, ease: "power3.out" });
      }
      panel.focus();
    }
    function close() {
      $$("video, iframe", bodyEl).forEach(function (m) { if (m.tagName === "VIDEO") m.pause(); else m.src = "about:blank"; });
      modal.hidden = true;
      document.documentElement.classList.remove("modal-lock");
      if (window.KHMotion) window.KHMotion.pause(false);
      if (lastFocus) lastFocus.focus();
    }
    document.addEventListener("click", function (e) {
      var card = e.target.closest(".kh-card");
      if (card) open(parseInt(card.dataset.index, 10));
    });
    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
      if (e.target.closest("[data-next]")) fill((current + 1) % projects.length);
    });
    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var f = $$('button, a[href], iframe, video, [tabindex]:not([tabindex="-1"])', modal);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---------- THE UP CLOSE PAGE ---------- */
  function renderUpclose(d) {
    var h = d.hero || {};
    setText("hero.tagline", h.tagline);
    setText("hero.intro", h.intro);
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);

    var a = d.about || {};
    setText("about.title", a.title);
    setText("about.text", a.text);
    var ai0 = slot("about.image"); if (ai0 && a.image) { ai0.src = a.image; ai0.alt = a.imageAlt || ""; }

    var tp = d.topics || {};
    setText("topics.title", tp.title);
    setHTML("topics.items", list(tp.items).map(function (t, i) {
      return '<article class="uc-topic"><span class="uc-topic-num">' + pad(i + 1) + "</span><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></article>";
    }).join(""));
    if (!list(tp.items).length && $(".uc-topics")) $(".uc-topics").hidden = true;

    var ho = d.host || {};
    setText("host.label", ho.label);
    setHTML("host.name", String(ho.name || "").split(/\s+/).map(function (w) { return "<span>" + esc(w) + "</span>"; }).join(" "));
    setHTML("host.roles", list(ho.roles).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join(""));
    setText("host.bio", ho.bio);
    var hi = slot("host.image"); if (hi && ho.image) { hi.src = ho.image; hi.alt = ho.imageAlt || ""; }

    var ep = d.episodes || {}, listen = d.listen || {}, channel = {};
    list(listen.platforms).forEach(function (p) { channel[String(p.name).toLowerCase()] = p.link; });
    setText("episodes.title", ep.title);
    var items = list(ep.items);
    if (items.length) {
      var e = items[0], p = parseDate(e.date);
      var badge = p ? '<div class="uc-date" aria-label="' + esc(longDate(e.date)) + '"><span class="uc-date-day">' + MONTHS[p.m].toUpperCase() + " " + p.d + "<sup>" + ordinal(p.d) + '</sup></span><span class="uc-date-year">' + p.y + "</span></div>" : "";
      var yt = e.youtube || channel.youtube || "", sp = e.spotify || channel.spotify || "";
      setHTML("episodes.latest",
        '<article class="uc-latest">' +
          (e.image ? '<figure class="uc-latest-art" data-reveal-img><img src="' + esc(e.image) + '" alt="' + esc(e.imageAlt) + '" loading="lazy"></figure>' : "") +
          "<div data-reveal>" +
            '<div class="uc-latest-top"><p class="uc-latest-kicker">Latest episode' + (e.number ? ", episode " + esc(e.number) : "") + "</p>" + badge + "</div>" +
            '<h3 class="uc-guest-name">' + esc(e.guest) + "</h3>" +
            (e.guestRole ? '<p class="uc-guest-role">' + esc(e.guestRole) + "</p>" : "") +
            (e.topics ? '<p class="uc-guest-topics">' + esc(e.topics) + "</p>" : "") +
            '<div class="uc-theme"><span class="uc-theme-tag">Theme</span><p class="uc-theme-title">' + esc(e.theme) + "</p>" +
              (e.subtitle ? '<p class="uc-theme-sub">' + esc(e.subtitle) + "</p>" : "") +
              '<div class="btn-row">' +
                '<a class="btn btn-navy" ' + linkAttrs(yt) + ">" + icon("youtube") + "Watch on YouTube</a>" +
                '<a class="btn btn-ghost-navy" ' + linkAttrs(sp) + ">" + icon("spotify") + "Listen on Spotify</a>" +
              "</div></div>" +
          "</div></article>");
      setHTML("episodes.rest", items.slice(1).map(function (x) {
        return '<li class="uc-episode-row" data-reveal><time datetime="' + esc(x.date) + '">' + esc(longDate(x.date)) + "</time>" +
          "<div><strong>" + esc(x.guest) + "</strong><span>" + esc(x.theme) + (x.summary ? ": " + esc(x.summary) : "") + "</span></div>" +
          "<a " + linkAttrs(x.youtube || x.spotify || channel.youtube) + ">Watch</a></li>";
      }).join(""));
    }

    var art = d.artwork || {};
    setText("artwork.title", art.title);
    var ai = list(art.images), reps = ai.length ? Math.max(2, Math.ceil(8 / ai.length)) : 0, aHTML = "";
    for (var r = 0; r < reps; r++) {
      aHTML += ai.map(function (g) { return '<img src="' + esc(g.src) + '" alt="' + (r === 0 ? esc(g.alt) : "") + '" loading="lazy"' + (r ? ' aria-hidden="true"' : "") + ">"; }).join("");
    }
    setHTML("artwork.images", aHTML);

    var rv = d.reviews || {};
    setText("reviews.title", rv.title);
    if (!renderSlider(slot("reviews.items"), rv.items) && $(".uc-reviews")) $(".uc-reviews").hidden = true;

    setText("listen.title", listen.title);
    setText("listen.text", listen.text);
    setText("listen.handle", listen.handle);
    setHTML("listen.platforms", list(listen.platforms).map(function (p) {
      return '<a class="btn btn-navy" ' + linkAttrs(p.link) + ">" + icon(p.name) + esc(p.name) + "</a>";
    }).join(""));

    var b = d.booking || {};
    setText("booking.title", b.title);
    setText("booking.intro", b.intro);
    window.Booking.init($("#bookingForm"), b, { buttonClass: "btn-gold", siteName: "The Up Close website" });

    var f = d.footer || {};
    var prod = slot("footer.producedBy");
    if (prod) {
      if (f.producedBy) { $("span", prod).textContent = f.producedBy; prod.href = f.producedByLink || "index.html"; }
      else prod.hidden = true;
    }
    var mail = slot("footer.email");
    if (mail) { if (f.email) { mail.textContent = f.email; mail.href = "mailto:" + f.email; } else mail.hidden = true; }
    setHTML("footer.socials", socialList(listen.platforms, false));
    footerBase({ copyright: "The Up Close with Davis Higiro.", legal: f.legal, credit: f.credit });
  }

  /* ---------- LEGAL PAGES ---------- */
  function renderLegal(d) {
    var doc = d[body.dataset.doc] || {};
    document.title = (doc.title || "") + " | Kommz Hub";
    setHTML("legal",
      '<p class="kh-legal-kicker">Last updated ' + esc(longDate(d.updated)) + "</p>" +
      '<h1 class="kh-h2">' + esc(doc.title) + "</h1>" +
      (doc.intro ? '<p class="lede">' + esc(doc.intro) + "</p>" : "") +
      list(doc.sections).map(function (s) { return "<section><h2>" + esc(s.heading) + "</h2>" + paras(s.text) + "</section>"; }).join(""));
    footerBase(d.footer || {}, "Kommz Hub Ltd.");
  }

  /* ---------- navigation ---------- */
  function initNav() {
    var nav = $("#siteNav"), toggle = $(".nav-toggle"), menu = $("#navMenu");
    if (!nav) return;
    function onScroll() { if (PAGE !== "legal") nav.classList.toggle("is-scrolled", window.scrollY > 40); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      body.classList.toggle("menu-open", open);
      if (window.KHMotion) window.KHMotion.pause(open);
    }
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- loading ---------- */
  function showNotice(file) {
    var n = document.createElement("div");
    n.className = "content-notice";
    n.setAttribute("role", "alert");
    n.innerHTML = "<strong>The website text could not be loaded.</strong>" +
      "The page reads its text from <code>" + esc(file) + "</code>. Browsers block this when the page is opened " +
      "by double-clicking the file. Upload the folder to your hosting, or preview it with a local server " +
      "(for example the Live Server extension in VS Code). If the site is already online, check the JSON file for a missing comma or quote.";
    body.appendChild(n);
  }
  function getJSON(file) {
    return fetch(file, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(file + " " + r.status); return r.json(); });
  }
  function finish() {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    if (window.KHMotion) window.KHMotion.start(PAGE);
    if (location.hash && location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) setTimeout(function () {
        if (window.KHMotion && window.KHMotion.scrollTo) window.KHMotion.scrollTo(target);
        else target.scrollIntoView();
      }, 60);
    }
  }

  initNav();
  var file = body.dataset.content;
  var jobs = [getJSON(file)];
  if (PAGE === "kommzhub") jobs.push(getJSON("content/upclose.json").catch(function () { return null; }));
  Promise.all(jobs)
    .then(function (res) {
      var data = res[0];
      renderShared(data);
      if (PAGE === "kommzhub") { renderKommz(data); renderUpcloseTeaser(res[1], data.upclose); }
      if (PAGE === "upclose") renderUpclose(data);
      if (PAGE === "legal") renderLegal(data);
      finish();
    })
    .catch(function (err) {
      console.error("Content error:", err);
      finish();
      showNotice(file);
    });
})();
