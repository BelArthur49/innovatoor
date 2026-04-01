/* BrightTone Event — main.js */
'use strict';

// ─── SVG Icons ────────────────────────────────────────────────
const ICONS = {
    concert: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    wedding: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    corporate: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    cpu: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>`,
};

function icon(name, extra = '') {
    const s = ICONS[name] || ICONS.concert;
    return s.replace('<svg ', `<svg ${extra} `);
}

function initials(name) { return name.split(' ').slice(0, 2).map(w => w[0]).join('') }

// ─── Content loader ───────────────────────────────────────────
let C = null;

async function loadContent() {
    try {
        // Works when served from a local/remote server
        const r = await fetch('content.json');
        C = await r.json();
    } catch (e) {
        // Fallback: hardcoded content (works when opened as file://)
        C = FALLBACK;
    }
}

// ─── NAV ─────────────────────────────────────────────────────
function buildNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const linksHTML = C.nav.links.map(l =>
        `<a href="${l.href}" class="${l.href===page?'active':''}">${l.label}</a>`
    ).join('');
    const drawerHTML = C.nav.links.map(l =>
        `<a href="${l.href}">${l.label}</a>`
    ).join('') + `<a href="${C.nav.cta.href}" class="nav-cta">${C.nav.cta.label}</a>`;

    document.querySelectorAll('.nav-logo').forEach(el => {
        el.innerHTML = `<div class="dot"></div><span class="name">${C.brand.name}<span class="accent"> ${C.brand.tagline}</span></span>`;
    });
    document.querySelectorAll('.nav-links').forEach(el => el.innerHTML = linksHTML);
    document.querySelectorAll('.nav-drawer').forEach(el => el.innerHTML = drawerHTML);
    document.querySelectorAll('[data-nav-cta]').forEach(el => {
        el.textContent = C.nav.cta.label;
        el.href = C.nav.cta.href;
    });

    // Scroll
    const nav = document.querySelector('.nav');
    if (nav) {
        const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
        addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // Burger
    const burger = document.querySelector('.nav-burger');
    const drawer = document.querySelector('.nav-drawer');
    if (burger && drawer) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            drawer.classList.toggle('open');
            document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
        });
        drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            burger.classList.remove('open');
            drawer.classList.remove('open');
            document.body.style.overflow = '';
        }));
    }
}

// ─── FOOTER ──────────────────────────────────────────────────
function buildFooter() {
    const f = C.footer;
    document.querySelectorAll('.footer-brand-name').forEach(el => {
        el.innerHTML = `${C.brand.name}<span class="ac"> ${C.brand.tagline}</span>`;
    });
    document.querySelectorAll('.footer-tagline').forEach(el => el.textContent = f.tagline);
    document.querySelectorAll('.footer-copy').forEach(el => el.textContent = f.copyright);

    const socials = [
        { icon: 'instagram', href: f.instagram, label: 'Instagram' },

    ];

    document.querySelectorAll('.footer-social').forEach(el => {
        el.innerHTML = socials.map(s =>
            `<a href="${s.href}" target="_blank" rel="noopener" class="fsoc-link" title="${s.label}">${icon(s.icon)}</a>`
        ).join('');
    });

    document.querySelectorAll('.flinks').forEach(el => {
        el.innerHTML = C.nav.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('');
    });

    document.querySelectorAll('.footer-ig').forEach(el => {
        el.href = f.instagram;
        el.textContent = '@brighttone_event';
    });
}



// ─── CANVAS SPEAKER ANIMATION ─────────────────────────────────
function initCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, speakers = [],
        raf;

    class Speaker {
        constructor(x, y, r, phase) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.phase = phase;
            this.rings = [];
        }
        update(t) {
            this.phase = t * 0.55 + this.phase;
            this.cur = this.r * (0.88 + Math.sin(this.phase) * 0.5 * 0.24);
            if (Math.sin(this.phase) > 0.93 && this.rings.length < 6)
                this.rings.push({ r: this.cur * 1.05, op: 0.55, spd: 1.1 + Math.random() * 0.5 });
            this.rings = this.rings.map(rg => ({...rg, r: rg.r + rg.spd, op: rg.op - 0.009 })).filter(rg => rg.op > 0);
        }
        draw(ctx) {
            // Glow
            const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.cur);
            g.addColorStop(0, 'rgba(0,200,255,0.13)');
            g.addColorStop(0.7, 'rgba(0,200,255,0.04)');
            g.addColorStop(1, 'rgba(0,200,255,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.cur, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            // Cone rings
            [0.28, 0.48, 0.66, 0.82, 0.95].forEach((ratio, i) => {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.cur * ratio, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0,200,255,${0.13-i*0.02})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
            // Dome
            const dg = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.cur * 0.18);
            dg.addColorStop(0, 'rgba(0,200,255,0.55)');
            dg.addColorStop(1, 'rgba(0,200,255,0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.cur * 0.18, 0, Math.PI * 2);
            ctx.fillStyle = dg;
            ctx.fill();
            // Pulse rings
            this.rings.forEach(rg => {
                ctx.beginPath();
                ctx.arc(this.x, this.y, rg.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0,200,255,${rg.op})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        }
    }

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        speakers = [];
        if (W > 900) {
            speakers = [new Speaker(W * .76, H * .42, Math.min(W, H) * .21, 0), new Speaker(W * .88, H * .72, Math.min(W, H) * .12, 1.3), new Speaker(W * .62, H * .78, Math.min(W, H) * .09, 2.2)];
        } else if (W > 600) {
            speakers = [new Speaker(W * .78, H * .38, Math.min(W, H) * .17, 0), new Speaker(W * .88, H * .7, Math.min(W, H) * .1, 1.4)];
        } else {
            speakers = [new Speaker(W * .82, H * .32, Math.min(W, H) * .15, 0)];
        }
    }

    let start = null;

    function draw(ts) {
        if (!start) start = ts;
        const t = (ts - start) / 1000;
        ctx.clearRect(0, 0, W, H);

        // Waveform lines: [base amplitude, frequency, speed, opacity]
        const waves = [
            [50, 0.03, 0.55, 0.25],
            [20, 0.025, 0.38, 0.2],
            [25, 0.035, 0.9, 0.22],
            [20, 0.025, 0.38, 0.2]
        ];

        waves.forEach(([baseAmp, freq, spd, op], i) => {
            // Independent pulsing per wave (simulate different sound channels)
            const volume = 0.5 + 0.5 * Math.sin(t * (1 + i * 0.3) + i); // 0.5 to 1.0
            const amp = baseAmp * volume;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 4) {
                const y = H * 0.58 +
                    Math.sin(x * freq + t * spd) * amp +
                    Math.sin(x * freq * 2.2 + t * spd * 0.65) * (amp * 0.5);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0,200,255,${0.5 + 0.3 * volume})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw speakers
        speakers.forEach(s => {
            s.update(t);
            s.draw(ctx);
        });

        raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        start = null;
        resize();
        raf = requestAnimationFrame(draw);
    });
    ro.observe(canvas);
    resize();
    raf = requestAnimationFrame(draw);
}

// ─── AUDIO BARS ───────────────────────────────────────────────
function initBars() {
    document.querySelectorAll('.abars').forEach(el => {
        el.innerHTML = Array.from({ length: 12 }, (_, i) => {
            const h = Math.round(8 + Math.random() * 20);
            const del = (Math.random() * .8).toFixed(2);
            const dur = (0.5 + Math.random() * .6).toFixed(2);
            return `<div class="abar" style="--h:${h}px;animation-delay:${del}s;animation-duration:${dur}s"></div>`;
        }).join('');
    });
}

// ─── REVEAL ──────────────────────────────────────────────────
function initReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ─── HOME PAGE ───────────────────────────────────────────────
function buildHome() {
    const h = C.home,
        el = id => document.getElementById(id);
    if (!el('home-hero-badge')) return;

    el('home-hero-badge').textContent = h.hero.badge;
    el('home-hero-title').innerHTML = `${h.hero.headline} <span class="ac">${h.hero.headline_accent}</span>`;
    el('home-hero-sub').textContent = h.hero.subheadline;
    const p = el('home-cta-primary'),
        s = el('home-cta-secondary');
    if (p) {
        p.textContent = h.hero.cta_primary.label;
        p.href = h.hero.cta_primary.href;
    }
    if (s) {
        s.textContent = h.hero.cta_secondary.label;
        s.href = h.hero.cta_secondary.href;
    }

    // Stats
    const sg = el('stats-grid');
    if (sg) sg.innerHTML = h.stats.map((s, i) => `
    <div class="stat-item reveal d${i+1}">
      <div class="stat-val">${s.value}</div>
      <div class="stat-lbl">${s.label}</div>
    </div>`).join('');

    // Service cards
    // Service cards WITH IMAGES
    const cg = el('cards-grid');
    if (cg) cg.innerHTML = h.service_cards.map((c, i) => `
  <div class="card reveal d${i+1}">
    
    <div class="card-image">
      <img src="${c.image || ''}" alt="${c.title}">
      <div class="card-icon-overlay">${icon(c.icon)}</div>
    </div>

    <h3 class="card-title">${c.title}</h3>
    <p class="card-body">${c.body}</p>

    <a href="${c.href}" class="card-link">
      Learn more ${icon('arrow')}
    </a>
  </div>
`).join('');

    // Testimonials
    const tg = el('testi-grid');
    if (tg) tg.innerHTML = h.testimonials.map((t, i) => `
    <div class="testi-card reveal d${i+1}">
      <p class="testi-quote">${t.quote}</p>
      <div class="testi-author">
        <div class="testi-av">${initials(t.name)}</div>
        <div><div class="testi-name">${t.name}</div><div class="testi-role">${t.role}</div></div>
      </div>
    </div>`).join('');

    // CTA band
    const cb = h.cta_band;
    const ct = el('cta-title'),
        cbd = el('cta-body'),
        cbtn = el('cta-btn');
    if (ct) ct.textContent = cb.title;
    if (cbd) cbd.textContent = cb.body;
    if (cbtn) {
        cbtn.textContent = cb.cta.label;
        cbtn.href = cb.cta.href;
    }
}

// ─── SERVICES PAGE ───────────────────────────────────────────
function buildServices() {
    const sv = C.services,
        el = id => document.getElementById(id);
    if (!el('svc-hero-lbl')) return;

    el('svc-hero-lbl').textContent = sv.hero.label;
    el('svc-hero-title').textContent = sv.hero.title;
    el('svc-hero-body').textContent = sv.hero.body;

    const list = el('svc-list');
    if (list) list.innerHTML = sv.items.map((item, i) => `
    <div class="svc-item${i%2===1?' flip':''} reveal" id="${item.id}">
      <div class="svc-visual">
  <div class="svc-visual-inner">

    <img src="${item.image || ''}" alt="${item.title}" class="svc-image">

    <div class="svc-icon-overlay">
      ${icon(item.icon,'class="big"')}
    </div>

    <div class="abars" style="height:40px;align-items:center"></div>

  </div>
</div>
      <div>
        <span class="lbl">${item.title}</span>
        <h2 class="sec-title">${item.title}</h2>
        <p class="sec-body">${item.body}</p>
        <ul class="svc-features">${item.features.map(f=>`<li class="svc-feat">${f}</li>`).join('')}</ul>
        <br><a href="contact.html" class="btn-primary" style="display:inline-flex;margin-top:20px">Get a Quote ${icon('arrow')}</a>
      </div>
    </div>`).join('');

  const bg=el('brands-grid');
  if(bg) bg.innerHTML=sv.equipment_brands.map(b=>`<span class="brand-tag">${b}</span>`).join('');
}

// ─── PORTFOLIO PAGE ──────────────────────────────────────────
function buildPortfolio(){
  const p=C.portfolio, el=id=>document.getElementById(id);
  if(!el('port-filter')) return;

  const filters=['All','Concerts','Weddings','Corporate'];
  el('port-filter').innerHTML=filters.map(f=>`<button class="fbtn${f==='All'?' active':''}" data-f="${f}">${f}</button>`).join('');

  function render(filter){
    const items=filter==='All'?p.items:p.items.filter(i=>i.category===filter);
    el('port-grid').innerHTML=items.map((item,i)=>`
      <div class="port-card reveal d${(i%3)+1}">
       <div class="port-card-bg">
  <img src="${item.image || ''}" alt="${item.title}">
</div>
        <div class="port-overlay">
          <div class="port-tag">${item.category} · ${item.year}</div>
          <div class="port-title">${item.title}</div>
          <div class="port-desc">${item.desc}</div>
        </div>
      </div>`).join('');
    initReveal();
  }

  render('All');
  el('port-filter').addEventListener('click',e=>{
    const btn=e.target.closest('.fbtn'); if(!btn) return;
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.f);
  });
}

function getCatIcon(c){return c==='Concerts'?'concert':c==='Weddings'?'wedding':'corporate';}

// ─── ABOUT PAGE ──────────────────────────────────────────────
function buildAbout(){
  const a=C.about, el=id=>document.getElementById(id);
  if(!el('about-story-text')) return;

  el('about-story-text').innerHTML=a.story.map(p=>`<p>${p}</p>`).join('');

  const vg=el('vals-grid');
  if(vg) vg.innerHTML=a.values.map((v,i)=>`
    <div class="val-card reveal d${i+1}">
      <div class="val-icon">${icon(v.icon)}</div>
      <h3 class="val-title">${v.title}</h3>
      <p class="val-body">${v.body}</p>
    </div>`).join('');

  const tg=el('team-grid');
  if(tg) tg.innerHTML=a.team.map((m,i)=>`
    <div class="team-card reveal d${i+1}">
      <div class="team-av">${initials(m.name)}</div>
      <div class="team-name">${m.name}</div>
      <div class="team-role">${m.role}</div>
      <p class="team-bio">${m.bio}</p>
    </div>`).join('');
}

// ─── CONTACT PAGE ────────────────────────────────────────────
function buildContact(){
  const ct=C.contact, el=id=>document.getElementById(id);
  if(!el('contact-info')) return;

  const info=[
    {icon:'pin',   label:'Location', val:ct.location,  href:null},
    {icon:'phone', label:'Phone',    val:ct.phone,      href:`tel:${ct.phone.replace(/\s/g,'')}`},
    {icon:'mail',  label:'Email',    val:ct.email,      href:`mailto:${ct.email}`},
    {icon:'instagram', label:'Instagram', val:'@brighttone_event', href:ct.instagram},
  ];

  el('contact-info').innerHTML=info.map(i=>`
    <div class="cinfo-item">
      <div class="cinfo-icon">${icon(i.icon)}</div>
      <div>
        <div class="cinfo-lbl">${i.label}</div>
        <div class="cinfo-val">${i.href?`<a href="${i.href}"${i.href.startsWith('http')?' target="_blank" rel="noopener"':''}>${i.val}</a>`:i.val}</div>
      </div>
    </div>`).join('');

  const sel=el('form-event');
  if(sel) sel.innerHTML=`<option value="" disabled selected>Select event type</option>`+
    ct.event_types.map(t=>`<option value="${t}">${t}</option>`).join('');

  const form=el('contact-form');
  const submitBtn=el('form-submit');
  if(form && submitBtn){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      submitBtn.disabled=true;submitBtn.textContent='Sending…';
      await new Promise(r=>setTimeout(r,1200));
      form.style.display='none';
      const succ=el('form-success');
      if(succ){succ.querySelector('.fsuccess-body').textContent=ct.success_message;succ.classList.add('show');}
    });
  }
}

// ─── LOADER ──────────────────────────────────────────────────
function hideLoader(){
  const l=document.getElementById('loader');
  if(l) setTimeout(()=>l.classList.add('done'),250);
}

// ─── INIT ────────────────────────────────────────────────────
async function init(){
  await loadContent();
  buildNav();
  buildFooter();
  initBars();

  const page=location.pathname.split('/').pop()||'index.html';
  if(page==='index.html'||page==='') buildHome();
  if(page==='services.html') buildServices();
  if(page==='portfolio.html') buildPortfolio();
  if(page==='about.html') buildAbout();
  if(page==='contact.html') buildContact();

  initReveal();
  initCanvas('hero-canvas');
  initCanvas('page-canvas');
  initBars(); // re-run after dynamic bars inserted
  hideLoader();
}

document.addEventListener('DOMContentLoaded',init);

// ─── FALLBACK CONTENT (works offline/file://) ─────────────────
const FALLBACK={
  brand:{name:"BrightTone",tagline:"Event"},
  nav:{links:[{label:"Home",href:"index.html"},{label:"Services",href:"services.html"},{label:"Portfolio",href:"portfolio.html"},{label:"About",href:"about.html"},{label:"Contact",href:"contact.html"}],cta:{label:"Book Now",href:"contact.html"}},
  home:{
    hero:{badge:"Professional Sound Systems",headline:"Sound That",headline_accent:"Moves Crowds.",subheadline:"We design, install, and operate world-class audio experiences for concerts, weddings, and corporate events across Rwanda and beyond.",cta_primary:{label:"Explore Services",href:"services.html"},cta_secondary:{label:"See Our Work",href:"portfolio.html"}},
    stats:[{value:"500+",label:"Events Delivered"},{value:"8+",label:"Years Experience"},{value:"100%",label:"Client Satisfaction"},{value:"24/7",label:"Support Available"}],

    service_cards:[{icon:"concert",  image:"assets/services/concert.jpg",title:"Concerts & Festivals",body:"Line arrays, subwoofer stacks, monitor systems, and full stage management for live music at any scale.",href:"services.html"},{icon:"wedding",title:"Weddings & Celebrations",body:"Crystal-clear ceremony audio, elegant background music, and powerful dance-floor systems for your perfect day.",href:"services.html"},{icon:"corporate",title:"Corporate Events",body:"Conference PA systems, lavalier microphones, presentation audio, and broadcast-grade reliability.",href:"services.html"}],


    testimonials:[{quote:"BrightTone transformed our outdoor concert. The sound reached every corner of the venue with zero distortion. Absolutely phenomenal work.",name:"Amina Uwase",role:"Event Director, Kigali Live Festival"},{quote:"Our wedding audio was flawless. Guests at the back heard every vow perfectly. The team was professional, discreet, and incredibly helpful.",name:"Jean-Pierre Habimana",role:"Groom, Kigali Garden Wedding"},{quote:"For our annual summit we needed crystal clear audio for 800 delegates. BrightTone delivered on time and beyond expectations.",name:"Claire Nkurunziza",role:"Head of Operations, Rwanda Tech Summit"}],
    cta_band:{title:"Ready to Elevate Your Event?",body:"Tell us about your vision and we'll design the perfect sound system for it.",cta:{label:"Get a Free Quote",href:"contact.html"}}
  },
  services:{hero:{label:"Our Services",title:"Audio Solutions for Every Occasion",body:"BrightTone offers end-to-end sound design, equipment rental, and live operation for events of all sizes."},items:[{id:"concerts",icon:"concert",title:"Concerts & Festivals",body:"We deploy professional line-array systems, high-output subwoofers, stage monitors, and front-of-house mixing desks.",features:["Line-array speaker systems","Subwoofer bass stacks","Stage monitor wedges & IEM","Delay towers for large venues","Professional mixing console","On-site audio engineering"]},{id:"weddings",icon:"wedding",title:"Weddings & Celebrations",body:"From the ceremony to the reception dance floor, we provide elegant, unobtrusive systems that sound spectacular.",features:["Wireless lapel & handheld mics","Ceremony & reception zones","Background music systems","DJ booth integration","Ambient lighting sync","Dedicated on-site technician"]},{id:"corporate",icon:"corporate",title:"Corporate Events",body:"Conferences, product launches, award ceremonies, and hybrid events with broadcast-grade reliability.",features:["Conference PA systems","Lavalier & podium microphones","Panel discussion setups","Live-stream audio integration","Hearing loop systems","Technical rehearsal support"]}],equipment_brands:["d&b audiotechnik","L-Acoustics","Shure","Sennheiser","Allen & Heath","DiGiCo","Crown","QSC"]},
  portfolio:{items:[{title:"Kigali Jazz Festival",category:"Concerts",desc:"Full outdoor line-array deployment for 3,000 attendees across two stages.",year:"2024"},{title:"Amira & David Wedding",category:"Weddings",desc:"Elegant garden ceremony and rooftop reception with ambient sound zones.",year:"2024"},{title:"Rwanda Tech Summit",category:"Corporate",desc:"800-delegate conference with live-stream integration.",year:"2024"},{title:"Nyamata Music Night",category:"Concerts",desc:"Intimate open-air concert featuring local artists.",year:"2023"},{title:"EcoBank Annual Gala",category:"Corporate",desc:"Award ceremony with wireless mic system.",year:"2023"},{title:"Sophie & Eric Wedding",category:"Weddings",desc:"Church ceremony to hotel ballroom — seamless audio transition.",year:"2023"}]},
  about:{story:["BrightTone Event was born from a simple belief: every event deserves sound that moves people. Founded by audio engineers with years of experience in live events and studio production.","Today, BrightTone is trusted by festival organizers, wedding planners, and corporate event managers across Rwanda and East Africa.","We don't just rent equipment — we partner with you from planning to performance."],values:[{icon:"target",title:"Precision",body:"Every decibel matters. We tune systems meticulously for each venue's unique acoustics."},{icon:"shield",title:"Reliability",body:"Backup systems, redundant signal paths, and 24/7 support mean your event never stops."},{icon:"zap",title:"Passion",body:"We love live sound. That energy shows in everything we deliver."},{icon:"cpu",title:"Innovation",body:"We continuously invest in cutting-edge equipment and stay ahead of industry trends."}],team:[{name:"Eric Munyana",role:"Founder & Lead Audio Engineer",bio:"10+ years in live sound and studio engineering. Has mixed for international artists across Africa."},{name:"Grace Ingabire",role:"Operations Manager",bio:"Coordinates logistics and client relations, ensuring every event runs like clockwork."},{name:"Patrick Nziza",role:"Systems Technician",bio:"Specialist in rigging, cabling, and signal routing. Passionate about clean installs."}]},
  contact:{phone:"+250 788 000 000",email:"hello@brighttone.rw",location:"Kigali, Rwanda",instagram:"https://www.instagram.com/brighttone_event/",whatsapp:"https://wa.me/250788000000",event_types:["Concert / Festival","Wedding / Celebration","Corporate Event","Other"],success_message:"Thank you! We'll be in touch within 24 hours."},
  footer:{tagline:"Professional sound systems for every occasion.",copyright:"© 2026 BrightTone Event. All rights reserved. Developed by Innovatoor.",instagram:"https://www.instagram.com/brighttone_event/",}
};