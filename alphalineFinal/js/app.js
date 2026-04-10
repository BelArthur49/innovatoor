// ===== LOAD CONTENT FROM JSON =====
let contentData = {};

async function loadContent() {
    try {
        const response = await fetch('content.json');
        contentData = await response.json();
        renderContent();
    } catch (error) {
        console.error('Error loading content:', error);
        loadDefaultContent();
    }
}

function loadDefaultContent() {
    contentData = {
        features: [],
        parallax: [],
        capabilities: [],
        services: [],
        testimonials: [],
        projects: [],
        articles: [],
        contact: [],
        footer: {}
    };
    renderContent();
}

function renderIcon(icon, title) {
    if (!icon) return '';

    // If it's an image file (svg, png, jpg, jpeg, webp)
    const isImage = /\.(svg|png|jpg|jpeg|webp)$/i.test(icon);

    if (isImage) {
        return `<img src="${icon}" alt="${title}">`;
    }

    // Otherwise it's emoji or inline SVG
    return icon;
}

function renderContent() {
    // Render Features
    const featuresGrid = document.getElementById('featuresGrid');
    if (featuresGrid && contentData.features) {
        featuresGrid.innerHTML = contentData.features.map(feature => `
            <div class="feature-card">
                <div class="feature-icon">${renderIcon(feature.icon, feature.title)}</div>
                <h3 class="feature-title">${feature.title}</h3>
                <p class="feature-text">${feature.text}</p>
            </div>
        `).join('');
    }

    // Render Parallax Content
    const parallax1 = document.getElementById('parallax1');
    const parallax2 = document.getElementById('parallax2');
    const parallaxContent1 = document.getElementById('parallaxContent1');
    const parallaxContent2 = document.getElementById('parallaxContent2');

    if (parallax1 && contentData.parallax && contentData.parallax[0]) {
        parallax1.style.backgroundImage = `url(${contentData.parallax[0].backgroundImage})`;
        parallaxContent1.innerHTML = `
            <h2>${contentData.parallax[0].title}</h2>
            <p>${contentData.parallax[0].text}</p>
        `;
    }

    if (parallax2 && contentData.parallax && contentData.parallax[1]) {
        parallax2.style.backgroundImage = `url(${contentData.parallax[1].backgroundImage})`;
        parallaxContent2.innerHTML = `
            <h2>${contentData.parallax[1].title}</h2>
            <p>${contentData.parallax[1].text}</p>
        `;
    }

    // Render Capabilities
    const capabilitiesContainer = document.getElementById('capabilitiesContainer');
    if (capabilitiesContainer && contentData.capabilities) {
        capabilitiesContainer.innerHTML = contentData.capabilities.map(cap => `
            <div class="capability-item">
                <img src="${cap.image}" loading="lazy" alt="${cap.title}" class="capability-image">
                <div class="capability-content">
                    <h3>${cap.title}</h3>
                    <p>${cap.description}</p>
                    <ul class="capability-list">
                        ${cap.list.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    // Render Services
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid && contentData.services) {
        servicesGrid.classList.add("active");
        servicesGrid.innerHTML = contentData.services.map(service => `
            <div class="service-card">
                <div class="service-icon">${renderIcon(service.icon, service.title)}</div>
                <h3 class="service-title">${service.title}</h3>
                <p class="service-preview">${service.preview}</p>
            </div>
        `).join('');
    }

    // Render Testimonials
    // FIX: provide a fallback avatar if one is missing
    const testimonialSlider = document.getElementById('testimonialSlider');
    if (testimonialSlider && contentData.testimonials) {
        testimonialSlider.innerHTML = contentData.testimonials.map(test => `
            <div class="testimonial-card">
                <p class="testimonial-text">"${test.text}"</p>
                <div class="testimonial-author">
                    <img src="${test.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(test.author) + '&background=070f83&color=fff&size=60'}" alt="${test.author}" class="testimonial-avatar">
                    <div class="testimonial-info">
                        <h4>${test.author}</h4>
                        <p>${test.position}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render Projects (CLICKABLE WITH MODAL)
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid && contentData.projects) {
        projectsGrid.innerHTML = contentData.projects.map((project, index) => `
            <div class="project-card" data-category="${project.category}" data-project-index="${index}" onclick="openProjectModal(${index})">
                <img src="${project.image}" loading="lazy" class="project-image" alt="${project.title}">
                <div class="project-overlay">
                    <div class="project-category">${project.category}</div>
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                </div>
            </div>
        `).join('');
        projectsGrid.classList.add("active");
    }

    // Render Insights page
    renderInsightsPage();

    // Render Contact Details
    const contactDetails = document.getElementById('contactDetails');
    if (contactDetails && contentData.contact) {
        contactDetails.innerHTML = contentData.contact.map(detail => `
            <div class="contact-item">
                <div class="contact-item-icon">${detail.icon}</div>
                <div class="contact-item-content">
                    <h3>${detail.title}</h3>
                    <p>${detail.text}</p>
                </div>
            </div>
        `).join('');
    }

    // Render Footer (multiple instances)
    // FIX: Use current year dynamically instead of hardcoded 2026
    if (contentData.footer) {
        const currentYear = new Date().getFullYear();

        const footerHTML = `
            <div class="footer-section">
                <div class="footer-brand">
                    <div class="footer-logo-text">ALPHA LINE GROUP</div>
                </div>
                <p>${contentData.footer.description || ''}</p>
                <div class="social-links">
                    <a href="${(contentData.footer.social && contentData.footer.social.facebook) || '#'}" target="_blank" rel="noopener" class="social-link"><i class="fab fa-facebook-f"></i></a>
                    <a href="${(contentData.footer.social && contentData.footer.social.instagram) || '#'}" target="_blank" rel="noopener" class="social-link"><i class="fab fa-instagram"></i></a>
                    <a href="${(contentData.footer.social && contentData.footer.social.twitter) || '#'}" target="_blank" rel="noopener" class="social-link"><i class="fab fa-x-twitter"></i></a>
                    <a href="${(contentData.footer.social && contentData.footer.social.linkedin) || '#'}" target="_blank" rel="noopener" class="social-link"><i class="fab fa-linkedin-in"></i></a>
                </div>
            </div>
            <div class="footer-section">
                <h3>Services</h3>
                <ul class="footer-links">
                    ${(contentData.footer.services || []).map(service => `<li><a href="#">${service}</a></li>`).join('')}
                </ul>
            </div>
            <div class="footer-section">
                <h3>Contact</h3>
                <p>📍 ${(contentData.footer.contact && contentData.footer.contact.address) || ''}</p>
                <p>📞 ${(contentData.footer.contact && contentData.footer.contact.phone) || ''}</p>
                <p>✉️ ${(contentData.footer.contact && contentData.footer.contact.email) || ''}</p>
            </div>
        `;

        // FIX: Dynamic year in footer copyright
        const footerBottomHTML = `&copy; ${currentYear} Alpha Line Construction. All rights reserved. | Developed by <a href="https://innovatoor.com" target="_blank" style="color: rgba(56, 145, 248, 0.949) !important;">Innovatoor</a>`;

        const footerIds = ['footerContent', 'footerContentAbout', 'footerContentWork', 'footerContentContact', 'footerContentServices', 'footerContentInsights'];
        footerIds.forEach(footerId => {
            const footer = document.getElementById(footerId);
            if (footer) footer.innerHTML = footerHTML;
        });

        // Update copyright year in all footer-bottom paragraphs
        document.querySelectorAll('.footer-bottom p').forEach(p => {
            p.innerHTML = footerBottomHTML;
        });
    }
}

// FIX: renderInsightsPage is now a top-level function so it can be called
// from showPage() when the insights page is opened
function renderInsightsPage() {
    const insightsGrid = document.getElementById('insightsGrid');
    if (!insightsGrid || !contentData.articles) return;

    insightsGrid.innerHTML = contentData.articles.map(article => `
        <div class="insight-card" onclick="openArticle('${article.title.replace(/'/g, "\\'")}')">
            <img
                class="insight-image"
                src="${article.image}?w=600&q=60&fit=crop"
                loading="lazy"
                decoding="async"
                alt="${article.title}"
            >
            <div class="insight-body">
                <span class="insight-category">${article.category}</span>
                <h3>${article.title}</h3>
                <p>${article.excerpt}</p>
                <div class="insight-meta">✍️ ${article.author || 'Alpha Line Team'} · ${article.readingTime || '3 min read'}</div>
                <span class="insight-read-more">Read Article →</span>
            </div>
        </div>
    `).join('');
}

// Load content on page load
loadContent();

// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const pages = document.querySelectorAll('.page');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// FIX: Use data-page attribute on nav links for reliable active state matching
function showPage(pageName) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');

    // FIX: Match nav links by data-page attribute instead of text content
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    window.scrollTo(0, 0);
    navMenu.classList.remove('active');
    menuToggle.classList.remove('active');

    // FIX: Reset stats animation when returning to home
    if (pageName === 'home') {
        statsAnimated = false;
        // Delay slightly so the page is visible before checking viewport
        setTimeout(checkStatsInView, 100);
    }

    // FIX: Re-render insights when opening that page (in case content loaded after first paint)
    if (pageName === 'insights') {
        renderInsightsPage();
    }

    // FIX: Trigger scroll reveal for elements already in viewport on the new page
    setTimeout(revealOnScroll, 50);

    // FIX: Reset work filter UI when returning to work page
    if (pageName === 'work') {
        resetWorkFilter();
    }
}

function scrollToInvestor() {
    if (!document.getElementById('home').classList.contains('active')) {
        showPage('home');
        setTimeout(() => {
            document.querySelector('.investor-section').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        document.querySelector('.investor-section').scrollIntoView({ behavior: 'smooth' });
    }
}

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// ===== PARALLAX EFFECT =====
function updateParallax() {
    // FIX: Only run parallax when home page is active
    if (!document.getElementById('home').classList.contains('active')) return;

    const parallaxSections = document.querySelectorAll('.parallax-section');
    parallaxSections.forEach(section => {
        const parallaxBg = section.querySelector('.parallax-bg');
        if (!parallaxBg) return;

        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            const scrolled = window.pageYOffset;
            const sectionTop = section.offsetTop;
            const speed = isMobile() ? 0.2 : 0.5;
            const parallaxAmount = (scrolled - sectionTop) * speed;
            parallaxBg.style.transform = `translate3d(0, ${parallaxAmount}px, 0)`;
        }
    });
}

window.addEventListener('scroll', updateParallax);
window.addEventListener('resize', updateParallax);
updateParallax();

// ===== CANVAS ANIMATION =====
const canvas = document.getElementById('tools-canvas');
const ctx = canvas.getContext('2d');
let tools = [];
let animationFrameId = null; // FIX: track animation frame to pause/resume

const toolSymbols = ['🔨', '⚒️', '👷', '🪚', '📐', '📏', '🏗️', '🗺️', '🪓', '🧭', '🧰', '🪜', '🧱', '🚧', '🔧', '🚽', '🏢', '🏘️', '🦺'];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Tool {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.symbol = toolSymbols[Math.floor(Math.random() * toolSymbols.length)];
        this.size = 25 + Math.random() * 20;
        this.opacity = 0.5 + Math.random() * 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        if (this.x < -100) this.x = canvas.width + 100;
        if (this.x > canvas.width + 100) this.x = -100;
        if (this.y < -100) this.y = canvas.height + 100;
        if (this.y > canvas.height + 100) this.y = -100;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a3cff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 120, 255, 0.7)';
        ctx.fillText(this.symbol, 0, 0);
        ctx.restore();
    }
}

function drawConnections() {
    for (let i = 0; i < tools.length; i++) {
        for (let j = i + 1; j < tools.length; j++) {
            const dx = tools[i].x - tools[j].x;
            const dy = tools[i].y - tools[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                const opacity = (1 - dist / 180) * 0.25;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(tools[i].x, tools[i].y);
                ctx.lineTo(tools[j].x, tools[j].y);
                ctx.stroke();
            }
        }
    }
}

function initTools() {
    tools = [];
    const count = isMobile() ? 6 : 50;
    for (let i = 0; i < count; i++) {
        tools.push(new Tool());
    }
}

// FIX: Unified animation loop that checks page visibility before continuing
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pause animation when home page is not active
    if (!document.getElementById('home').classList.contains('active')) {
        animationFrameId = null;
        return;
    }

    if (!isMobile()) {
        drawConnections();
    }
    tools.forEach(tool => {
        tool.update();
        tool.draw();
    });
    animationFrameId = requestAnimationFrame(animate);
}

function startCanvas() {
    resize();
    if (!isMobile()) {
        window.addEventListener('resize', resize);
    }
    initTools();
    animate();
}

// FIX: Resume canvas when home page becomes active (called from showPage)
function resumeCanvas() {
    if (!animationFrameId) {
        animate();
    }
}

function isMobile() {
    return window.innerWidth < 768;
}

startCanvas();

// ===== PROJECT MODAL =====
const modal = document.getElementById('modal');

function openProjectModal(projectIndex) {
    const project = contentData.projects[projectIndex];
    document.getElementById('modal-header').style.backgroundImage = `url(${project.image})`;
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-description').innerHTML = `
        <p><strong>Category:</strong> ${project.category.charAt(0).toUpperCase() + project.category.slice(1)}</p>
        <p>${project.description}</p>
    `;

    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    const galleryImages = (project.gallery && project.gallery.length > 0) ? project.gallery : [project.image];
    galleryImages.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${img}" loading="lazy" alt="${project.title}">`;
        gallery.appendChild(item);
    });

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeArticle();
    }
});

// ===== ARTICLE MODAL =====
function openArticle(title) {
    const article = contentData.articles.find(a => a.title === title);
    if (!article) return;

    document.getElementById('articleTitle').textContent = article.title;

    // FIX: Use innerHTML so formatted content renders correctly
    // Wrap plain-text content in paragraphs for readability
    const formatted = article.content
        .split('\n\n')
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
    document.getElementById('articleText').innerHTML = formatted || `<p>${article.content}</p>`;

    document.getElementById('articleImage').src = article.image;
    document.getElementById('articleAuthor').textContent = article.author || 'Alpha Line Team';
    document.getElementById('articleTime').textContent = article.readingTime || '3 min read';
    document.getElementById('linkedinShare').href =
        'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href);

    document.getElementById('articleModal').classList.add('active');
}

function closeArticle() {
    document.getElementById('articleModal').classList.remove('active');
}

// ===== WORK FILTER =====
let activeFilter = 'all'; // FIX: track filter state so it can be reset

function resetWorkFilter() {
    activeFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
    });
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.display = 'block';
    });
}

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        activeFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.project-card').forEach(card => {
            const category = card.getAttribute('data-category');
            card.style.display = (filter === 'all' || category === filter) ? 'block' : 'none';
        });
    });
});

// ===== SCROLL REVEAL =====
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < windowHeight - 120) {
            element.classList.add('active');
            const grid = element.querySelector('.services-grid, .capabilities-container');
            if (grid) grid.classList.add('active');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// ===== STATS COUNTING ANIMATION =====
function animateStats() {
    const statItems = document.querySelectorAll('.stats-section-home .stat-item');
    statItems.forEach(item => {
        const target = parseInt(item.getAttribute('data-target'));
        const numberElement = item.querySelector('.stat-number');
        let current = 0;
        const increment = target / 50;
        const stepTime = 2000 / 50; // 2 second duration over 50 steps

        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                numberElement.textContent = target;
                clearInterval(counter);
            } else {
                numberElement.textContent = Math.floor(current);
            }
        }, stepTime);
    });
}

let statsAnimated = false;

function checkStatsInView() {
    const statsSection = document.querySelector('.stats-section-home');
    if (!statsSection || statsAnimated) return;

    // FIX: Only check when home page is active
    if (!document.getElementById('home').classList.contains('active')) return;

    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
        statsAnimated = true;
        animateStats();
    }
}

window.addEventListener('scroll', checkStatsInView);
window.addEventListener('load', () => {
    revealOnScroll();
    checkStatsInView();
});