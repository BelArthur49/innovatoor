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
  function refreshMotion() { if (window.KHMotion && window.KHMotion.refresh) window.KHMotion.refresh(); }
  function initials(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }
  function paras(a, cls) { return arr(a).map(function (p) { return "<p" + (cls ? ' class="' + cls + '"' : "") + ">" + esc(p) + "</p>"; }).join(""); }
  function lines(a) { return arr(a).map(function (l) { return '<span class="hl"><span>' + esc(l) + "</span></span>"; }).join(" "); }

  /* Links: an empty link becomes a visible placeholder that does nothing */
  function linkAttrs(link) {
    link = String(link || "").trim();
    if (!link) return 'href="#" data-placeholder aria-disabled="true" title="Link coming soon"';
    return 'href="' + esc(link) + '"' + (/^https?:\/\//.test(link) ? ' target="_blank" rel="noopener"' : "");
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

  /* ---------- Pictures that may not exist yet ----------
     An image with data-try tries other file endings (.png, .svg, .jpg,
     .JPG, .jpeg, .webp) when the first one is missing. If none exists it
     shows data-final instead, or the person's initials (data-initials). */
  var EXTS = ["png", "svg", "jpg", "JPG", "jpeg", "JPEG", "webp", "PNG"];
  function altSources(src) {
    var m = /^(.*)\.([a-z0-9]+)$/i.exec(src || "");
    if (!m) return [];
    return EXTS.filter(function (e) { return e !== m[2]; }).map(function (e) { return m[1] + "." + e; });
  }
  function smartImg(src, alt, opts) {
    opts = opts || {};
    return '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '"' + (opts.cls ? ' class="' + opts.cls + '"' : "") +
      (opts.lazy === false ? "" : ' loading="lazy"') +
      ' data-try="' + esc(altSources(src).join("|")) + '"' +
      (opts.final ? ' data-final="' + esc(opts.final) + '"' : "") +
      (opts.initials ? ' data-initials="' + esc(opts.initials) + '"' : "") + ">";
  }
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG" || img.dataset.try === undefined) return;
    var rest = img.dataset.try.split("|").filter(Boolean);
    if (rest.length) { img.dataset.try = rest.slice(1).join("|"); img.src = rest[0]; return; }
    delete img.dataset.try;
    if (img.dataset.final) { img.classList.add("is-fallback"); img.src = img.dataset.final; return; }
    if (img.dataset.initials) {
      var div = document.createElement("div");
      div.className = "kh-member-initials"; div.setAttribute("aria-hidden", "true");
      div.innerHTML = esc(img.dataset.initials) + '<img src="assets/img/kommz-mark-white.svg" alt="">';
      img.replaceWith(div);
    }
  }, true);

  /* Finds which numbered photos exist: prefix1.jpg, prefix2.jpg ... */
  var PROBE_EXTS = ["jpg", "JPG", "jpeg", "JPEG", "png", "PNG", "webp"];
  function probeOne(base) {
    return new Promise(function (resolve) {
      var k = 0;
      (function next() {
        if (k >= PROBE_EXTS.length) return resolve(null);
        var src = base + "." + PROBE_EXTS[k++], im = new Image();
        im.onload = function () { resolve(src); };
        im.onerror = next;
        im.src = src;
      })();
    });
  }
  function probeSeries(prefix, count) {
    var jobs = [];
    for (var i = 1; i <= count; i++) jobs.push(probeOne(prefix + i));
    return Promise.all(jobs).then(function (r) { return r.filter(Boolean); });
  }

  var ICONS = {
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 9.5c3.5-1 7.3-.7 10 .9M7.6 12.7c2.9-.8 5.8-.5 8.1.8M8.3 15.7c2.2-.6 4.3-.4 6 .6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.5 2.3-2.5S16 11.4 16 13v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    vimeo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5l1 1.3c1-.7 1.6-1 1.8-.6.6 1.2 1.6 6.9 2.9 8.1 1.4 1.2 3.4-.6 6-4.1 2.6-3.5 3.6-6.4 3.3-7.6-.4-1.6-3.9-1.5-5.3 1.4 1.7-.6 2.6.3 1.7 2.1-.9 1.9-2.2 3.4-2.7 3.4s-1.1-3.4-1.7-6C9.4 4 7.4 4.5 3 8.5z" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 6l1.5-2h5L16 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14l4-4M9 7h-1a5 5 0 0 0 0 10h1M15 7h1a5 5 0 0 1 0 10h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  function icon(name) { return ICONS[String(name || "").toLowerCase()] || ICONS.link; }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; }
  function parseDate(str) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function longDate(str) { var p = parseDate(str); return p ? p.d + " " + MONTHS[p.m] + " " + p.y : (str || ""); }

  /* Any picture slot can take a video: a path ending in .mp4, .webm or .mov
     is shown as a silent, looping video that plays while it is on screen. */
  function isVideo(src) { return /\.(mp4|webm|mov)(\?.*)?$/i.test(src || ""); }
  function mediaTag(src, alt) {
    if (!src) return "";
    if (isVideo(src)) return '<video src="' + esc(src) + '" muted loop playsinline preload="metadata" data-autoplay aria-hidden="true"></video>';
    return '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy">';
  }
  function initAutoVideos(root) {
    var vids = $$("video[data-autoplay]", root);
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; });
    if (!("IntersectionObserver" in window)) { vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); }
        else en.target.pause();
      });
    }, { threshold: .2 });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ---------- reusable blocks ---------- */
  function renderMarquee(items) {
    var el = slot("marquee");
    if (!el || !list(items).length) return;
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

  /* =========================================================
     KOMMZ HUB HOMEPAGE
     ========================================================= */
  function renderHeroVideo(h) {
    var v = slot("hero.video");
    if (!v) return;
    var ov = parseFloat(h.overlay);
    $(".kh-hero").style.setProperty("--overlay", isNaN(ov) ? 0 : Math.max(0, Math.min(.9, ov)));
    if (h.poster) v.setAttribute("poster", h.poster);
    var src = "";
    if (h.video) src += '<source src="' + esc(h.video) + '"' + (/\.mp4$/i.test(h.video) ? ' type="video/mp4"' : /\.webm$/i.test(h.video) ? ' type="video/webm"' : "") + ">";
    if (h.videoFallback) src += '<source src="' + esc(h.videoFallback) + '">';
    v.innerHTML = src;
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
    v.controls = false; v.removeAttribute("controls");
    v.setAttribute("playsinline", ""); v.setAttribute("autoplay", "");
    if (!src) return;
    v.load();
    // Keep trying to start the muted video: as soon as it can play, on the
    // visitor's first scroll or tap (if the browser blocked autoplay), and
    // when they come back to the tab or scroll back to the top.
    function tryPlay() {
      if (!v.paused) return;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    tryPlay();
    ["loadedmetadata", "canplay"].forEach(function (ev) { v.addEventListener(ev, tryPlay); });
    ["touchstart", "pointerdown", "pointermove", "scroll", "wheel", "click", "keydown"].forEach(function (ev) { window.addEventListener(ev, tryPlay, { once: true, passive: true }); });
    document.addEventListener("kh:revealed", tryPlay);
    v.addEventListener("pause", function () { if (!document.hidden) setTimeout(tryPlay, 300); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) tryPlay(); }).observe(v);
    }
    var btn = $(".kh-sound");
    if (btn && h.soundButton) {
      v.addEventListener("loadeddata", function () { btn.hidden = false; }, { once: true });
      btn.addEventListener("click", function () {
        v.muted = !v.muted;
        if (!v.muted) tryPlay();
        btn.setAttribute("aria-pressed", String(!v.muted));
        $(".kh-sound-label", btn).textContent = v.muted ? "Sound on" : "Sound off";
      });
    }
  }

  function renderClientLogos(cl) {
    var items = list(cl.items);
    var el = slot("clientMarquee");
    if (el) {
      var mq = el.closest(".marquee");
      if (!items.length) mq.hidden = true;
      else {
        mq.classList.toggle("is-mono", cl.monochrome !== false);
        var chips = function (hidden) {
          return '<div class="marquee-group"' + (hidden ? ' aria-hidden="true"' : "") + ">" + items.map(function (c) {
            return '<span class="client-chip">' + smartImg(c.logo, hidden ? "" : c.name, { final: "assets/img/kommz-mark-white.svg", lazy: false }) +
              '</span><span class="marquee-dot" aria-hidden="true"></span>';
          }).join("") + "</div>";
        };
        el.innerHTML = chips(false) + chips(true) + chips(true) + chips(true);
      }
    }
  }

  function renderServices(sv) {
    setHTML("services.heading", lines(sv.heading));
    setHTML("services.intro", paras(sv.intro));
    var items = list(sv.items);
    var card = setHTML("services.items", items.map(function (s, i) {
      return '<div class="kh-svc">' +
        '<h3 class="kh-svc-head"><button class="kh-svc-toggle" type="button" id="svc-btn-' + i + '" aria-expanded="false" aria-controls="svc-panel-' + i + '">' +
          '<span class="kh-svc-num">' + pad(i + 1) + "</span>" +
          '<span class="kh-svc-titles"><span class="kh-svc-title">' + esc(s.title) + '</span><span class="kh-svc-headline">' + esc(s.headline) + "</span></span>" +
          '<span class="kh-svc-icon" aria-hidden="true"></span>' +
        "</button></h3>" +
        '<div class="kh-svc-panel" id="svc-panel-' + i + '" role="region" aria-labelledby="svc-btn-' + i + '" inert><div>' +
          '<div class="kh-svc-body">' +
            '<div class="kh-svc-main"><div class="kh-svc-text">' + paras(s.text) + "</div>" + linkHTML(s.button, "btn btn-light") + "</div>" +
            '<div class="kh-svc-side">' +
              (s.image ? '<div class="kh-svc-media">' + mediaTag(s.image, "") + "</div>" : "") +
              (list(s.list).length ? '<p class="kh-svc-listlabel">' + esc(sv.listLabel || "Our services include") + '</p><ul class="kh-svc-list">' +
                list(s.list).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
            "</div>" +
          "</div>" +
        "</div></div>" +
      "</div>";
    }).join(""));
    if (!card) return;

    // One open at a time. Clicking the open one closes it, leaving all closed.
    function setOpen(row, open) {
      row.classList.toggle("is-open", open);
      $(".kh-svc-toggle", row).setAttribute("aria-expanded", String(open));
      $(".kh-svc-panel", row).inert = !open;
    }
    card.addEventListener("click", function (e) {
      var btn = e.target.closest(".kh-svc-toggle");
      if (!btn) return;
      var row = btn.closest(".kh-svc"), willOpen = !row.classList.contains("is-open");
      $$(".kh-svc", card).forEach(function (r) { if (r !== row) setOpen(r, false); });
      setOpen(row, willOpen);
      setTimeout(function () {
        refreshMotion();
        if (willOpen) {
          var top = row.getBoundingClientRect().top;
          if (top < 80 || top > window.innerHeight * .7) {
            if (window.KHMotion && window.KHMotion.scrollTo) window.KHMotion.scrollTo(row, true);
            else row.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 600);
    });
  }

  /* ---------- OUR WORK: one video card, one photo card ---------- */
  var work = { items: [], galleryPromise: null };
  function vimeoEmbed(url) {
    var m = /vimeo\.com\/showcase\/(\d+)/.exec(url || "");
    if (m) return "https://vimeo.com/showcase/" + m[1] + "/embed";
    m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url || "");
    if (m) return "https://player.vimeo.com/video/" + m[1] + "?dnt=1";
    m = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(url || "");
    if (m) return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0";
    return "";
  }
  function galleryImages(p) {
    if (!work.galleryPromise) {
      work.galleryPromise = probeSeries(p.galleryPrefix || "assets/img/gallery", Math.max(0, Math.min(200, parseInt(p.galleryCount, 10) || 20)))
        .then(function (found) { return found.length ? found : list(p.fallbackImages); });
    }
    return work.galleryPromise;
  }

  function renderWork(w) {
    setHTML("work.heading", lines(w.heading));
    work.items = list(w.items);
    var grid = setHTML("work.items", work.items.map(function (p, i) {
      var isVid = p.type === "video";
      var cover = p.cover
        ? mediaTag(p.cover, p.coverAlt)
        : '<div class="kh-cover" aria-hidden="true"><span class="kh-cover-title">' + esc(p.title) + '</span><img src="assets/img/kommz-mark-white.svg" alt=""></div>';
      return '<article class="kh-card" data-index="' + i + '" data-type="' + esc(p.type) + '" data-cursor="' + (isVid ? "Watch" : "View") + '">' +
        '<div class="kh-card-media" data-reveal-img>' + cover +
          '<span class="kh-card-type">' + (isVid ? icon("play") + "Video" : icon("camera") + "Photos") + "</span>" +
          (isVid ? '<span class="kh-card-play" aria-hidden="true">' + icon("play") + "</span>" : '<span class="kh-card-count" hidden></span>') +
        "</div>" +
        '<div class="kh-card-body">' +
          "<h3>" + esc(p.title) + "</h3>" +
          (p.subtitle ? '<p class="kh-card-sub">' + esc(p.subtitle) + "</p>" : "") +
          (p.summary ? '<p class="kh-card-summary">' + esc(p.summary) + "</p>" : "") +
          '<button class="btn btn-ghost-light kh-card-btn" type="button" aria-haspopup="dialog">' + esc(p.buttonLabel || (isVid ? "Watch" : "View gallery")) + "</button>" +
        "</div></article>";
    }).join(""));
    if (!grid) return;
    initAutoVideos(grid);

    // Photo card: find the gallery photos once the visitor gets near the section
    work.items.forEach(function (p, i) {
      if (p.type !== "photo") return;
      var card = $('.kh-card[data-index="' + i + '"]', grid);
      function load() {
        galleryImages(p).then(function (imgs) {
          var badge = $(".kh-card-count", card);
          if (imgs.length) { badge.textContent = imgs.length + (imgs.length === 1 ? " photo" : " photos"); badge.hidden = false; }
          if (!p.cover && imgs.length) {
            var cv = $(".kh-cover", card);
            if (cv) { var im = document.createElement("img"); im.src = imgs[0]; im.alt = p.coverAlt || ""; cv.replaceWith(im); }
          }
        });
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: "800px 0px" });
        io.observe(card);
      } else load();
    });

    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".kh-card");
      if (!card) return;
      var p = work.items[parseInt(card.dataset.index, 10)];
      if (p.type === "photo") galleryImages(p).then(function (imgs) { openLightbox(imgs, 0, p.title); });
      else openVideo(p);
    });
    initModal();
    initLightbox();
  }

  /* ---------- Video window ---------- */
  var modal = null;
  function initModal() {
    var el = $("#projectModal");
    if (!el || modal) return;
    modal = { el: el, body: $(".modal-body", el), panel: $(".modal-panel", el), last: null };
    el.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeVideo(); });
    document.addEventListener("keydown", function (e) {
      if (el.hidden) return;
      if (e.key === "Escape") closeVideo();
      if (e.key === "Tab") {
        var f = $$('button, a[href], iframe, [tabindex]:not([tabindex="-1"])', el);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  function openVideo(p) {
    if (!modal) return;
    modal.last = document.activeElement;
    var embed = vimeoEmbed(p.vimeoUrl || p.videoUrl);
    modal.body.innerHTML =
      '<div class="cs-head"><p class="cs-cat">' + esc(p.subtitle || "") + '</p><h2 class="cs-title" id="modalTitle">' + esc(p.title) + "</h2></div>" +
      (embed ? '<div class="cs-video"><iframe src="' + esc(embed) + '" title="' + esc(p.title) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>'
             : '<div class="cs-video"><p style="position:absolute;inset:0;display:grid;place-items:center;color:#aaa">Video coming soon</p></div>') +
      '<div class="cs-actions"><p class="cs-note">' + esc(p.summary || "") + "</p>" +
        ((p.vimeoUrl || p.videoUrl) ? '<a class="btn btn-dark" ' + linkAttrs(p.vimeoUrl || p.videoUrl) + ">" + icon("vimeo") + esc(p.linkLabel || "Watch on Vimeo") + "</a>" : "") +
      "</div>";
    modal.el.hidden = false;
    document.documentElement.classList.add("modal-lock");
    if (window.KHMotion) window.KHMotion.pause(true);
    if (motionOn()) {
      window.gsap.fromTo($(".modal-backdrop", modal.el), { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
      window.gsap.fromTo(modal.panel, { yPercent: 12, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .6, ease: "power3.out" });
    }
    modal.panel.focus();
  }
  function closeVideo() {
    if (!modal || modal.el.hidden) return;
    $$("iframe, video", modal.body).forEach(function (m) { if (m.tagName === "VIDEO") m.pause(); else m.src = "about:blank"; });
    modal.body.innerHTML = "";
    modal.el.hidden = true;
    document.documentElement.classList.remove("modal-lock");
    if (window.KHMotion) window.KHMotion.pause(false);
    if (modal.last) modal.last.focus();
  }

  /* ---------- Full-screen photo gallery ---------- */
  var lb = null;
  function initLightbox() {
    var el = $("#lightbox");
    if (!el || lb) return;
    lb = { el: el, img: $(".lb-img", el), cap: $(".lb-caption", el), count: $(".lb-count", el), thumbs: $(".lb-thumbs", el), images: [], i: 0, title: "", last: null };
    function show(n) {
      if (!lb.images.length) return;
      lb.i = (n + lb.images.length) % lb.images.length;
      if (motionOn()) window.gsap.fromTo(lb.img, { autoAlpha: 0, scale: .97 }, { autoAlpha: 1, scale: 1, duration: .45, ease: "power2.out" });
      lb.img.src = lb.images[lb.i];
      lb.img.alt = lb.title + ", photo " + (lb.i + 1);
      lb.count.textContent = (lb.i + 1) + " / " + lb.images.length;
      $$(".lb-thumb", lb.thumbs).forEach(function (t, k) {
        t.setAttribute("aria-current", k === lb.i ? "true" : "false");
        if (k === lb.i) t.scrollIntoView({ block: "nearest", inline: "center" });
      });
      [lb.i + 1, lb.i - 1].forEach(function (k) { var pre = new Image(); pre.src = lb.images[(k + lb.images.length) % lb.images.length]; });
    }
    lb.show = show;
    lb.close = function () {
      el.hidden = true;
      if (!modal || modal.el.hidden) {
        document.documentElement.classList.remove("modal-lock");
        if (window.KHMotion) window.KHMotion.pause(false);
      }
      if (lb.last) lb.last.focus();
    };
    $(".lb-prev", el).addEventListener("click", function () { show(lb.i - 1); });
    $(".lb-next", el).addEventListener("click", function () { show(lb.i + 1); });
    $(".lb-close", el).addEventListener("click", lb.close);
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.classList.contains("lb-stage")) lb.close();
      var t = e.target.closest(".lb-thumb"); if (t) show(parseInt(t.dataset.i, 10));
    });
    document.addEventListener("keydown", function (e) {
      if (el.hidden) return;
      if (e.key === "Escape") lb.close();
      if (e.key === "ArrowRight") show(lb.i + 1);
      if (e.key === "ArrowLeft") show(lb.i - 1);
    });
    var sx = null;
    el.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) show(lb.i + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }
  function openLightbox(images, start, title) {
    if (!lb) return;
    lb.images = images || []; lb.title = title || ""; lb.last = document.activeElement;
    lb.cap.textContent = lb.title;
    lb.thumbs.innerHTML = lb.images.map(function (g, k) {
      return '<button type="button" class="lb-thumb" data-i="' + k + '" aria-label="Photo ' + (k + 1) + '"><img src="' + esc(g) + '" alt="" loading="lazy"></button>';
    }).join("");
    $$(".lb-nav", lb.el).forEach(function (b) { b.hidden = lb.images.length < 2; });
    if (!lb.images.length) { lb.img.removeAttribute("src"); lb.img.alt = ""; lb.count.textContent = ""; lb.cap.textContent = "Photos coming soon."; }
    lb.el.hidden = false;
    document.documentElement.classList.add("modal-lock");
    if (window.KHMotion) window.KHMotion.pause(true);
    if (motionOn()) window.gsap.fromTo(lb.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
    lb.show(start || 0);
    $(".lb-close", lb.el).focus();
  }

  /* ---------- Team: sliding portraits, click one for the full bio ---------- */
  var team = [];
  function renderTeam(t) {
    setText("team.heading", t.heading);
    setHTML("team.intro", paras(t.intro));
    team = (t.founder && t.founder.name ? [t.founder] : []).concat(list(t.members));
    function photo(m) {
      return m.photo ? smartImg(m.photo, "Portrait of " + m.name, { initials: initials(m.name) })
        : '<div class="kh-member-initials" aria-hidden="true">' + esc(initials(m.name)) + '<img src="assets/img/kommz-mark-white.svg" alt=""></div>';
    }
    var track = setHTML("team.members", team.map(function (m, i) {
      return '<button type="button" class="kh-tcard" role="listitem" data-i="' + i + '" data-cursor="Bio" aria-haspopup="dialog" aria-label="' + esc(m.name) + ", " + esc(m.role) + '. Read bio">' +
        '<span class="kh-tcard-photo">' + photo(m) + "</span>" +
        '<span class="kh-tcard-info"><span class="kh-tcard-name">' + esc(m.name) + '</span><span class="kh-tcard-role">' + esc(m.role) + "</span>" +
        '<span class="kh-tcard-more">Read bio <span aria-hidden="true">+</span></span></span>' +
      "</button>";
    }).join(""));
    if (!track) return;
    initModal();

    var prev = $(".kh-team-prev"), next = $(".kh-team-next"), bar = $(".kh-team-progress span");
    function step() { var c = $(".kh-tcard", track); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 300; }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 1;
      if (bar) bar.style.transform = "scaleX(" + Math.max(.08, Math.min(1, (track.clientWidth / track.scrollWidth) + p * (1 - track.clientWidth / track.scrollWidth))) + ")";
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
      $(".kh-team-controls").hidden = max <= 4;
    }
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); track.scrollBy({ left: step(), behavior: "smooth" }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: -step(), behavior: "smooth" }); }
    });
    // Drag with the mouse on computers (phones swipe natively)
    // A real drag only starts after the mouse moves 6px, so a normal click
    // always reaches the portrait and opens the bio.
    var drag = null, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: track.scrollLeft }; moved = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!drag) return;
      drag = null;
      if (moved) setTimeout(function () { track.classList.remove("is-dragging"); moved = false; }, 0);
    });
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });
    track.addEventListener("click", function (e) {
      var card = e.target.closest(".kh-tcard");
      if (!card || track.classList.contains("is-dragging")) return;
      openBio(team[parseInt(card.dataset.i, 10)]);
    });
    update();
    setTimeout(update, 400);
  }

  // Uses the photo the portrait card already loaded, so the window shows it
  // straight away instead of searching for the file again (that flickered).
  function bioPhoto(m) {
    var i = team.indexOf(m);
    var cardImg = $('.kh-tcard[data-i="' + i + '"] .kh-tcard-photo > img');
    if (cardImg && cardImg.complete && cardImg.naturalWidth > 0) {
      return '<img src="' + esc(cardImg.currentSrc || cardImg.src) + '" alt="Portrait of ' + esc(m.name) + '">';
    }
    return '<div class="kh-member-initials" aria-hidden="true">' + esc(initials(m.name)) + '<img src="assets/img/kommz-mark-white.svg" alt=""></div>';
  }

  function openBio(m) {
    if (!modal || !m) return;
    modal.last = document.activeElement;
    function socials() {
      return (m.linkedin ? '<a class="btn btn-ghost-dark" href="' + esc(m.linkedin) + '" target="_blank" rel="noopener">' + icon("linkedin") + "LinkedIn</a>" : "") +
        (m.instagram ? '<a class="btn btn-ghost-dark" href="' + esc(m.instagram) + '" target="_blank" rel="noopener">' + icon("instagram") + "Instagram</a>" : "");
    }
    modal.body.innerHTML =
      '<div class="kh-bio">' +
        '<div class="kh-bio-photo">' + bioPhoto(m) + "</div>" +
        '<div class="kh-bio-text"><p class="cs-cat">' + esc(m.role) + '</p><h2 class="cs-title" id="modalTitle">' + esc(m.name) + "</h2>" +
          '<div class="kh-bio-paras">' + paras(m.bio) + "</div>" +
          (socials() ? '<div class="btn-row kh-bio-socials">' + socials() + "</div>" : "") +
        "</div>" +
      "</div>";
    modal.el.hidden = false;
    document.documentElement.classList.add("modal-lock");
    if (window.KHMotion) window.KHMotion.pause(true);
    if (motionOn()) {
      window.gsap.fromTo($(".modal-backdrop", modal.el), { autoAlpha: 0 }, { autoAlpha: 1, duration: .35 });
      window.gsap.fromTo(modal.panel, { yPercent: 12, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .6, ease: "power3.out" });
      window.gsap.from(".kh-bio-text > *", { opacity: 0, duration: .5, stagger: .05, delay: .2, ease: "power1.out" });
    }
    modal.panel.scrollTop = 0;
    modal.panel.focus();
  }

  function renderKommz(d) {
    var h = d.hero || {};
    setHTML("hero.lines", arr(h.lines).map(function (l) { return '<span class="line"><span>' + esc(l) + "</span></span>"; }).join(""));
    setHTML("hero.paragraphs", paras(h.paragraphs));
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);
    renderHeroVideo(h);

    renderClientLogos(d.clientLogos || {});
    renderServices(d.services || {});

    var band = d.wordmarkBand || {};
    var rows = Math.max(1, Math.min(14, parseInt(band.rows, 10) || 4)), rowHTML = "";
    for (var r = 0; r < rows; r++) {
      var t = rows === 1 ? 0 : r / (rows - 1), c = Math.round(13 + 147 * t);
      rowHTML += '<div class="kh-band-row" style="--row-color: rgb(' + c + ',' + c + ',' + c + ')" data-speed-x="' + ((r % 2 ? -1 : 1) * (0.6 + r * 0.08)).toFixed(2) + '"></div>';
    }
    setHTML("wordmarkBand", rowHTML);

    renderWork(d.work || {});
    renderTeam(d.team || {});

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
    setHTML("footer.company", "<strong>" + esc(f.company) + "</strong><span>" + esc(f.tagline) + "</span><span>" + esc(f.location) + "</span>");
    setHTML("footer.quickLinks", list(f.quickLinks).map(function (l) { return "<li>" + linkHTML(l, "") + "</li>"; }).join(""));
    setHTML("footer.socials", socialList(f.socials, false));
    setHTML("footer.legal", list(f.legal).map(function (l) { return "<li>" + linkHTML(l, "") + "</li>"; }).join(""));
    footerBase({ copyright: f.copyright, credit: f.credit }, "Kommz Hub Ltd.");

    initAutoVideos(document);
  }

  /* =========================================================
     THE UP CLOSE PAGE
     ========================================================= */
  function renderUpclose(d) {
    var h = d.hero || {};
    setText("hero.tagline", h.tagline);
    setText("hero.intro", h.intro);
    setLink("hero.primaryButton", h.primaryButton);
    setLink("hero.secondaryButton", h.secondaryButton);

    var a = d.about || {};
    setText("about.title", a.title);
    setText("about.text", a.text);
    var ai0 = slot("about.image");
    if (ai0 && a.image) {
      if (isVideo(a.image)) { var vtmp = document.createElement("div"); vtmp.innerHTML = mediaTag(a.image, ""); ai0.replaceWith(vtmp.firstChild); }
      else { ai0.src = a.image; ai0.alt = a.imageAlt || ""; }
    }

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

    initAutoVideos(document);
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
  fetch(file, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(file + " " + r.status); return r.json(); })
    .then(function (data) {
      renderShared(data);
      if (PAGE === "kommzhub") renderKommz(data);
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
