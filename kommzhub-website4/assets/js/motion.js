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
  var introEl = document.querySelector(".intro");

  if (!G || !ST || reduce) {
    html.classList.add("no-motion");
    if (pre) pre.remove();
    if (introEl) introEl.remove();
    window.KHMotion = {
      start: function () {}, pause: function () {}, refresh: function () {},
      scrollTo: function (el, smooth) { el.scrollIntoView(smooth ? { behavior: "smooth" } : undefined); }
    };
    return;
  }

  html.classList.add("js-motion");
  G.registerPlugin(ST);
  // Phones resize the window while scrolling (the address bar hides);
  // re-measuring then is what made sections get stuck.
  ST.config({ ignoreMobileResize: true });

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Cinematic logo intro (homepage) ----------
     Light beams rise and rush into the centre, the KH mark appears out of a
     flash, a light sweeps across it, the name rises underneath, then the
     mark zooms through the screen into the website. The full version plays
     on the first visit of a browser session; later visits get a short one. */
  var introExit = null;
  if (introEl) (function () {
    var full = true;
    try { full = sessionStorage.getItem("kh-logo-intro") !== "1"; } catch (e) {}
    var beamsBox = $(".intro-beams", introEl), mark = $(".intro-mark", introEl), markImg = $(".intro-mark > img", introEl);
    var word = $(".intro-word", introEl), shine = $(".intro-shine span", introEl), glow = $(".intro-glow", introEl);
    var skip = $(".intro-skip", introEl);
    var shades = ["#FFFFFF", "#A0A0A0", "#5A5A5A", "#D9D9D9", "#7A7A7A"];
    var h = "";
    for (var i = 0; i < 17; i++) {
      var pos = 22 + (i * 56 / 16) + ((i * 37) % 7 - 3) * .6;
      h += '<span style="left:' + pos.toFixed(2) + '%;width:' + (2 + ((i * 53) % 11)) + 'px;background:' + shades[i % shades.length] + '"></span>';
    }
    beamsBox.innerHTML = h;
    var beams = $$("span", beamsBox);

    var ready = false, queued = null;
    var tl = G.timeline({ onComplete: function () { ready = true; if (queued) queued(); } });
    if (full) {
      tl.set(beams, { autoAlpha: 1, scaleY: 0 })
        .to(beams, { scaleY: 1, duration: .8, ease: "expo.out", stagger: { each: .035, from: "center" } })
        .to(beams, {
          x: function (k, el) { var r = el.getBoundingClientRect(); return window.innerWidth / 2 - (r.left + r.width / 2); },
          scaleX: .2, duration: .65, ease: "expo.in", stagger: { each: .02, from: "edges" }
        }, "-=.25")
        .to(glow, { autoAlpha: 1, duration: .25, ease: "power2.out" }, "-=.15")
        .set(beams, { autoAlpha: 0 })
        .fromTo(mark, { autoAlpha: 0, scale: 1.7, filter: "blur(22px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "expo.out" }, "<")
        .fromTo(markImg, { filter: "brightness(.5)" }, { filter: "brightness(1)", duration: 1.2, ease: "power2.out" }, "<+.2")
        .to(glow, { autoAlpha: 0, scale: 1.4, duration: 1, ease: "power2.out" }, "<")
        .to(shine, { x: "380%", duration: .9, ease: "power2.inOut" }, "<+.35")
        .fromTo(word, { autoAlpha: 0, y: 24, clipPath: "inset(0 0 100% 0)" }, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: .8, ease: "power3.out" }, "<+.25")
        .to({}, { duration: .35 });
      G.from(skip, { autoAlpha: 0, duration: .6, delay: .8 });
    } else {
      G.set(skip, { autoAlpha: 0 });
      tl.fromTo(mark, { autoAlpha: 0, scale: 1.15, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: .6, ease: "expo.out" })
        .fromTo(word, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, ease: "power3.out" }, "<+.15");
    }

    function skipNow() { if (!ready) tl.progress(1); }
    skip.addEventListener("click", skipNow);
    document.addEventListener("keydown", function onKey(e) {
      if (!introEl.isConnected) return document.removeEventListener("keydown", onKey);
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skipNow();
    });

    introExit = function (after) {
      function go() {
        try { sessionStorage.setItem("kh-logo-intro", "1"); } catch (e) {}
        G.timeline()
          .to([word, skip], { autoAlpha: 0, y: -12, duration: .3, ease: "power2.in" })
          .to(mark, { scale: 16, duration: 1.15, ease: "expo.in" }, "-=.1")
          .to(introEl, { autoAlpha: 0, duration: .55, ease: "power2.out" }, "-=.4")
          .add(after, "-=.55")
          .add(function () { introEl.remove(); refresh(); });
      }
      if (ready) go(); else queued = go;
    };
  })();

  /* ---------- Preloader (The Up Close page) ---------- */
  var count = { v: 0 };
  var countEl = pre && $(".preloader-count", pre), barEl = pre && $(".preloader-bar span", pre);
  function drawCount() {
    if (countEl) countEl.textContent = Math.round(count.v);
    if (barEl) barEl.style.transform = "scaleX(" + count.v / 100 + ")";
  }
  if (pre) {
    var seen = false;
    try { seen = sessionStorage.getItem("kh-intro") === "1"; } catch (e) {}
    G.from($(".preloader-mark", pre), { autoAlpha: 0, y: 20, scale: .9, duration: .8, ease: "power3.out" });
    G.to(count, { v: 88, duration: seen ? .5 : 1.6, ease: "power2.out", onUpdate: drawCount });
  }

  /* ---------- Smooth scrolling ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on("scroll", ST.update);
    ST.addEventListener("refresh", function () { lenis.resize(); });
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href*='#']");
    if (!a || !lenis || a.hasAttribute("data-placeholder")) return;
    if (a.pathname !== location.pathname || a.host !== location.host) return;
    var id = a.hash;
    if (!id || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: id === "#top" ? 0 : -70, duration: 1.4 });
  });

  /* Re-measure scroll animations only while the page is still. Measuring
     in the middle of a smooth scroll records wrong positions. */
  var refreshTimer = null;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      if (lenis && lenis.isScrolling) return refresh();
      ST.refresh();
    }, 250);
  }

  /* Scroll-linked animation driven straight by the scroll position.
     Used for the opening banners: nothing is measured, so they always
     return to their starting look when you scroll back to the top. */
  function scrollLinked(section, build) {
    var el = $(section);
    if (!el) return;
    var tl = G.timeline({ paused: true });
    build(tl);
    function update() {
      var h = el.offsetHeight || window.innerHeight;
      tl.progress(Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset || 0) / h)));
    }
    G.ticker.add(update);
    update();
  }

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
    G.to(".scroll-progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

    // Nav hides on scroll down, returns on scroll up
    var nav = $("#siteNav"), lastY = window.scrollY;
    if (nav) window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      if (!document.body.classList.contains("menu-open")) nav.classList.toggle("is-hidden", y > lastY && y > 400);
      lastY = y;
    }, { passive: true });

    $$(".split").forEach(function (el) {
      G.from(splitWords(el), { yPercent: 115, rotate: 6, duration: 1.1, stagger: .07, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".kh-stacked").forEach(function (el) {
      G.from($$(".hl > span", el), { yPercent: 115, duration: 1.1, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$(".word-fill").forEach(function (el) {
      G.fromTo(fillWords(el), { opacity: .14 }, { opacity: 1, stagger: .12, ease: "none", scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true } });
    });
    $$("[data-reveal]").forEach(function (el) {
      G.from(el, { y: 70, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$("[data-reveal-img]").forEach(function (el) {
      var media = $("img, video", el);
      var tl = G.timeline({ scrollTrigger: { trigger: el, start: "top 90%" } });
      tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power4.inOut" });
      if (media) tl.fromTo(media, { scale: 1.35 }, { scale: 1.08, duration: 1.6, ease: "power3.out", clearProps: "transform" }, 0);
    });
    $$("[data-speed-x]").forEach(function (el) {
      var s = parseFloat(el.dataset.speedX) || 0;
      G.fromTo(el, { x: function () { return s * window.innerWidth * .5; } }, {
        x: function () { return -s * window.innerWidth * .5; }, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
      });
    });
    // Marquees: one steady, endless slide (no shaking or slanting while scrolling)
    $$(".marquee-track").forEach(function (track) {
      G.to(track, { xPercent: -25, duration: 32, ease: "none", repeat: -1 });
    });
    $$(".slider").forEach(function (el) {
      G.from(el, { y: 60, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    var form = $("#bookingForm");
    if (form) G.from($$(".field, .form-actions", form), { y: 30, autoAlpha: 0, duration: .8, stagger: .06, ease: "power3.out", scrollTrigger: { trigger: form, start: "top 80%" } });

    initCursor();
    initMagnetic();
  }

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
  function initMagnetic() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$(".nav-cta, .kh-hero .btn, .uc-hero .btn, .slider-btn").forEach(function (b) {
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
    G.timeline()
      .from(".kh-hero-video", { scale: 1.15, duration: 1.8, ease: "power3.out" }, 0)
      .from(".kh-hero-title .line > span", { yPercent: 115, duration: 1.2, stagger: .12, ease: "power4.out" }, .15)
      .from(".kh-hero-text p", { y: 30, autoAlpha: 0, duration: .9, stagger: .1, ease: "power3.out" }, .6)
      .from(".kh-hero-actions .btn", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out" }, .85)
      .from(".site-nav", { yPercent: -100, duration: .9, ease: "power3.out", clearProps: "transform" }, .5);
  }

  function kommz() {
    // Opening banner: video drifts and pushes in, text lifts away as you scroll down,
    // and everything comes back exactly as it was when you scroll up.
    scrollLinked(".kh-hero", function (tl) {
      tl.to(".kh-hero-media", { yPercent: 18, scale: 1.08, ease: "none" }, 0)
        .to(".kh-hero-title .line:nth-child(1)", { xPercent: -10, ease: "none" }, 0)
        .to(".kh-hero-title .line:nth-child(2)", { xPercent: 7, ease: "none" }, 0)
        .to(".kh-hero-title .line:nth-child(3)", { xPercent: -4, ease: "none" }, 0)
        .to(".kh-hero-content", { yPercent: -18, opacity: 0, ease: "none" }, 0)
        .to(".scroll-cue, .kh-sound", { opacity: 0, ease: "none" }, 0);
    });

    // Services card: rows slide in one after another
    G.from(".kh-svc", { y: 40, autoAlpha: 0, duration: .8, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: ".kh-svc-card", start: "top 82%" } });

    $$(".kh-card").forEach(function (c) {
      G.from($(".kh-card-body", c), { y: 40, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 85%" } });
    });

    // Team portraits slide in from the right, one after another
    G.from(".kh-tcard", { x: 120, autoAlpha: 0, duration: 1.1, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".kh-team-slider", start: "top 85%" } });
    G.from(".contact-list > div", { y: 30, autoAlpha: 0, duration: .8, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: ".contact-list", start: "top 90%" } });
    G.from(".kh-footer-giant img", { yPercent: 70, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".kh-footer-giant", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  /* ---------- THE UP CLOSE ---------- */
  function upcloseIntro() {
    G.timeline()
      .from(".uc-hero-bg img", { scale: 1.3, autoAlpha: 0, duration: 2, ease: "power3.out" }, 0)
      .from(".uc-hero-logo", { scale: .5, rotate: -8, autoAlpha: 0, duration: 1.2, ease: "back.out(1.6)" }, .1)
      .from(".uc-hero-tagline", { y: 50, autoAlpha: 0, duration: 1, ease: "power3.out" }, .45)
      .from(".uc-hero-intro", { y: 30, autoAlpha: 0, duration: .9, ease: "power3.out" }, .65)
      .from(".uc-hero .btn-row .btn", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out" }, .8)
      .from(".uc-hero-mic img", { xPercent: 60, rotate: 25, autoAlpha: 0, duration: 1.6, ease: "power3.out" }, .3)
      .from(".uc-hero-pattern", { yPercent: 100, duration: 1, ease: "power3.out" }, .6)
      .from(".site-nav", { yPercent: -100, duration: .9, ease: "power3.out", clearProps: "transform" }, .5);
  }

  function upclose() {
    scrollLinked(".uc-hero", function (tl) {
      tl.to(".uc-hero-bg", { yPercent: 25, scale: 1.15, ease: "none" }, 0)
        .to(".uc-hero-mic", { yPercent: -35, rotate: -14, ease: "none" }, 0)
        .to(".uc-hero-copy", { yPercent: -18, opacity: 0, ease: "none" }, 0)
        .to(".scroll-cue", { opacity: 0, ease: "none" }, 0);
    });

    G.from(".uc-about-block", { scaleX: 0, transformOrigin: "left center", duration: 1.3, ease: "power4.inOut", scrollTrigger: { trigger: ".uc-about-media", start: "top 80%" } });
    G.from(".uc-about-media img, .uc-about-media video", { y: 120, autoAlpha: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".uc-about-media", start: "top 80%" } });
    G.from(".uc-topic", { y: 120, rotate: 4, autoAlpha: 0, duration: 1.1, stagger: .12, ease: "power4.out", scrollTrigger: { trigger: ".uc-topic-grid", start: "top 85%" } });
    G.from(".uc-tag", { scaleX: 0, transformOrigin: "left center", duration: .9, ease: "power4.out", scrollTrigger: { trigger: ".uc-host", start: "top 75%" } });
    G.from(".uc-host-name span", { xPercent: -60, autoAlpha: 0, duration: 1.2, stagger: .15, ease: "power4.out", scrollTrigger: { trigger: ".uc-host", start: "top 70%" } });
    G.from(".uc-host-roles li, .uc-host-bio", { y: 30, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out", scrollTrigger: { trigger: ".uc-host-roles", start: "top 85%" } });
    G.fromTo(".uc-host-media img", { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.6, ease: "power4.inOut", scrollTrigger: { trigger: ".uc-host-media", start: "top 80%" } });
    G.from(".uc-date", { scale: 0, rotate: -20, duration: .9, ease: "back.out(2)", scrollTrigger: { trigger: ".uc-latest", start: "top 75%" } });
    G.from(".uc-theme", { y: 60, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".uc-theme", start: "top 90%" } });
    G.from(".uc-platforms .btn", { y: 40, scale: .9, autoAlpha: 0, duration: .8, stagger: .08, ease: "back.out(1.6)", scrollTrigger: { trigger: ".uc-platforms", start: "top 85%" } });
    G.from(".uc-footer-logo", { y: 80, rotate: -6, autoAlpha: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".uc-footer", start: "top 85%" } });
  }

  /* ---------- Start (called by app.js once the content is on the page) ---------- */
  function start(page) {
    common();
    if (page === "kommzhub") kommz();
    if (page === "upclose") upclose();

    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

    var intro = page === "kommzhub" ? kommzIntro : page === "upclose" ? upcloseIntro : function () {};
    function reveal() {
      try { sessionStorage.setItem("kh-intro", "1"); } catch (e) {}
      if (lenis) lenis.start();
      intro();
      document.dispatchEvent(new Event("kh:revealed"));
    }
    if (introExit) introExit(reveal);
    else if (pre) {
      G.timeline()
        .to(count, { v: 100, duration: .45, ease: "power1.inOut", onUpdate: drawCount, overwrite: true })
        .to($(".preloader-inner", pre), { y: -40, autoAlpha: 0, duration: .5, ease: "power2.in" })
        .to(pre, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=.15")
        .add(reveal, "-=.55")
        .add(function () { pre.remove(); refresh(); });
    } else {
      reveal();
    }
  }

  window.KHMotion = {
    start: start,
    refresh: refresh,
    scrollTo: function (el, smooth) {
      if (lenis) lenis.scrollTo(el, { offset: -90, immediate: !smooth, force: true, duration: 1.1 });
      else el.scrollIntoView(smooth ? { behavior: "smooth" } : undefined);
      if (!smooth) ST.refresh();
    },
    pause: function (stop) { if (lenis) { if (stop) lenis.stop(); else lenis.start(); } }
  };
})();
