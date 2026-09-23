/* ============================================================
   NAIOTH RAMAH CENTRE — site script
   Loads content.json and renders every section, then wires up
   nav, scroll reveals, counters, gallery, testimonials, form.
   Non-programmers only need to edit content.json — not this file.
   ============================================================ */

(function () {
  "use strict";

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  fetch("content.json")
    .then((r) => {
      if (!r.ok) throw new Error("content.json not found");
      return r.json();
    })
    .then((data) => {
      render(data);
      initInteractions(data);
    })
    .catch((err) => {
      console.error("Could not load content.json:", err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        `<div style="background:#0A2540;color:#fff;font-family:sans-serif;padding:14px 20px;font-size:14px;text-align:center;">
          Could not load content.json. If you opened this file directly from your computer, please serve the folder
          from a local web server (or upload it to hosting) so the browser can fetch content.json.
        </div>`
      );
      // still wire up nav/reveal for whatever static markup exists
      initInteractions(null);
    });

  function render(data) {
    // ---- meta / brand ----
    document.title = `${data.site.name} — ${data.hero.eyebrow}`;
    document.getElementById("brand-name").textContent = data.site.shortName || data.site.name;
    document.getElementById("nav-cta-label").textContent = data.nav.ctaLabel;

    const navLinks = document.getElementById("nav-links");
    data.nav.links.forEach((l) => {
      const a = el("a", null, l.label);
      a.href = l.href;
      navLinks.appendChild(a);
    });

    // ---- hero ----
    document.getElementById("hero-eyebrow").textContent = data.hero.eyebrow;
    document.getElementById("hero-headline").textContent = data.hero.headline;
    document.getElementById("hero-sub").textContent = data.hero.subheadline;
    const p1 = document.getElementById("hero-cta-primary");
    p1.textContent = data.hero.ctaPrimary.label;
    p1.href = data.hero.ctaPrimary.href;
    const p2 = document.getElementById("hero-cta-secondary");
    p2.textContent = data.hero.ctaSecondary.label;
    p2.href = data.hero.ctaSecondary.href;

    const statsWrap = document.getElementById("hero-stats");
    data.hero.stats.forEach((s, i) => {
      const stat = el("div", "stat");
      stat.style.setProperty("--i", i);
      stat.innerHTML = `<div class="stat-value"><span class="count" data-target="${s.value}">0</span><span class="stat-suffix">${s.suffix || ""}</span></div><div class="stat-label">${s.label}</div>`;
      statsWrap.appendChild(stat);
    });

    // ---- about ----
    document.getElementById("about-eyebrow").textContent = data.about.eyebrow;
    document.getElementById("about-title").textContent = data.about.title;
    const aboutCopy = document.getElementById("about-copy");
    data.about.paragraphs.forEach((p) => aboutCopy.appendChild(el("p", null, p)));

    const featWrap = document.getElementById("about-features");
    data.about.features.forEach((f, i) => {
      const card = el("div", "feature");
      card.style.setProperty("--i", i);
      card.innerHTML = `<div class="feature-num">0${i + 1}</div><h4>${f.title}</h4><p>${f.text}</p>`;
      featWrap.appendChild(card);
    });

    // ---- spaces ----
    document.getElementById("spaces-eyebrow").textContent = data.spaces.eyebrow;
    document.getElementById("spaces-title").textContent = data.spaces.title;
    document.getElementById("spaces-subtitle").textContent = data.spaces.subtitle;
    const spaceList = document.getElementById("space-list");
    data.spaces.items.forEach((s) => {
      const row = el("div", "space-row reveal");
      row.innerHTML = `
        <div>
          <div class="space-name">${s.name}</div>
          <span class="space-capacity">${s.capacity}</span>
        </div>
        <div class="space-desc">${s.description}</div>
        <div class="space-thumb"><img src="${s.image}" alt="${s.name}" loading="lazy"></div>
      `;
      spaceList.appendChild(row);
    });

    // ---- events ----
    document.getElementById("events-eyebrow").textContent = data.events.eyebrow;
    document.getElementById("events-title").textContent = data.events.title;
    const eventGrid = document.getElementById("event-grid");
    data.events.items.forEach((ev, i) => {
      const card = el("div", "event-card");
      card.style.setProperty("--i", i);
      card.innerHTML = `<div class="event-ring"></div><h4>${ev.title}</h4><p>${ev.text}</p>`;
      eventGrid.appendChild(card);
    });

    // ---- gallery ----
    document.getElementById("gallery-eyebrow").textContent = data.gallery.eyebrow;
    document.getElementById("gallery-title").textContent = data.gallery.title;
    const galleryGrid = document.getElementById("gallery-grid");
    data.gallery.images.forEach((g) => {
      const item = el("div", "gallery-item");
      item.setAttribute("data-caption", g.caption || "");
      item.innerHTML = `<img src="${g.image}" alt="${g.caption || ""}" loading="lazy">`;
      galleryGrid.appendChild(item);
    });

    // ---- testimonials ----
    document.getElementById("t-eyebrow").textContent = data.testimonials.eyebrow;
    document.getElementById("t-title").textContent = data.testimonials.title;
    const tWrap = document.getElementById("t-wrap");
    const slides = el("div", "t-slides");
    data.testimonials.items.forEach((t, i) => {
      const slide = el("div", "t-slide" + (i === 0 ? " active" : ""));
      slide.innerHTML = `<p class="t-quote">${t.quote}</p><div class="t-name">${t.name}</div><div class="t-event">${t.event}</div>`;
      slides.appendChild(slide);
    });
    tWrap.appendChild(slides);
    if (data.testimonials.items.length > 1) {
      const dots = el("div", "t-dots");
      data.testimonials.items.forEach((_, i) => {
        const dot = el("button", "t-dot" + (i === 0 ? " active" : ""));
        dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
        dot.dataset.index = i;
        dots.appendChild(dot);
      });
      tWrap.appendChild(dots);
    }

    // ---- contact ----
    document.getElementById("contact-eyebrow").textContent = data.contact.eyebrow;
    document.getElementById("contact-title").textContent = data.contact.title;
    document.getElementById("contact-subtitle").textContent = data.contact.subtitle;
    const info = document.getElementById("contact-info");
    const infoRows = [
      { label: "Address", value: data.contact.address, icon: pin() },
      { label: "Phone / WhatsApp", value: data.site.phone, icon: phoneIcon() },
      { label: "Email", value: data.site.email, icon: mailIcon() },
      { label: "Hours", value: data.contact.hours, icon: clockIcon() },
    ];
    infoRows.forEach((r) => {
      const row = el("div", "info-row");
      row.innerHTML = `<div class="info-icon">${r.icon}</div><div><div class="info-label">${r.label}</div><div class="info-value">${r.value}</div></div>`;
      info.appendChild(row);
    });
    const mapWrap = document.getElementById("map-wrap");
    if (data.contact.mapEmbedUrl) {
      mapWrap.innerHTML = `<iframe src="${data.contact.mapEmbedUrl}" loading="lazy" title="Map"></iframe>`;
    }
    document.getElementById("form-note").textContent = data.contact.formNote || "";

    // ---- footer ----
    document.getElementById("footer-note").textContent = data.footer.note;
    document.getElementById("footer-copy").textContent = data.footer.copyright;
    const socials = document.getElementById("footer-socials");
    data.footer.socials.forEach((s) => {
      const a = el("a", null, s.name);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      socials.appendChild(a);
    });

    // wire contact form -> mailto (static hosting, no backend)
    const form = document.getElementById("contact-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("f-name").value;
      const phone = document.getElementById("f-phone").value;
      const eventType = document.getElementById("f-event").value;
      const date = document.getElementById("f-date").value;
      const guests = document.getElementById("f-guests").value;
      const message = document.getElementById("f-message").value;
      const body = `Name: ${name}%0APhone: ${phone}%0AEvent type: ${eventType}%0APreferred date: ${date}%0AEstimated guests: ${guests}%0A%0AMessage:%0A${message}`;
      window.location.href = `mailto:${data.site.email}?subject=${encodeURIComponent(
        "Event enquiry — " + eventType
      )}&body=${body}`;
    });
  }

  function pin() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22Z"/><circle cx="12" cy="9.5" r="2.4"/></svg>';
  }
  function phoneIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"/></svg>';
  }
  function mailIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
  }
  function clockIcon() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
  }

  function initInteractions() {
    // ---- nav scroll state ----
    const nav = document.getElementById("nav");
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // ---- mobile menu ----
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (toggle) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("menu-open");
        links.classList.toggle("open");
      });
      links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("menu-open");
          links.classList.remove("open");
        })
      );
    }

    // ---- scroll reveals ----
    const revealEls = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            if (entry.target.id === "hero-stats" || entry.target.querySelector(".count")) {
              animateCounters(entry.target);
            }
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    revealEls.forEach((elm) => io.observe(elm));

    // ---- counters ----
    function animateCounters(scope) {
      const counters = scope.querySelectorAll(".count");
      counters.forEach((c) => {
        const raw = c.dataset.target.replace(/,/g, "");
        const target = parseFloat(raw);
        if (isNaN(target)) return;
        const isDecimal = raw.includes(".");
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          c.textContent = isDecimal
            ? val.toFixed(1)
            : Math.round(val).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
          else c.textContent = target.toLocaleString();
        }
        requestAnimationFrame(tick);
      });
    }

    // ---- testimonial rotator ----
    const tWrap = document.getElementById("t-wrap");
    if (tWrap) {
      const slides = tWrap.querySelectorAll(".t-slide");
      const dots = tWrap.querySelectorAll(".t-dot");
      let idx = 0;
      let timer;
      function show(i) {
        slides.forEach((s, n) => s.classList.toggle("active", n === i));
        dots.forEach((d, n) => d.classList.toggle("active", n === i));
        idx = i;
      }
      function next() {
        show((idx + 1) % slides.length);
      }
      function restart() {
        clearInterval(timer);
        timer = setInterval(next, 6000);
      }
      dots.forEach((d) =>
        d.addEventListener("click", () => {
          show(parseInt(d.dataset.index, 10));
          restart();
        })
      );
      if (slides.length > 1) restart();
    }
  }
})();
