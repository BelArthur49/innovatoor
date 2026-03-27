// ===== LOAD CONTENT FROM JSON =====
let contentData = {};

async function loadContent() {
    try {
        const response = await fetch('content.json');
        contentData = await response.json();
        renderContent();
    } catch (error) {
        console.error('Error loading content:', error);
        // Load default content if JSON fails
        loadDefaultContent();
    }
}

function loadDefaultContent() {
    contentData = {
        features: [{
            icon: "🏗️",
            title: "Expert Engineering",
            text: "State-of-the-art structural and civil engineering solutions"
        }, {
            icon: "⚡",
            title: "Fast Delivery",
            text: "On-time project completion with zero compromises"
        }, {
            icon: "🛡️",
            title: "Quality Assured",
            text: "Premium materials and rigorous quality control"
        }, {
            icon: "🌍",
            title: "Sustainable Build",
            text: "Eco-friendly construction practices for a better tomorrow"
        }],
        parallax: [{
            title: "Precision Engineering",
            text: "Our team of certified engineers brings decades of experience in structural design, geotechnical analysis, and project optimization to ensure every build exceeds industry standards."
        }, {
            title: "Advanced Technology",
            text: "Utilizing BIM modeling, drone surveying, and AI-powered project management to deliver construction excellence with unprecedented precision and efficiency."
        }],
        capabilities: [{
            title: "Structural Engineering",
            image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop",
            description: "Our structural engineering team designs safe, efficient, and innovative building systems that stand the test of time.",
            list: ["Steel & Concrete Design", "Foundation Engineering", "Seismic Analysis", "Load Calculations"]
        }, {
            title: "MEP Systems",
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
            description: "Comprehensive mechanical, electrical, and plumbing design services that integrate seamlessly with your building's architecture.",
            list: ["HVAC Design", "Electrical Systems", "Plumbing & Fire Protection", "Energy Optimization"]
        }, {
            title: "Site Development",
            image: "https://images.unsplash.com/photo-1590496793907-4e9ed0e9c5f2?w=800&h=600&fit=crop",
            description: "Complete site preparation services including earthwork, grading, and utility installation for residential and commercial projects.",
            list: ["Land Clearing", "Excavation & Grading", "Utility Installation", "Erosion Control"]
        }],
        services: [{
            icon: "🏘️",
            title: "Residential Construction",
            preview: "Custom homes built to perfection",
            key: "residential"
        }, {
            icon: "🏢",
            title: "Commercial Projects",
            preview: "Professional spaces for your business",
            key: "commercial"
        }, {
            icon: "🔨",
            title: "Renovation & Remodeling",
            preview: "Transform your existing space",
            key: "renovation"
        }, {
            icon: "📋",
            title: "Project Management",
            preview: "Expert coordination from start to finish",
            key: "management"
        }, {
            icon: "⚙️",
            title: "Engineering Services",
            preview: "Technical excellence in design",
            key: "engineering"
        }, {
            icon: "🚜",
            title: "Site Development",
            preview: "Complete land preparation solutions",
            key: "site"
        }, {
            icon: "🌱",
            title: "Green Building",
            preview: "Sustainable construction for the future",
            key: "green"
        }],
        testimonials: [{
            text: "Alpha Line transformed our vision into reality. Their attention to detail and commitment to quality is unmatched in the industry.",
            author: "Sarah Johnson",
            position: "CEO, Tech Innovations",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        }, {
            text: "Working with Alpha Line was a game-changer for our development project. Professional, reliable, and exceptional results.",
            author: "Michael Chen",
            position: "Property Developer",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        }, {
            text: "The engineering expertise and innovative solutions provided by Alpha Line exceeded all our expectations. Highly recommended!",
            author: "Emily Rodriguez",
            position: "Architect",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        }],
        projects: [{
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
            category: "residential",
            title: "Skyline Modern Villa",
            description: "A stunning 5-bedroom contemporary masterpiece."
        }, {
            image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
            category: "commercial",
            title: "Apex Corporate Tower",
            description: "25-story office complex with LEED certification."
        }, {
            image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
            category: "residential",
            title: "Lakeside Estate",
            description: "Luxury waterfront property with panoramic views."
        }, {
            image: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&h=600&fit=crop",
            category: "renovation",
            title: "Historic Downtown Loft",
            description: "Complete transformation of a 1920s warehouse."
        }, {
            image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
            category: "commercial",
            title: "Metro Shopping Plaza",
            description: "Premium retail space with cutting-edge design."
        }, {
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
            category: "residential",
            title: "Alpine Mountain Retreat",
            description: "Eco-friendly mountain home blending modern design."
        }],
        contact: [{
            icon: "📍",
            title: "Address",
            text: "1234 Construction Blvd, Building District, City 12345"
        }, {
            icon: "📞",
            title: "Phone",
            text: "+1 (555) 123-4567"
        }, {
            icon: "✉️",
            title: "Email",
            text: "info@alphaline.construction"
        }, {
            icon: "🕐",
            title: "Business Hours",
            text: "Mon - Fri: 8:00 AM - 6:00 PM"
        }],
        footer: {
            description: "Start Your Project with Structure Whether you are building your home, investing in property, or seeking cost-optimized execution, Alpha Line Group is ready to engineer your vision..",
            quickLinks: ["Home", "About Us", "Contact"],
            services: ["Residential Construction", "Commercial Projects", "Renovation", "Green Building"],
            contact: {
                address: "1234 Construction Blvd<br>Building District, City 12345",
                phone: "+1 (555) 123-4567",
                email: "info@alphaline.construction"
            }
        }
    };
    renderContent();
}

function renderContent() {
    // Render Features
    const featuresGrid = document.getElementById('featuresGrid');
    featuresGrid.innerHTML = contentData.features.map(feature => `
                <div class="feature-card">
                    <div class="feature-icon">${feature.icon}</div>
                    <h3 class="feature-title">${feature.title}</h3>
                    <p class="feature-text">${feature.text}</p>
                </div>
            `).join('');

    // Render Parallax Content
    document.getElementById('parallax1').style.backgroundImage = `url(${contentData.parallax[0].backgroundImage})`;
    document.getElementById('parallaxContent1').innerHTML = `
                <h2>${contentData.parallax[0].title}</h2>
                <p>${contentData.parallax[0].text}</p>
            `;
    document.getElementById('parallax2').style.backgroundImage = `url(${contentData.parallax[1].backgroundImage})`;
    document.getElementById('parallaxContent2').innerHTML = `
                <h2>${contentData.parallax[1].title}</h2>
                <p>${contentData.parallax[1].text}</p>
            `;

    // Render Capabilities
    const capabilitiesContainer = document.getElementById('capabilitiesContainer');
    capabilitiesContainer.innerHTML = contentData.capabilities.map(cap => `
                <div class="capability-item">
                    <img src="${cap.image}" alt="${cap.title}" class="capability-image">
                    <div class="capability-content">
                        <h3>${cap.title}</h3>
                        <p>${cap.description}</p>
                        <ul class="capability-list">
                            ${cap.list.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');

            // Render Services
            const servicesGrid = document.getElementById('servicesGrid');
            if (servicesGrid) {
                servicesGrid.classList.add("active");
            }
            servicesGrid.innerHTML = contentData.services.map(service => `
                <div class="service-card" onclick="openModal('${service.key}')">
                    <div class="service-icon">${service.icon}</div>
                    <h3 class="service-title">${service.title}</h3>
                    <p class="service-preview">${service.preview}</p>
                </div>
            `).join('');
            

            // Render Testimonials
            const testimonialSlider = document.getElementById('testimonialSlider');
            testimonialSlider.innerHTML = contentData.testimonials.map(test => `
                <div class="testimonial-card">
                    <p class="testimonial-text">"${test.text}"</p>
                    <div class="testimonial-author">
                        <img src="${test.avatar}" alt="${test.author}" class="testimonial-avatar">
                        <div class="testimonial-info">
                            <h4>${test.author}</h4>
                            <p>${test.position}</p>
                        </div>
                    </div>
                </div>
            `).join('');

            // Render Projects
            const projectsGrid = document.getElementById('projectsGrid');

            if (projectsGrid && contentData.projects) {

            projectsGrid.innerHTML = contentData.projects.map(project => `
            <div class="project-card" data-category="${project.category}">
            <img src="${project.image}" class="project-image">

            <div class="project-overlay">
            <div class="project-category">${project.category}</div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            </div>

            </div>
            `).join('');
            projectsGrid.classList.add("active");

            }

            


            // ADD THIS RIGHT AFTER PROJECTS


            // Render Contact Details
            const contactDetails = document.getElementById('contactDetails');
            contactDetails.innerHTML = contentData.contact.map(detail => `
                <div class="contact-item">
                    <div class="contact-item-icon">${detail.icon}</div>
                    <div class="contact-item-content">
                        <h3>${detail.title}</h3>
                        <p>${detail.text}</p>
                    </div>
                </div>
            `).join('');

            // Render Footer (multiple instances)
            const footerHTML = `
                <div class="footer-section">

                    <div class="footer-brand">
                        
                        <div class="footer-logo-text">ALPHA LINE GROUP</div>
                    </div>

                    <p>${contentData.footer.description}</p>

                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-x-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-linkedin-in"></i></a>
                    </div>

                </div>
                </div>
               
                <div class="footer-section">
                    <h3>Services</h3>
                    <ul class="footer-links">
                        ${contentData.footer.services.map(service => `<li><a href="#">${service}</a></li>`).join('')}
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Contact</h3>
                    <p>📍 ${contentData.footer.contact.address}</p>
                    <p>📞 ${contentData.footer.contact.phone}</p>
                    <p>✉️ ${contentData.footer.contact.email}</p>
                </div>
            `;

            document.getElementById('footerContent').innerHTML = footerHTML;
            document.getElementById('footerContentAbout').innerHTML = footerHTML;
            document.getElementById('footerContentWork').innerHTML = footerHTML;
            document.getElementById('footerContentContact').innerHTML = footerHTML;
            document.getElementById('footerContentServices').innerHTML = footerHTML;

            // ===== Render Articles =====

            const articlesGrid = document.getElementById('articlesGrid');

            if (articlesGrid && contentData.articles) {

                let html = '';

                contentData.articles.forEach(article => {

                    html += `
                <div class="article-card" onclick="openArticle('${article.title}')">

                        <div class="article-image">
                            <img src="${article.image}" alt="${article.title}">
                        </div>

                        <div class="article-content">
                            <span class="article-category">${article.category}</span>
                            <h3>${article.title}</h3>
                            <p>${article.excerpt}</p>
                        </div>

                    </div>
                    `;

                });

                articlesGrid.innerHTML = html;
            }
                    }

        // Load content on page load
        loadContent();

        // ===== NAVIGATION =====
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');
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

        function showPage(pageName) {
            pages.forEach(page => {
                page.classList.remove('active');
            });

            document.getElementById(pageName).classList.add('active');

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.textContent.toLowerCase().includes(pageName) ||
                    (pageName === 'home' && link.textContent.toLowerCase() === 'home')) {
                    link.classList.add('active');
                }
            });

            window.scrollTo(0, 0);
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }

        function scrollToInvestor(){

            if(!document.getElementById('home').classList.contains('active')){
                showPage('home');

                setTimeout(()=>{
                    document.querySelector('.investor-section').scrollIntoView({
                        behavior:'smooth'
                    });
                },50);

            } else {

                document.querySelector('.investor-section').scrollIntoView({
                    behavior:'smooth'
                });

            }

        }

        function scrollToInsights(){

            if(!document.getElementById('home').classList.contains('active')){
                showPage('home');

                setTimeout(()=>{
                    document.querySelector('.articles-section').scrollIntoView({
                        behavior:'smooth'
                    });
                },50);

            } else {

                document.querySelector('.articles-section').scrollIntoView({
                    behavior:'smooth'
                });

            }

        }
        

        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // ===== PARALLAX EFFECT =====
        function updateParallax() {
            const parallaxSections = document.querySelectorAll('.parallax-section');
            
            parallaxSections.forEach(section => {
                const parallaxBg = section.querySelector('.parallax-bg');
                if (!parallaxBg) return;
                
                const rect = section.getBoundingClientRect();
                const scrolled = window.pageYOffset;
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                // Only apply parallax when section is in viewport
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    // Calculate parallax based on scroll position relative to section
                    const parallaxAmount = (scrolled - sectionTop) * 0.5;
                    parallaxBg.style.transform = `translate3d(0, ${parallaxAmount}px, 0)`;
                }
            });
        }

        if (!isMobile()) {
            window.addEventListener('scroll', updateParallax);
            window.addEventListener('resize', updateParallax);
        }
        window.addEventListener('resize', updateParallax);
        // Initial call
        updateParallax();

        // ===== CANVAS ANIMATION =====
        const canvas = document.getElementById('tools-canvas');
        const ctx = canvas.getContext('2d');
        let tools = [];

        const toolSymbols = ['🔨', '⚒️', '🔭', '👷', '🪚', '📐', '📏', '🏗️', '🗺️', '🪓', '⚙️', '🔩', '🧭', '🧰', '🗜️', '🪜', '🧱', '🚧' ,'🧮', '🦺'];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class Tool {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 3;//speed of the emoji
                this.vy = (Math.random() - 0.5) * 3;//speed of the emoji
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
                ctx.shadowBlur = 25;
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
            for (let i = 0; i < 50; i++) {
                tools.push(new Tool());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            tools.forEach(tool => tool.update());
            drawConnections();
            tools.forEach(tool => tool.draw());
            requestAnimationFrame(animate);
        }

        function isMobile() {
        return window.innerWidth < 768;
        }

        if (!isMobile()) {
            resize();
            window.addEventListener('resize', resize);
            initTools();
            animate();
        } else {
            // disable canvas on mobile
            const canvas = document.getElementById('tools-canvas');
            if (canvas) canvas.style.display = "none";
        }

        // ===== SERVICE DATA =====
        const serviceData = {
        turnkey: {
    title: "Turnkey Design & Build",
    background: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200",
    description: "Complete project delivery under one accountable system including architecture, engineering, procurement and construction.",
    gallery: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
    ]
},

construction: {
    title: "Residential & Commercial Construction",
    background: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
    description: "Engineered residential and commercial structures including villas, apartments, office buildings and retail developments.",
    gallery: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"
    ]
},

realestate: {
    title: "Real Estate Development",
    background: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200",
    description: "Development of apartments, rental income properties, and investment-driven housing projects.",
    gallery: [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
        "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400"
    ]
},

cost: {
    title: "Cost Optimization & Construction Intelligence",
    background: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200",
    description: "Financial engineering for construction including BOQ preparation, value engineering and project cost benchmarking.",
    gallery: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=400",
        "https://images.unsplash.com/photo-1554224155-1696413565d3?w=400",
        "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400"
    ]
},
            residential: {
                title: "Residential Construction",
                background: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=400&fit=crop",
                description: "Alpha Line specializes in building dream homes from the ground up. Our residential construction services include custom home building, townhouses, and multi-family developments.<br><br>We work closely with homeowners and architects to bring visions to life, ensuring every detail meets the highest standards of quality and craftsmanship.",
                gallery: [
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=300&fit=crop"
                ]
            },
            commercial: {
                title: "Commercial Projects",
                background: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop",
                description: "We deliver exceptional commercial construction solutions for businesses of all sizes. From office buildings and retail spaces to industrial facilities, Alpha Line has the expertise to handle complex commercial projects.<br><br>Our team understands the unique challenges of commercial construction, including tight deadlines and budget constraints.",
                gallery: [
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop"
                ]
            },
            renovation: {
                title: "Renovation & Remodeling",
                background: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200&h=400&fit=crop",
                description: "Transform your existing space with Alpha Line's expert renovation and remodeling services. Whether you're updating a single room or undertaking a complete property transformation, we bring fresh ideas and skilled craftsmanship to every project.",
                gallery: [
                    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400&h=300&fit=crop"
                ]
            },
            management: {
                title: "Project Management",
                background: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=400&fit=crop",
                description: "Alpha Line's comprehensive project management services ensure your construction project runs smoothly from start to finish. Our experienced project managers coordinate all aspects of construction.",
                gallery: [
                    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=400&h=300&fit=crop"
                ]
            },
            engineering: {
                title: "Engineering Services",
                background: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=400&fit=crop",
                description: "Our in-house engineering team provides comprehensive technical expertise for all types of construction projects. From structural engineering to MEP design, we offer complete engineering solutions.",
                gallery: [
                    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581092918484-8313e1f7e8a6?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=400&h=300&fit=crop"
                ]
            },
            site: {
                title: "Site Development",
                background: "https://images.unsplash.com/photo-1590496793907-4e9ed0e9c5f2?w=1200&h=400&fit=crop",
                description: "Alpha Line provides full-service site development solutions that prepare your land for construction. Our site development services include land clearing, grading, excavation, and utility installation.",
                gallery: [
                    "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581093458791-9d42e1f6b470?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?w=400&h=300&fit=crop"
                ]
            },
            green: {
                title: "Green Building",
                background: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200&h=400&fit=crop",
                description: "Alpha Line is committed to sustainable construction practices that benefit both our clients and the environment. Our green building services focus on creating energy-efficient, environmentally responsible structures.",
                gallery: [
                    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&h=300&fit=crop"
                ]
            }
        };

        // ===== MODAL =====
        const modal = document.getElementById('modal');

        function openModal(service) {
            const data = serviceData[service];
            document.getElementById('modal-header').style.backgroundImage = `url(${data.background})`;
            document.getElementById('modal-title').textContent = data.title;
            document.getElementById('modal-description').innerHTML = data.description;

            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            data.gallery.forEach(img => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `<img src="${img}" alt="Project">`;
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

        function openArticle(title){

        const article = contentData.articles.find(a => a.title === title);

        document.getElementById('articleTitle').textContent = article.title;
        document.getElementById('articleText').textContent = article.content;
        document.getElementById('articleImage').src = article.image;

        document.getElementById('articleAuthor').textContent = article.author;
        document.getElementById('articleTime').textContent = article.readingTime;

        document.getElementById("linkedinShare").href =
        "https://www.linkedin.com/sharing/share-offsite/?url=" + window.location.href;

        document.getElementById('articleModal').classList.add('active');

        }
        function closeArticle(){
        document.getElementById('articleModal').classList.remove('active');
        }

        // ===== WORK FILTER =====
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');

                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const projectCards = document.querySelectorAll('.project-card');
                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // ===== FORM =====
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you! We will get back to you soon.');
            e.target.reset();
        });




        /* ===== SCROLL REVEAL ===== */

        function revealOnScroll() {

            const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

            reveals.forEach(function(element) {

                const windowHeight = window.innerHeight;
                const elementTop = element.getBoundingClientRect().top;

                const revealPoint = 120;

                if (elementTop < windowHeight - revealPoint) {
                    element.classList.add("active");

                    /* ADD THIS */
                    if (element.querySelector('.services-grid')) {
                        element.querySelector('.services-grid').classList.add("active");
                    }

                    if (element.querySelector('.capabilities-container')) {
                        element.querySelector('.capabilities-container').classList.add("active");
                    }

                }

            });

        }

        window.addEventListener("scroll", revealOnScroll);
        window.addEventListener("load", revealOnScroll);
