/* ===== MIRNE MAIN.JS ===== */

// ── Load content from JSON and build page ──────────────────────────────────
async function loadContent() {
  try {
    const res = await fetch('assets/data/content.json');
    const data = await res.json();
    buildPage(data);
  } catch (e) {
    console.warn('Content JSON not found, page uses static fallback.');
  }
}

function buildPage(d) {
  // Site name / title
  document.title = `${d.site.name} — ${d.site.motto}`;

  // Nav logo
  const logoEl = document.querySelector('.nav-logo');
  if (logoEl) logoEl.innerHTML = `${d.site.name} <span>${d.site.motto}</span>`;

  // Nav links
  const navLinksEl = document.querySelector('.nav-links');
  if (navLinksEl) {
    navLinksEl.innerHTML = d.nav.map((item, i) => {
      const isCta = item.label === 'Contact';
      return `<a href="${item.href}" class="${isCta ? 'nav-cta' : ''}" data-nav>${item.label}</a>`;
    }).join('');
  }

  // Mobile links
  const mobileLinksEl = document.querySelector('.mobile-links');
  if (mobileLinksEl) {
    mobileLinksEl.innerHTML = d.nav.map(item =>
      `<a href="${item.href}" class="mobile-link">${item.label}</a>`
    ).join('');
  }

  // Hero slides
  const heroEl = document.querySelector('.hero-slides');
  const dotsEl = document.querySelector('.hero-dots');
  if (heroEl && d.hero) {
    heroEl.innerHTML = d.hero.slides.map((s, i) => `
      <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${s.image}')">
        <div class="hero-content">
          <div class="container">
            <p class="hero-label">${d.site.name} — ${d.site.motto}</p>
            <h1 class="hero-title">${s.title.replace(/Restoration|Gospel|Nations/g, m => `<em>${m}</em>`)}</h1>
            <p class="hero-sub">${s.subtitle}</p>
            <div class="hero-actions">
              <a href="${s.ctaHref}" class="btn-primary">${s.cta}</a>
              <a href="#vision" class="btn-ghost">Learn More</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    if (dotsEl) {
      dotsEl.innerHTML = d.hero.slides.map((_, i) =>
        `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`
      ).join('');
    }
  }

  // Vision
  const visionText = document.querySelector('.vision-text-content');
  if (visionText && d.vision) {
    visionText.querySelector('.section-label').textContent = d.vision.subtitle;
    visionText.querySelector('.section-title').innerHTML = d.vision.title.replace(/Bride|Christ/g, m => `<em>${m}</em>`);
    visionText.querySelector('p').textContent = d.vision.text;
    visionText.querySelector('.vision-verse').textContent = d.vision.verse;
  }

  // Mission pillars
  const pillarsEl = document.querySelector('.mission-pillars');
  if (pillarsEl && d.mission) {
    pillarsEl.innerHTML = d.mission.pillars.map((p, i) => `
      <div class="pillar reveal delay-${i+1}">
        <div class="pillar-num">${p.number}</div>
        <h3>${p.title}</h3>
        <p>${p.text}</p>
      </div>
    `).join('');
  }

  // Objectives
  const objGrid = document.querySelector('.objectives-grid');
  if (objGrid && d.objectives) {
    objGrid.innerHTML = d.objectives.map((o, i) => `
      <div class="objective-card reveal delay-${i+1}">
        <span class="objective-icon">${o.icon}</span>
        <h3>${o.title}</h3>
        <p>${o.text}</p>
      </div>
    `).join('');
  }

  // Values
  const valuesList = document.querySelector('.values-list');
  if (valuesList && d.values) {
    valuesList.innerHTML = d.values.map((v, i) => `
      <div class="value-item reveal delay-${Math.min(i+1,6)}">
        <span class="value-num">0${i+1}</span>
        <span class="value-text">${v}</span>
      </div>
    `).join('');
  }

  // Works
  const worksGrid = document.querySelector('.works-grid');
  if (worksGrid && d.works) {
    worksGrid.innerHTML = d.works.map((w, i) => `
      <div class="work-card reveal delay-${Math.min(i+1,6)}">
        <img src="${w.image}" alt="${w.title}" class="work-img" loading="lazy">
        <div class="work-overlay">
          <span class="work-cat">${w.category}</span>
          <h3 class="work-title">${w.title}</h3>
        </div>
        <span class="work-year">${w.year}</span>
      </div>
    `).join('');
  }

  // Contact
  const contactLeft = document.querySelector('.contact-left');
  if (contactLeft && d.contact) {
    const detailsEl = contactLeft.querySelector('.contact-details');
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div class="contact-detail">
          <div class="contact-detail-icon">📞</div>
          <div class="contact-detail-text">
            <strong>Phone</strong>
            <a href="tel:${d.contact.phone}">${d.contact.phone}</a>
          </div>
        </div>
        <div class="contact-detail">
          <div class="contact-detail-icon">✉</div>
          <div class="contact-detail-text">
            <strong>Email</strong>
            <a href="mailto:${d.contact.email}">${d.contact.email}</a>
          </div>
        </div>
        <div class="contact-detail">
          <div class="contact-detail-icon">📍</div>
          <div class="contact-detail-text">
            <strong>Location</strong>
            <span>${d.contact.location}</span>
          </div>
        </div>
      `;
    }
  }
  const contactCard = document.querySelector('.contact-card');
  if (contactCard && d.contact) {
    const phoneEl = contactCard.querySelector('.contact-phone');
    if (phoneEl) phoneEl.textContent = d.contact.phone;
  }

  // Footer
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo) footerLogo.textContent = `${d.site.name} Ministries`;
  const footerCopy = document.querySelector('.footer-copy');
  if (footerCopy) footerCopy.textContent = d.footer.copyright;
  const allianceEl = document.querySelector('.footer-alliance');
  if (allianceEl) allianceEl.textContent = d.site.alliance;

  // Re-init observe after DOM update
  setTimeout(initScrollReveal, 100);
  initHeroSlider();
}

// ── Preloader ──────────────────────────────────────────────────────────────
function initPreloader() {
  const loader = document.getElementById('preloader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 800);
  });
}

// ── Custom Cursor ──────────────────────────────────────────────────────────
function initCursor() {
  const dot = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animateCursor() {
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => ring.style.transform = 'translate(-50%,-50%) scale(1.5)');
    el.addEventListener('mouseleave', () => ring.style.transform = 'translate(-50%,-50%) scale(1)');
  });
}

// ── Navbar ──────────────────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    // Active link
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

// ── Hero Slider ─────────────────────────────────────────────────────────────
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prev = document.querySelector('.hero-arrow.prev');
  const next = document.querySelector('.hero-arrow.next');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(i) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    clearTimeout(timer);
    timer = setTimeout(() => goTo(current + 1), 6000);
  }

  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

  timer = setTimeout(() => goTo(1), 6000);
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
    .forEach(el => observer.observe(el));
}

// ── Parallax hero ─────────────────────────────────────────────────────────
function initParallax() {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    document.querySelectorAll('.hero-slide.active').forEach(el => {
      el.style.transform = `translateY(${scrolled * 0.3}px)`;
    });
  }, { passive: true });
}

// ── Scroll-to-top ─────────────────────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Smooth anchor links ────────────────────────────────────────────────────
function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = document.getElementById('navbar')?.offsetHeight || 80;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });
}

// ── Number counter animation ──────────────────────────────────────────────
function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = +el.dataset.count;
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start += step;
          el.textContent = Math.min(Math.round(start), target) + (el.dataset.suffix || '');
          if (start >= target) clearInterval(timer);
        }, 20);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

// ── Init all ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initCursor();
  initNavbar();
  initHeroSlider();
  initScrollReveal();
  initParallax();
  initScrollTop();
  initSmoothLinks();
  initCounters();
  loadContent();
});
