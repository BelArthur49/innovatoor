/* ==========================================================
   MOTION — all scroll and load animation.
   Uses GSAP + ScrollTrigger + Lenis (self-hosted in /assets/vendor).
   If those files are missing, or the visitor's device asks for
   reduced motion, the site stays fully usable with no animation.
   ========================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  var G = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pre = document.querySelector(".preloader");

  if (!G || !ST || reduce) {
    html.classList.add("no-motion");
    if (pre) pre.remove();
    window.KHMotion = { start: function () {}, pause: function () {} };
    return;
  }

  html.classList.add("js-motion");
  G.registerPlugin(ST);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Preloader (starts counting right away) ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem("kh-intro") === "1"; } catch (e) {}
  var count = { v: 0 };
  var countEl = pre && $(".preloader-count", pre), barEl = pre && $(".preloader-bar span", pre);
  function drawCount() {
    if (countEl) countEl.textContent = Math.round(count.v);
    if (barEl) barEl.style.transform = "scaleX(" + count.v / 100 + ")";
  }
  if (pre) {
    G.from($(".preloader-mark", pre), { autoAlpha: 0, y: 20, scale: .9, duration: .8, ease: "power3.out" });
    G.to(count, { v: 88, duration: seen ? .5 : 1.6, ease: "power2.out", onUpdate: drawCount });
  }

  /* ---------- Smooth scrolling ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    if (id === "#main") target.setAttribute("tabindex", "-1"), target.focus({ preventScroll: true });
  });

  /* ---------- Text helpers ---------- */
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true"><span>' + w + "</span></span>"; }).join(" ");
    return $$(".w > span", el);
  }
  function fillWords(el) {
    if (!el || el.dataset.fill) return [];
    el.dataset.fill = "1";
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) { return '<span class="wf" aria-hidden="true">' + w + "</span>"; }).join(" ");
    return $$(".wf", el);
  }

  /* ---------- Shared scroll effects ---------- */
  function common() {
    // Top progress bar
    G.to(".scroll-progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

    // Nav hides on scroll down, returns on scroll up
    var nav = $("#siteNav");
    ST.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        if (document.body.classList.contains("menu-open")) return;
        nav.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400);
      }
    });

    // Headings: words rise out of a mask
    $$(".split").forEach(function (el) {
      var w = splitWords(el);
      G.from(w, { yPercent: 115, rotate: 6, duration: 1.1, stagger: .07, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // Paragraphs that light up word by word as you scroll
    $$(".word-fill").forEach(function (el) {
      var w = fillWords(el);
      G.fromTo(w, { opacity: .14 }, { opacity: 1, stagger: .12, ease: "none",
        scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true } });
    });

    // Generic fade-up blocks
    $$("[data-reveal]").forEach(function (el) {
      G.from(el, { y: 70, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    // Images that wipe open from the bottom and settle
    $$("[data-reveal-img]").forEach(function (el) {
      var img = $("img", el);
      var tl = G.timeline({ scrollTrigger: { trigger: el, start: "top 90%" } });
      tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power4.inOut" });
      if (img) tl.fromTo(img, { scale: 1.4 }, { scale: 1.08, duration: 1.6, ease: "power3.out", clearProps: "transform" }, 0);
    });

    // Horizontal sliding strips
    $$("[data-speed-x]").forEach(function (el) {
      var s = parseFloat(el.dataset.speedX) || 0;
      G.fromTo(el, { x: function () { return s * window.innerWidth * .5; } }, {
        x: function () { return -s * window.innerWidth * .5; }, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: .6, invalidateOnRefresh: true }
      });
    });

    // Marquees: endless loop that speeds up and flips with scroll direction
    $$(".marquee-track").forEach(function (track) {
      var loop = G.to(track, { xPercent: -25, duration: 22, ease: "none", repeat: -1 });
      var skew = G.quickTo(track, "skewX", { duration: .4, ease: "power3" });
      ST.create({
        trigger: track.parentElement, start: "top bottom", end: "bottom top",
        onUpdate: function (self) {
          var v = self.getVelocity();
          G.to(loop, { timeScale: (self.direction === 1 ? 1 : -1) * (1 + Math.min(Math.abs(v) / 250, 6)), duration: .25, overwrite: true });
          G.to(loop, { timeScale: self.direction === 1 ? 1 : -1, duration: 1.2, delay: .25 });
          skew(G.utils.clamp(-12, 12, v / -180));
          G.delayedCall(.2, function () { skew(0); });
        }
      });
    });

    // Sliders fade in as a whole
    $$(".slider").forEach(function (el) {
      G.from(el, { y: 60, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });

    // Booking form fields cascade in
    var form = $("#bookingForm");
    if (form) G.from($$(".field, .form-actions", form), { y: 30, autoAlpha: 0, duration: .8, stagger: .06, ease: "power3.out",
      scrollTrigger: { trigger: form, start: "top 80%" } });

    initCursor();
    initMagnetic();
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var c = $(".cursor");
    if (!c || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var label = $(".cursor-label", c);
    var xTo = G.quickTo(c, "x", { duration: .35, ease: "power3" }), yTo = G.quickTo(c, "y", { duration: .35, ease: "power3" });
    window.addEventListener("mousemove", function (e) { html.classList.add("has-cursor"); xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener("mouseleave", function () { html.classList.remove("has-cursor"); });
    document.addEventListener("mouseover", function (e) {
      var lab = e.target.closest("[data-cursor]");
      var hov = e.target.closest("a, button, input, select, textarea, label");
      c.classList.toggle("is-label", !!lab);
      c.classList.toggle("is-hover", !lab && !!hov);
      label.textContent = lab ? lab.dataset.cursor : "";
    });
  }

  /* ---------- Buttons that lean toward the pointer ---------- */
  function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".btn-lg, .nav-cta, .kh-hero .btn, .uc-hero .btn, .slider-btn").forEach(function (b) {
      var xTo = G.quickTo(b, "x", { duration: .5, ease: "elastic.out(1, .4)" }), yTo = G.quickTo(b, "y", { duration: .5, ease: "elastic.out(1, .4)" });
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .35); yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- KOMMZ HUB ---------- */
  function kommzIntro() {
    var tl = G.timeline();
    tl.from(".kh-hero-media", { scale: 1.35, autoAlpha: 0, duration: 2, ease: "power3.out" }, 0)
      .from(".kh-hero-title .line > span", { yPercent: 115, duration: 1.2, stagger: .12, ease: "power4.out" }, .15)
      .from(".kh-hero-intro", { y: 30, autoAlpha: 0, duration: .9, ease: "power3.out" }, .7)
      .from(".kh-hero-actions .btn", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out" }, .85)
      .from(".site-nav", { yPercent: -100, duration: .9, ease: "power3.out", clearProps: "transform" }, .5)
      .from(".scroll-cue", { autoAlpha: 0, duration: .8 }, 1.2);
    return tl;
  }

  function kommz() {
    // Hero: text drifts apart and fades, microphone pushes in
    var heroTl = G.timeline({ scrollTrigger: { trigger: ".kh-hero", start: "top top", end: "bottom top", scrub: true } });
    heroTl.to(".kh-hero-media", { yPercent: 22, scale: 1.18, ease: "none" }, 0)
      .to(".kh-hero-title .line:nth-child(1)", { xPercent: -12, ease: "none" }, 0)
      .to(".kh-hero-title .line:nth-child(2)", { xPercent: 8, ease: "none" }, 0)
      .to(".kh-hero-title .line:nth-child(3)", { xPercent: -5, ease: "none" }, 0)
      .to(".kh-hero-content", { yPercent: -20, autoAlpha: 0, ease: "none" }, 0)
      .to(".scroll-cue", { autoAlpha: 0, ease: "none" }, 0);

    // Values slide in, numbers count up
    G.from(".kh-values li", { xPercent: 40, autoAlpha: 0, duration: 1, stagger: .12, ease: "power3.out", scrollTrigger: { trigger: ".kh-values", start: "top 85%" } });
    $$(".kh-stat").forEach(function (s, i) {
      var n = $(".count", s), to = parseFloat(n.dataset.to) || 0, o = { v: 0 };
      G.from(s, { y: 50, autoAlpha: 0, duration: .9, delay: i * .1, ease: "power3.out", scrollTrigger: { trigger: ".kh-stats", start: "top 88%" } });
      G.to(o, { v: to, duration: 2.2, delay: i * .1, ease: "power2.out", scrollTrigger: { trigger: ".kh-stats", start: "top 88%" },
        onUpdate: function () { n.textContent = Math.round(o.v); } });
      n.textContent = "0";
    });

    // Services: pinned, scroll sideways on wide screens
    var mm = G.matchMedia();
    mm.add("(min-width: 1000px)", function () {
      var track = $(".kh-hscroll-track");
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var move = G.to(track, { x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: ".kh-hscroll", pin: true, scrub: 1, end: function () { return "+=" + dist(); }, invalidateOnRefresh: true, anticipatePin: 1 } });
      $$(".kh-hpanel").forEach(function (p) {
        var img = $("img", p);
        if (img) G.fromTo(img, { scale: 1.4, xPercent: -10 }, { scale: 1.1, xPercent: 10, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left right", end: "right left", scrub: true } });
        G.from($$("h3, p, .kh-hpanel-num", p), { y: 50, autoAlpha: 0, stagger: .08, duration: .8, ease: "power3.out",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left 85%" } });
      });
    });
    mm.add("(max-width: 999px)", function () {
      $$(".kh-hpanel").forEach(function (p) {
        G.from(p, { y: 70, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 88%" } });
      });
    });

    // Work cards rise in a stagger
    $$(".kh-card").forEach(function (c) {
      G.from($(".kh-card-body", c), { y: 40, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 85%" } });
    });
    G.from(".kh-filter", { y: 20, autoAlpha: 0, stagger: .05, duration: .6, ease: "power3.out", scrollTrigger: { trigger: ".kh-filters", start: "top 90%" } });

    // Process: the line fills and each step lights up in turn
    G.to(".kh-process-line span", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".kh-process-body", start: "top 65%", end: "bottom 60%", scrub: true } });
    $$(".kh-step").forEach(function (s) {
      ST.create({ trigger: s, start: "top 65%", onEnter: function () { s.classList.add("is-active"); }, onLeaveBack: function () { s.classList.remove("is-active"); } });
      G.from($$("h3, p", s), { x: 40, autoAlpha: 0, stagger: .1, duration: .9, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 80%" } });
    });

    // Team: cards climb in, each at its own speed
    $$(".kh-member").forEach(function (m, i) {
      G.from($$("h3, p", m), { y: 30, autoAlpha: 0, stagger: .08, duration: .8, ease: "power3.out", scrollTrigger: { trigger: m, start: "top 85%" } });
      G.to(m, { y: (i % 2 ? -40 : 20), ease: "none", scrollTrigger: { trigger: ".kh-team-grid", start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Gallery photos tilt with scroll
    $$(".kh-gallery-track img").forEach(function (img, i) {
      G.fromTo(img, { y: i % 2 ? 60 : -30 }, { y: i % 2 ? -40 : 50, ease: "none", scrollTrigger: { trigger: ".kh-gallery", start: "top bottom", end: "bottom top", scrub: true } });
    });

    // CTA: headline grows to full size as it reaches the middle
    G.fromTo(".kh-cta-title", { scale: .55, autoAlpha: .15, letterSpacing: "0.02em" }, { scale: 1, autoAlpha: 1, letterSpacing: "-0.05em", ease: "none",
      scrollTrigger: { trigger: ".kh-cta", start: "top bottom", end: "center 55%", scrub: true } });
    G.from('[data-slot="cta.button"]', { y: 40, autoAlpha: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".kh-cta", start: "center 70%" } });

    // Footer: the wordmark rises out of the floor
    G.from(".kh-footer-giant img", { yPercent: 70, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".kh-footer", start: "top 85%", end: "bottom bottom", scrub: true } });
  }

  /* ---------- THE UP CLOSE ---------- */
  function upcloseIntro() {
    var tl = G.timeline();
    tl.from(".uc-hero-bg", { scale: 1.3, autoAlpha: 0, duration: 2, ease: "power3.out" }, 0)
      .from(".uc-hero-logo", { scale: .5, rotate: -8, autoAlpha: 0, duration: 1.2, ease: "back.out(1.6)" }, .1)
      .from(".uc-hero-tagline", { y: 50, autoAlpha: 0, duration: 1, ease: "power3.out" }, .45)
      .from(".uc-hero-intro", { y: 30, autoAlpha: 0, duration: .9, ease: "power3.out" }, .65)
      .from(".uc-hero .btn-row .btn", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out" }, .8)
      .from(".uc-hero-mic img", { xPercent: 60, rotate: 25, autoAlpha: 0, duration: 1.6, ease: "power3.out" }, .3)
      .from(".uc-hero-pattern", { yPercent: 100, duration: 1, ease: "power3.out" }, .6)
      .from(".site-nav", { yPercent: -100, duration: .9, ease: "power3.out", clearProps: "transform" }, .5)
      .from(".scroll-cue", { autoAlpha: 0, duration: .8 }, 1.2);
    return tl;
  }

  function upclose() {
    var heroTl = G.timeline({ scrollTrigger: { trigger: ".uc-hero", start: "top top", end: "bottom top", scrub: true } });
    heroTl.to(".uc-hero-bg", { yPercent: 25, scale: 1.15, ease: "none" }, 0)
      .to(".uc-hero-mic", { yPercent: -35, rotate: -14, ease: "none" }, 0)
      .to(".uc-hero-copy", { yPercent: -18, autoAlpha: 0, ease: "none" }, 0)
      .to(".scroll-cue", { autoAlpha: 0, ease: "none" }, 0);

    // About: gold block wipes in, photo floats
    G.from(".uc-about-block", { scaleX: 0, transformOrigin: "left center", duration: 1.3, ease: "power4.inOut", scrollTrigger: { trigger: ".uc-about-media", start: "top 80%" } });
    G.from(".uc-about-media img", { y: 120, autoAlpha: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".uc-about-media", start: "top 80%" } });
    G.to(".uc-about-block", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".uc-about", start: "top bottom", end: "bottom top", scrub: true } });

    // Topics: cards flip up one after another
    G.from(".uc-topic", { y: 120, rotate: 4, autoAlpha: 0, duration: 1.1, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: ".uc-topic-grid", start: "top 85%" } });

    // Host: tag stretches, name slides in, portrait opens like a curtain
    G.from(".uc-tag", { scaleX: 0, transformOrigin: "left center", duration: .9, ease: "power4.out", scrollTrigger: { trigger: ".uc-host", start: "top 75%" } });
    G.from(".uc-host-name span", { xPercent: -60, autoAlpha: 0, duration: 1.2, stagger: .15, ease: "power4.out", scrollTrigger: { trigger: ".uc-host", start: "top 70%" } });
    G.from(".uc-host-roles li, .uc-host-bio", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".uc-host-roles", start: "top 85%" } });
    G.fromTo(".uc-host-media img", { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.6, ease: "power4.inOut", scrollTrigger: { trigger: ".uc-host-media", start: "top 80%" } });
    G.to(".uc-host-media", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".uc-host", start: "top bottom", end: "bottom top", scrub: true } });

    // Episode date badge pops
    G.from(".uc-date", { scale: 0, rotate: -20, duration: .9, ease: "back.out(2)", scrollTrigger: { trigger: ".uc-latest", start: "top 75%" } });
    G.from(".uc-theme", { y: 60, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".uc-theme", start: "top 90%" } });

    // Listen: platform buttons drop in
    G.from(".uc-platforms .btn", { y: 40, scale: .9, autoAlpha: 0, duration: .8, stagger: .08, ease: "back.out(1.6)", scrollTrigger: { trigger: ".uc-platforms", start: "top 85%" } });
    G.from(".uc-handle", { y: 30, autoAlpha: 0, duration: .8, scrollTrigger: { trigger: ".uc-handle", start: "top 92%" } });

    // Footer logo rises
    G.from(".uc-footer-logo", { y: 80, rotate: -6, autoAlpha: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".uc-footer", start: "top 85%" } });
  }

  /* ---------- Start (called by app.js once the content is on the page) ---------- */
  function start(page) {
    common();
    if (page === "kommzhub") kommz();
    if (page === "upclose") upclose();

    // Keep measurements right as images and fonts arrive
    var t = null;
    function refresh() { clearTimeout(t); t = setTimeout(function () { ST.refresh(); }, 150); }
    $$("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

    var intro = page === "kommzhub" ? kommzIntro : upcloseIntro;
    function reveal() {
      try { sessionStorage.setItem("kh-intro", "1"); } catch (e) {}
      if (lenis) lenis.start();
      intro();
    }
    if (pre) {
      G.timeline()
        .to(count, { v: 100, duration: .45, ease: "power1.inOut", onUpdate: drawCount, overwrite: true })
        .to($(".preloader-inner", pre), { y: -40, autoAlpha: 0, duration: .5, ease: "power2.in" })
        .to(pre, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=.15")
        .add(reveal, "-=.55")
        .add(function () { pre.remove(); ST.refresh(); });
    } else {
      reveal();
    }
  }

  window.KHMotion = {
    start: start,
    pause: function (stop) { if (lenis) { if (stop) lenis.stop(); else lenis.start(); } }
  };
})();
