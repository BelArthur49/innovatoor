/* ==========================================================
   APP — reads the JSON file named in <body data-content="...">,
   builds every section, then hands over to motion.js for the
   scroll animations. Non-coders: edit the files in /content.
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
  function list(a) { return Array.isArray(a) ? a.filter(Boolean) : []; }
  function setText(name, value) { var el = slot(name); if (el && value != null) el.textContent = value; return el; }
  function setHTML(name, html) { var el = slot(name); if (el) el.innerHTML = html; return el; }
  function setLink(name, obj) {
    var el = slot(name);
    if (!el) return;
    if (!obj || !obj.label) { el.hidden = true; return; }
    el.textContent = obj.label; el.href = obj.link || "#";
  }
  function setImg(name, src, alt) { var el = slot(name); if (el && src) { el.src = src; el.alt = alt || ""; } }
  function isExternal(link) { return /^https?:\/\//.test(link || ""); }
  function extAttrs(link) { return isExternal(link) ? ' target="_blank" rel="noopener"' : ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function motionOn() { return !!window.gsap && !document.documentElement.classList.contains("no-motion"); }
  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }

  var ICONS = {
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 9.5c3.5-1 7.3-.7 10 .9M7.6 12.7c2.9-.8 5.8-.5 8.1.8M8.3 15.7c2.2-.6 4.3-.4 6 .6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.5 2.3-2.5S16 11.4 16 13v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14l4-4M9 7h-1a5 5 0 0 0 0 10h1M15 7h1a5 5 0 0 1 0 10h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  function icon(name) { return ICONS[String(name || "").toLowerCase()] || ICONS.link; }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }
  function parseDate(str) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function longDate(str) { var p = parseDate(str); return p ? p.d + " " + MONTHS[p.m] + " " + p.y : (str || ""); }

  /* ---------- reusable blocks ---------- */
  function renderMarquee(items) {
    var el = slot("marquee");
    if (!el) return;
    var group = '<div class="marquee-group">' + list(items).map(function (t) {
      return '<span class="marquee-item">' + esc(t) + '</span><span class="marquee-dot"></span>';
    }).join("") + "</div>";
    el.innerHTML = group + group + group + group;
  }

  function renderSlider(name, items) {
    var el = slot(name);
    if (!el) return;
    items = list(items);
    if (!items.length) { el.closest("section").hidden = true; return; }
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
      } else {
        from.classList.remove("is-active"); to.classList.add("is-active");
      }
      i = n;
      dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      if (count) count.textContent = pad(i + 1) + " / " + pad(slides.length);
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 7000); }

    root.addEventListener("click", function (e) {
      var b = e.target.closest(".slider-btn");
      if (b) { go(i + parseInt(b.dataset.dir, 10)); restart(); }
      var d = e.target.closest(".slider-dot");
      if (d) { go(dots.indexOf(d)); restart(); }
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

  /* ---------- shared parts ---------- */
  function renderShared(data) {
    if (data.meta) {
      if (data.meta.title) document.title = data.meta.title;
      var md = $('meta[name="description"]');
      if (md && data.meta.description) md.setAttribute("content", data.meta.description);
    }
    setHTML("nav", list(data.nav).map(function (n) {
      return '<li><a href="' + esc(n.link) + '"' + extAttrs(n.link) + '>' + esc(n.label) + '</a></li>';
    }).join(""));
    setLink("navButton", data.navButton);
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    renderMarquee((data.marquee || {}).items);
  }

  /* ---------- KOMMZ HUB ---------- */
  var projects = [];

  function renderKommz(d) {
    var h = d.hero || {};
    setHTML("hero.lines", list(h.lines).map(function (l) { return '<span class="line"><span>' + esc(l) + '</span></span>'; }).join(""));
    setText("hero.intro", h.intro);
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);
    setImg("hero.image", h.image, h.imageAlt);

    var st = d.statement || {};
    setText("statement.text", st.text);
    setHTML("statement.values", list(st.values).map(function (v) { return "<li>" + esc(v) + "</li>"; }).join(""));

    setHTML("stats", list((d.stats || {}).items).map(function (s) {
      return '<div class="kh-stat"><dt>' + esc(s.label) + '</dt><dd><span class="count" data-to="' + esc(s.value) + '">' + esc(s.value) + '</span>' + esc(s.suffix || "") + '</dd></div>';
    }).join(""));

    var sv = d.services || {};
    setText("services.title", sv.title);
    setText("services.intro", sv.intro);
    setHTML("services.items", list(sv.items).map(function (s, i) {
      return '<article class="kh-hpanel">' +
        (s.image ? '<div class="kh-hpanel-media"><img src="' + esc(s.image) + '" alt="" loading="lazy"></div>' : "") +
        '<span class="kh-hpanel-num">' + pad(i + 1) + '</span>' +
        '<h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></article>';
    }).join(""));

    var band = d.wordmarkBand || {};
    var rows = Math.max(1, Math.min(14, parseInt(band.rows, 10) || 7)), rowHTML = "";
    for (var r = 0; r < rows; r++) {
      var t = rows === 1 ? 0 : r / (rows - 1), c = Math.round(13 + 147 * t);
      var dir = r % 2 === 0 ? 1 : -1;
      rowHTML += '<div class="kh-band-row" style="--row-color: rgb(' + c + ',' + c + ',' + c + ')" data-speed-x="' + (dir * (0.6 + r * 0.08)).toFixed(2) + '"></div>';
    }
    setHTML("wordmarkBand", rowHTML);

    var w = d.work || {};
    setText("work.title", w.title);
    setText("work.intro", w.intro);
    projects = list(w.items);
    var cats = [];
    projects.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
    setHTML("work.filters", '<button class="kh-filter" aria-pressed="true" data-filter="*">All<sup>' + projects.length + '</sup></button>' +
      cats.map(function (c) {
        var n = projects.filter(function (p) { return p.category === c; }).length;
        return '<button class="kh-filter" aria-pressed="false" data-filter="' + esc(c) + '">' + esc(c) + '<sup>' + n + '</sup></button>';
      }).join(""));
    setHTML("work.items", projects.map(function (p, i) {
      return '<button class="kh-card" type="button" data-index="' + i + '" data-cat="' + esc(p.category) + '" data-cursor="View" aria-haspopup="dialog">' +
        '<div class="kh-card-media" data-reveal-img>' +
          (p.category ? '<span class="kh-card-cat">' + esc(p.category) + '</span>' : "") +
          '<img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '" loading="lazy">' +
        '</div>' +
        '<div class="kh-card-body"><div><h3>' + esc(p.title) + '</h3><p class="kh-card-client">' + esc(p.client) + '</p>' +
          '<span class="kh-card-open">Open case study</span></div>' +
          '<span class="kh-card-year">' + esc(p.year) + '</span></div>' +
        '</button>';
    }).join(""));
    initFilters();
    initModal();

    var pr = d.process || {};
    setText("process.title", pr.title);
    setHTML("process.steps", list(pr.steps).map(function (s) {
      return '<li class="kh-step"><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></li>';
    }).join(""));

    var tm = d.team || {};
    setText("team.title", tm.title);
    setText("team.intro", tm.intro);
    setHTML("team.members", list(tm.members).map(function (m) {
      var socials = (m.linkedin ? '<a href="' + esc(m.linkedin) + '" target="_blank" rel="noopener" aria-label="' + esc(m.name) + ' on LinkedIn">' + icon("linkedin") + '</a>' : "") +
        (m.instagram ? '<a href="' + esc(m.instagram) + '" target="_blank" rel="noopener" aria-label="' + esc(m.name) + ' on Instagram">' + icon("instagram") + '</a>' : "");
      return '<article class="kh-member">' +
        '<div class="kh-member-photo" data-reveal-img>' +
          (m.photo ? '<img src="' + esc(m.photo) + '" alt="Portrait of ' + esc(m.name) + '" loading="lazy">'
                   : '<div class="kh-member-initials" aria-hidden="true">' + esc(initials(m.name)) + '<img src="assets/img/kommz-mark-white.svg" alt=""></div>') +
          (socials ? '<div class="kh-member-socials">' + socials + '</div>' : "") +
        '</div>' +
        '<h3>' + esc(m.name) + '</h3><p class="kh-member-role">' + esc(m.role) + '</p>' +
        (m.bio ? '<p class="kh-member-bio">' + esc(m.bio) + '</p>' : "") +
        '</article>';
    }).join(""));

    var ts = d.testimonials || {};
    setText("testimonials.title", ts.title);
    renderSlider("testimonials.items", ts.items);

    var imgs = list((d.gallery || {}).images);
    setHTML("gallery.images", imgs.concat(imgs).map(function (g, i) {
      return '<img src="' + esc(g.src) + '" alt="' + (i < imgs.length ? esc(g.alt) : "") + '" loading="lazy"' + (i >= imgs.length ? ' aria-hidden="true"' : "") + '>';
    }).join(""));

    var cta = d.cta || {};
    setText("cta.title", cta.title);
    setLink("cta.button", cta.button);

    var b = d.booking || {};
    setText("booking.title", b.title);
    setText("booking.intro", b.intro);
    var ct = d.contact || {}, dl = "";
    if (ct.email) dl += '<div><dt>Email</dt><dd><a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a></dd></div>';
    if (ct.phone) dl += '<div><dt>Phone</dt><dd><a href="tel:' + esc(ct.phone.replace(/\s+/g, "")) + '">' + esc(ct.phone) + '</a></dd></div>';
    if (ct.location) dl += '<div><dt>Studio</dt><dd>' + esc(ct.location) + '</dd></div>';
    setHTML("contact", dl);

    setText("footer.note", (d.footer || {}).note);
    setHTML("footer.nav", list(d.nav).map(function (n) { return '<li><a href="' + esc(n.link) + '">' + esc(n.label) + '</a></li>'; }).join(""));
    setHTML("footer.socials", list(ct.socials).map(function (s) {
      return '<li><a href="' + esc(s.link) + '"' + extAttrs(s.link) + '>' + esc(s.name) + '</a></li>';
    }).join("") + (ct.email ? '<li><a href="mailto:' + esc(ct.email) + '">' + esc(ct.email) + '</a></li>' : ""));

    window.Booking.init($("#bookingForm"), b, { buttonClass: "btn-dark", siteName: "Kommz Hub website" });
  }

  function initFilters() {
    var bar = slot("work.filters");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".kh-filter");
      if (!btn) return;
      var f = btn.dataset.filter;
      $$(".kh-filter", bar).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      var cards = $$(".kh-card");
      function apply() {
        cards.forEach(function (c) { c.hidden = !(f === "*" || c.dataset.cat === f); });
        var shown = cards.filter(function (c) { return !c.hidden; });
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

    function fill(i) {
      current = i;
      var p = projects[i];
      bodyEl.innerHTML =
        '<div class="cs-head"><p class="cs-cat">' + esc(p.category) + '</p>' +
        '<h2 class="cs-title" id="modalTitle">' + esc(p.title) + '</h2>' +
        '<p class="cs-meta"><span><strong>Client</strong> ' + esc(p.client) + '</span><span><strong>Year</strong> ' + esc(p.year) + '</span></p></div>' +
        '<img class="cs-hero" src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '">' +
        '<div class="cs-cols">' +
          (p.challenge ? '<div><h3>The challenge</h3><p>' + esc(p.challenge) + '</p></div>' : "") +
          (p.approach ? '<div><h3>What we did</h3><p>' + esc(p.approach) + '</p></div>' : "") +
          (p.result ? '<div><h3>The result</h3><p>' + esc(p.result) + '</p></div>' : "") +
        '</div>' +
        (list(p.services).length ? '<ul class="cs-tags" aria-label="Services">' + list(p.services).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" : "") +
        (list(p.gallery).length ? '<div class="cs-gallery">' + list(p.gallery).map(function (g) { return '<img src="' + esc(g) + '" alt="" loading="lazy">'; }).join("") + "</div>" : "") +
        '<div class="cs-nav">' +
          (p.link ? '<a class="btn btn-dark" href="' + esc(p.link) + '"' + extAttrs(p.link) + '>' + esc(p.linkLabel || "View project") + '</a>' : '<span></span>') +
          (projects.length > 1 ? '<button class="btn btn-ghost-dark" type="button" data-next>Next project</button>' : "") +
        '</div>';
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
        var f = $$('button, a[href], [tabindex]:not([tabindex="-1"])', modal);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---------- THE UP CLOSE ---------- */
  function renderUpclose(d) {
    var h = d.hero || {};
    setText("hero.tagline", h.tagline);
    setText("hero.intro", h.intro);
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);

    var a = d.about || {};
    setText("about.title", a.title);
    setText("about.text", a.text);
    setImg("about.image", a.image, a.imageAlt);

    var tp = d.topics || {};
    setText("topics.title", tp.title);
    setHTML("topics.items", list(tp.items).map(function (t, i) {
      return '<article class="uc-topic"><span class="uc-topic-num">' + pad(i + 1) + '</span><h3>' + esc(t.title) + '</h3><p>' + esc(t.text) + '</p></article>';
    }).join(""));
    if (!list(tp.items).length && $(".uc-topics")) $(".uc-topics").hidden = true;

    var ho = d.host || {};
    setText("host.label", ho.label);
    setHTML("host.name", String(ho.name || "").split(/\s+/).map(function (w) { return "<span>" + esc(w) + "</span>"; }).join(" "));
    setHTML("host.roles", list(ho.roles).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join(""));
    setText("host.bio", ho.bio);
    setImg("host.image", ho.image, ho.imageAlt);

    var ep = d.episodes || {}, listen = d.listen || {}, channel = {};
    list(listen.platforms).forEach(function (p) { channel[String(p.name).toLowerCase()] = p.link; });
    setText("episodes.title", ep.title);
    var items = list(ep.items);
    if (items.length) {
      var e = items[0], p = parseDate(e.date);
      var badge = p ? '<div class="uc-date" aria-label="' + esc(longDate(e.date)) + '"><span class="uc-date-day">' + MONTHS[p.m].toUpperCase() + ' ' + p.d + '<sup>' + ordinal(p.d) + '</sup></span><span class="uc-date-year">' + p.y + '</span></div>' : "";
      var yt = e.youtube || channel.youtube, sp = e.spotify || channel.spotify;
      setHTML("episodes.latest",
        '<article class="uc-latest">' +
          (e.image ? '<figure class="uc-latest-art" data-reveal-img><img src="' + esc(e.image) + '" alt="' + esc(e.imageAlt) + '" loading="lazy"></figure>' : "") +
          '<div data-reveal>' +
            '<div class="uc-latest-top"><p class="uc-latest-kicker">Latest episode' + (e.number ? ", episode " + esc(e.number) : "") + '</p>' + badge + '</div>' +
            '<h3 class="uc-guest-name">' + esc(e.guest) + '</h3>' +
            (e.guestRole ? '<p class="uc-guest-role">' + esc(e.guestRole) + '</p>' : "") +
            (e.topics ? '<p class="uc-guest-topics">' + esc(e.topics) + '</p>' : "") +
            '<div class="uc-theme"><span class="uc-theme-tag">Theme</span><p class="uc-theme-title">' + esc(e.theme) + '</p>' +
              (e.subtitle ? '<p class="uc-theme-sub">' + esc(e.subtitle) + '</p>' : "") +
              '<div class="btn-row">' +
                (yt ? '<a class="btn btn-navy" href="' + esc(yt) + '" target="_blank" rel="noopener">' + icon("youtube") + 'Watch on YouTube</a>' : "") +
                (sp ? '<a class="btn btn-ghost-navy" href="' + esc(sp) + '" target="_blank" rel="noopener">' + icon("spotify") + 'Listen on Spotify</a>' : "") +
              '</div></div>' +
          '</div></article>');
      setHTML("episodes.rest", items.slice(1).map(function (x) {
        var link = x.youtube || x.spotify || channel.youtube;
        return '<li class="uc-episode-row" data-reveal><time datetime="' + esc(x.date) + '">' + esc(longDate(x.date)) + '</time>' +
          '<div><strong>' + esc(x.guest) + '</strong><span>' + esc(x.theme) + (x.subtitle ? ": " + esc(x.subtitle) : "") + '</span></div>' +
          (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">Watch</a>' : "") + '</li>';
      }).join(""));
    }

    var art = d.artwork || {};
    setText("artwork.title", art.title);
    var ai = list(art.images), reps = ai.length ? Math.max(2, Math.ceil(8 / ai.length)) : 0, aHTML = "";
    for (var r = 0; r < reps; r++) {
      aHTML += ai.map(function (g) { return '<img src="' + esc(g.src) + '" alt="' + (r === 0 ? esc(g.alt) : "") + '" loading="lazy"' + (r ? ' aria-hidden="true"' : "") + '>'; }).join("");
    }
    setHTML("artwork.images", aHTML);

    var rv = d.reviews || {};
    setText("reviews.title", rv.title);
    renderSlider("reviews.items", rv.items);

    setText("listen.title", listen.title);
    setText("listen.text", listen.text);
    setText("listen.handle", listen.handle);
    setHTML("listen.platforms", list(listen.platforms).map(function (p) {
      return '<a class="btn btn-navy" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + icon(p.name) + esc(p.name) + '</a>';
    }).join(""));

    var b = d.booking || {};
    setText("booking.title", b.title);
    setText("booking.intro", b.intro);

    var f = d.footer || {};
    var prod = slot("footer.producedBy");
    if (prod) { $("span", prod).textContent = f.producedBy || ""; prod.href = f.producedByLink || "index.html"; }
    var mail = slot("footer.email");
    if (mail && f.email) { mail.textContent = f.email; mail.href = "mailto:" + f.email; }
    setHTML("footer.socials", list(listen.platforms).map(function (p) {
      return '<li><a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.name) + '</a></li>';
    }).join(""));

    window.Booking.init($("#bookingForm"), b, { buttonClass: "btn-gold", siteName: "The Up Close website" });
  }

  /* ---------- navigation ---------- */
  function initNav() {
    var nav = $("#siteNav"), toggle = $(".nav-toggle"), menu = $("#navMenu");
    function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 40); }
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

  /* ---------- loading the JSON ---------- */
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

  function finish() {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    if (window.KHMotion) window.KHMotion.start(PAGE);
  }

  initNav();
  var file = body.dataset.content;
  fetch(file, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      renderShared(data);
      if (PAGE === "kommzhub") renderKommz(data);
      if (PAGE === "upclose") renderUpclose(data);
      finish();
    })
    .catch(function (err) {
      console.error("Content error:", err);
      finish();
      showNotice(file);
    });
})();
