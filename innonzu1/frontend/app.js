(function() {
    "use strict";

    var API_BASE = window.INNONZU_API_BASE || "http://127.0.0.1:5000";

    var HOUSE_CATS = [
        ["exterior", "Exterior"],
        ["interior", "Interior"],
        ["rooms", "Rooms"],
        ["ceiling", "Ceiling"],
        ["floorIndoor", "Floor (indoor)"],
        ["floorOutdoor", "Floor & compound (outdoor)"]
    ];
    var PLOT_CATS = [
        ["overview", "Plot overview"],
        ["boundaries", "Boundaries & corners"],
        ["surroundings", "Access road & surroundings"]
    ];
    var UTIL_OPTS = [
        ["included", "Included in the price"],
        ["shared", "Shared with other tenants"],
        ["separate", "Tenant pays separately"]
    ];
    var TYPE_LABEL = { rent: "For rent", sale: "For sale", plot: "Plot for sale" };

    var S = {
        route: "home",
        filterType: "all",
        query: "",
        currentId: null,
        detailTab: 0,
        wizard: { step: 1, type: null, data: {}, photos: {}, listingId: null },
        fees: { rent: 10000, sale: 50000, plot: 30000, currency: "RWF" },
        listings: [],
        aiIds: null,
        aiReasons: {},
        aiLoading: false,
        myPhone: "",
        myResults: null,
        adminLoggedIn: false,
        toast: null
    };

    /* ---------- api helper ---------- */
    async function api(path, opts) {
        opts = opts || {};
        var fetchOpts = { method: opts.method || "GET", credentials: "include" };
        if (opts.json) {
            fetchOpts.headers = { "Content-Type": "application/json" };
            fetchOpts.body = JSON.stringify(opts.json);
        }
        if (opts.formData) { fetchOpts.body = opts.formData; }
        var res = await fetch(API_BASE + path, fetchOpts);
        var data = null;
        try { data = await res.json(); } catch (e) {}
        if (!res.ok) {
            var err = new Error((data && data.error) || ("HTTP " + res.status));
            err.data = data;
            err.status = res.status;
            throw err;
        }
        return data;
    }

    /* ---------- helpers ---------- */
    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

    function fmt(n) { n = Number(n) || 0; return n.toLocaleString("en-US"); }

    function money(n, cur) { return (cur || "RWF") + " " + fmt(n); }

    function qs(id) { return document.getElementById(id); }

    function showToast(msg) {
        S.toast = msg;
        render();
        setTimeout(function() { S.toast = null; var t = document.querySelector(".toast"); if (t) t.remove(); }, 2600);
    }

    function friendlyError(e) { return (e && e.message) ? e.message : "Something went wrong. Please try again."; }

    function icon(name, size) {
        size = size || 20;
        var p = {
            home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/>',
            bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 18h18"/><path d="M7 11V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"/><path d="M13 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"/>',
            bath: '<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M7 12V6a2 2 0 0 1 3-1.7"/><path d="M4 19v1"/><path d="M18 19v1"/>',
            ruler: '<path d="M3 16 8 21 21 8l-5-5z"/><path d="m14.5 6.5 2 2"/><path d="m11.5 9.5 2 2"/><path d="m8.5 12.5 2 2"/>',
            calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
            drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
            bolt: '<path d="M13 3 4 14h7l-1 7 9-11h-7z"/>',
            check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
            shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
            camera: '<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
            pin: '<path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
            phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 6a2 2 0 0 1 2-2z"/>',
            chat: '<path d="M21 12a8 8 0 1 1-3.5-6.6"/><path d="M21 3v6h-6"/>',
            sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
            moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
            x: '<path d="M6 6l12 12M18 6 6 18"/>',
            doc: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>',
            sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
            arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
            landmark: '<path d="M4 21h16"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M3 10l9-6 9 6"/>',
            wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H14a2.5 2.5 0 0 0 0 5h5"/>',
            warn: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.6 18a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0z"/>'
        };
        return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || "") + '</svg>';
    }

    /* ---------- data loading ---------- */
    async function loadAll() {
        try {
            S.fees = await api("/api/fees");
        } catch (e) { console.warn("Could not load fees, using defaults", e); }
        await refreshListings();
    }
    async function refreshListings(type) {
        try {
            var qparam = (type && type !== "all") ? ("?type=" + encodeURIComponent(type)) : "";
            S.listings = await api("/api/listings" + qparam);
        } catch (e) {
            S.listings = [];
            showToast("Couldn't reach the Innonzu server. Is the backend running?");
        }
    }

    /* ---------- theme ---------- */
    function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem("innonzu-theme"); } catch (e) {}
        if (saved) document.documentElement.setAttribute("data-theme", saved);
    }

    function toggleTheme() {
        var cur = document.documentElement.getAttribute("data-theme");
        var isDark = cur ? cur === "dark" : true;
        var next = isDark ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("innonzu-theme", next); } catch (e) {}
    }

    /* ---------- render shell ---------- */
    function render() {
        qs("app").innerHTML = headerHtml() + bodyHtml() + footerHtml() + (S.toast ? '<div class="toast">' + esc(S.toast) + '</div>' : "");
        window.scrollTo({ top: 0, behavior: "instant" });
    }

    function headerHtml() {
        function nl(route, label, type) {
            var current = S.route === route && (type === undefined || S.filterType === type);
            return '<button class="navlink" data-action="nav" data-route="' + route + '" data-type="' + (type || "") + '" aria-current="' + current + '">' + label + '</button>';
        }
        return '<header class="site-header"><div class="nav">' +
            '<button class="logo" data-action="nav" data-route="home">' + icon("home", 22) + ' Innonzu<span class="by-line">by Innovatoor</span></button>' +
            '<nav class="navlinks">' +
            nl("browse", "Rent", "rent") + nl("browse", "Buy", "sale") + nl("browse", "Plots", "plot") + nl("mylistings", "My listings") +
            '</nav>' +
            '<div class="navactions">' +
            '<button class="icon-btn" data-action="theme" title="Toggle theme, kept only on this device">' + icon("sun", 17) + '</button>' +
            '<button class="btn btn-accent btn-sm" data-action="nav" data-route="post">List your property</button>' +
            '</div>' +
            '</div></header>';
    }

    function footerHtml() {
        return '<footer><div class="container">' +
            '<div class="footer-grid">' +
            '<div><div class="logo" style="margin-bottom:8px">' + icon("home", 20) + ' Innonzu</div>' +
            '<p>"Innonzu" &mdash; Kinyarwanda for "this house." A product of Innovatoor Ltd, built to help people in Kigali find and list real homes directly, without commission agents or wasted trips.</p></div>' +
            '<div class="footer-links">' +
            '<button data-action="nav" data-route="browse" data-type="all">Browse listings</button>' +
            '<button data-action="nav" data-route="post">List a property</button>' +
            '<button data-action="nav" data-route="mylistings">My listings</button>' +
            '<button data-action="nav" data-route="admin">Innovatoor admin</button>' +
            '</div></div>' +
            '<div class="foot-bottom"><span>&copy; ' + new Date().getFullYear() + ' Innovatoor Ltd, Norrsken House, Kigali</span><span>info@innovatoor.com &middot; +250 782 010 317</span></div>' +
            '</div></footer>';
    }

    function bodyHtml() {
        if (S.route === "home") return homeHtml();
        if (S.route === "browse") return browseHtml();
        if (S.route === "detail") return detailHtml();
        if (S.route === "post") return wizardHtml();
        if (S.route === "mylistings") return myListingsHtml();
        if (S.route === "admin") return adminHtml();
        return homeHtml();
    }

    /* ---------- home / browse ---------- */
    function homeHtml() {
        var chips = [
            ["all", "All"],
            ["rent", "Rent"],
            ["sale", "Buy"],
            ["plot", "Plots"]
        ];
        return '<section class="hero"><div class="container hero-grid">' +
            '<div>' +
            '<div class="eyebrow-note">Made in Kigali, for Kigali</div>' +
            '<h1 class="hero-h">Find a home in Kigali without the running around.</h1>' +
            '<p class="hero-sub">See real photos of every room before you travel, talk directly to the owner, and skip the commission agents who show up with a house that has nothing to do with what you asked for.</p>' +
            '<div class="search-card">' +
            '<div class="type-chips">' + chips.map(function(c) { return '<button class="chip" data-action="setchip" data-type="' + c[0] + '" aria-pressed="' + (S.filterType === c[0]) + '">' + c[1] + '</button>'; }).join("") + '</div>' +
            '<div class="search-row">' +
            '<input id="home-search" class="search-input" placeholder="Try: 2 bedroom apartment in Kimironko under 200,000 RWF" value="' + esc(S.query) + '">' +
            '<button class="btn btn-dark" data-action="smartsearch">' + (S.aiLoading ? '<span class="spin"></span>' : icon("sparkle", 18)) + ' Smart search</button>' +
            '</div>' +
            '<p class="search-hint">Describe what you want in plain language &mdash; our assistant reads every listing and finds the closest match.</p>' +
            '</div>' +
            '</div>' +
            '<div class="trust-list">' +
            trustItem("check", "No commission fees", "Deal directly with the home or land owner, always.") +
            trustItem("shield", "Verified, direct owners", "Every listing is tied to one owner\u2019s name and phone number.") +
            trustItem("camera", "Real photos, every room", "Exterior, interior, ceiling and floor &mdash; before you travel.") +
            '</div>' +
            '</div></section>' +
            listingsSectionHtml(S.listings.slice(0, 6));
    }

    function trustItem(ic, b, s) {
        return '<div class="trust-item">' + icon(ic, 20) + '<div><b>' + b + '</b><span>' + s + '</span></div></div>';
    }

    function listingsSectionHtml(list) {
        return '<section class="section container">' +
            '<h2 style="margin:0 0 16px;font-size:1.4rem">Recently listed</h2>' +
            gridHtml(list) +
            '<div style="text-align:center;margin-top:22px"><button class="btn btn-outline" data-action="nav" data-route="browse" data-type="all">See all listings</button></div>' +
            '</section>';
    }

    function browseHtml() {
        var list = S.listings;
        if (S.aiIds) {
            var byId = {};
            list.forEach(function(l) { byId[l.id] = l; });
            list = S.aiIds.map(function(id) { return byId[id]; }).filter(Boolean);
        } else if (S.filterType !== "all") {
            list = list.filter(function(l) { return l.type === S.filterType; });
        }
        var tabs = [
            ["all", "All"],
            ["rent", "Rent"],
            ["sale", "Buy"],
            ["plot", "Plots"]
        ];
        return '<div class="filter-bar"><div class="container filter-row">' +
            '<div class="tabs">' + tabs.map(function(t) { return '<button class="tab" data-action="settab" data-type="' + t[0] + '" aria-selected="' + (!S.aiIds && S.filterType === t[0]) + '">' + t[1] + '</button>'; }).join("") + '</div>' +
            (S.aiIds ? '<button class="btn btn-ghost btn-sm" data-action="clearai">' + icon("x", 14) + ' Clear smart search</button>' : '') +
            '<span class="result-count">' + list.length + ' result' + (list.length === 1 ? "" : "s") + '</span>' +
            '</div>' + (S.aiIds ? '<div class="container"><span class="ai-tag">' + icon("sparkle", 14) + ' Ranked by smart search for \u201C' + esc(S.query) + '\u201D</span></div>' : '') + '</div>' +
            '<section class="section container">' + gridHtml(list) + '</section>';
    }

    function gridHtml(list) {
        if (!list.length) return '<div class="empty-state">' + icon("search", 40) + '<p>No listings match yet. Try a different search or check back soon.</p></div>';
        return '<div class="grid">' + list.map(cardHtml).join("") + '</div>';
    }

    function cardHtml(l) {
        var priceLabel = l.type === "rent" ? money(l.price, "RWF") + "/mo" : money(l.price, "RWF");
        var meta = "";
        if (l.type === "plot") meta = '<span>' + icon("ruler", 14) + ' ' + fmt(l.plotSize) + ' ' + (l.plotUnit || "sqm") + '</span>';
        else meta = '<span>' + icon("bed", 14) + ' ' + (l.bedrooms || "-") + ' bed</span><span>' + icon("bath", 14) + ' ' + (l.bathrooms || "-") + ' bath</span>';
        var reason = (S.aiIds && S.aiReasons && S.aiReasons[l.id]) ? '<div class="card-reason">' + esc(S.aiReasons[l.id]) + '</div>' : "";
        var thumb = l.thumb || "";
        return '<button class="card" data-action="opendetail" data-id="' + l.id + '">' +
            '<div class="card-photo">' + (thumb ? '<img alt="' + esc(l.title) + '" src="' + thumb + '">' : '') +
            '<div class="card-badges"><span class="badge badge-type">' + TYPE_LABEL[l.type] + '</span>' + (l.noCommission ? '<span class="badge badge-verified">No commission</span>' : '') + '</div>' +
            '<div class="card-price">' + priceLabel + '</div></div>' +
            '<div class="card-body"><div class="card-title">' + esc(l.title) + '</div>' +
            '<div class="card-loc">' + icon("pin", 14) + ' ' + esc(l.area) + ', ' + esc(l.district) + '</div>' +
            '<div class="card-meta">' + meta + '</div>' + reason +
            '</div></button>';
    }

    /* ---------- detail ---------- */
    var currentFull = null;
    async function openDetail(id) {
        S.currentId = id;
        S.route = "detail";
        S.detailTab = 0;
        currentFull = null;
        render();
        try { currentFull = await api("/api/listings/" + id); } catch (e) { showToast(friendlyError(e)); }
        render();
    }

    function detailHtml() {
        if (!currentFull) return '<div class="container section"><p style="color:var(--text-soft)">Loading\u2026</p></div>';
        var l = currentFull;
        var cats = l.type === "plot" ? PLOT_CATS : HOUSE_CATS;
        var activeCat = cats[S.detailTab] || cats[0];
        var photos = (l.photosByCategory && l.photosByCategory[activeCat[0]]) || [];
        var mainPhoto = photos[0];
        var priceLabel = l.type === "rent" ? money(l.price, "RWF") + "<small> /month</small>" : money(l.price, "RWF");

        var specs = [];
        if (l.type !== "plot") {
            specs.push(["bed", "Bedrooms", l.bedrooms || "\u2014"]);
            specs.push(["bath", "Bathrooms", l.bathrooms || "\u2014"]);
            specs.push(["calendar", "Year built", l.yearBuilt || "\u2014"]);
            specs.push(["calendar", "Renovated", l.renovated ? ("Yes, " + l.yearRenovated) : "No"]);
            var utilLabel = (UTIL_OPTS.find(function(u) { return u[0] === l.waterElectricity; }) || [, "\u2014"])[1];
            specs.push(["drop", "Water & electricity", utilLabel]);
        } else {
            specs.push(["ruler", "Plot size", fmt(l.plotSize) + " " + (l.plotUnit || "sqm")]);
            specs.push(["drop", "Water nearby", l.waterNearby ? "Yes" : "Not yet"]);
            specs.push(["bolt", "Electricity nearby", l.electricityNearby ? "Yes" : "Not yet"]);
        }
        specs.push(["doc", "Title deed", l.titleDeed ? "Available" : "Not confirmed"]);
        if (l.street) specs.push(["landmark", "Street", l.street]);

        return '<div class="container">' +
            '<div class="detail-top"><button class="btn btn-ghost btn-sm" data-action="nav" data-route="browse" data-type="all">' + icon("arrowL", 15) + ' Back to listings</button></div>' +
            '<div class="gallery">' +
            '<div class="gallery-main">' + (mainPhoto ? '<img src="' + mainPhoto + '" alt="' + esc(activeCat[1]) + ' photo of ' + esc(l.title) + '">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-soft)">No ' + esc(activeCat[1]).toLowerCase() + ' photos yet</div>') + '</div>' +
            '<div class="thumb-row">' + photos.map(function(p, i) { return '<img class="thumb" alt="" aria-current="' + (i === 0) + '" src="' + p + '" data-action="setmain" data-src="' + encodeURIComponent(p) + '">'; }).join("") + '</div>' +
            '<div class="gallery-tabs">' + cats.map(function(c, i) { return '<button class="gtab" aria-selected="' + (i === S.detailTab) + '" data-action="detailtab" data-i="' + i + '">' + c[1] + '</button>'; }).join("") + '</div>' +
            '</div>' +
            '<div class="detail-grid">' +
            '<div>' +
            '<div class="card-badges" style="position:static;margin-bottom:10px"><span class="badge badge-type">' + TYPE_LABEL[l.type] + '</span>' + (l.noCommission ? '<span class="badge badge-verified">' + icon("shield", 12) + ' Direct owner, no commission</span>' : '') + '</div>' +
            '<h1 style="font-size:1.5rem;margin:0 0 6px">' + esc(l.title) + '</h1>' +
            '<div class="card-loc">' + icon("pin", 15) + ' ' + esc(l.area) + (l.street ? ', ' + esc(l.street) : '') + ' \u00B7 ' + esc(l.district) + ' District</div>' +
            '<p style="color:var(--text-soft);margin-top:14px;max-width:60ch">' + esc(l.description) + '</p>' +
            '<div class="spec-grid">' + specs.map(function(s) { return '<div class="spec-item"><div class="k">' + icon(s[0], 14) + ' ' + s[1] + '</div><div class="v">' + esc(String(s[2])) + '</div></div>'; }).join("") + '</div>' +
            '</div>' +
            '<div class="owner-card">' +
            '<div class="price-big">' + priceLabel + '</div>' +
            '<p style="color:var(--text-soft);font-size:.86rem;margin:12px 0 4px">Listed by</p>' +
            '<p style="font-weight:700;margin:0 0 14px">' + esc(l.ownerName) + '</p>' +
            '<a class="btn btn-accent btn-block" style="margin-bottom:8px" href="tel:+250' + esc(l.ownerPhone) + '">' + icon("phone", 16) + ' Call owner</a>' +
            '<a class="btn btn-outline btn-block" target="_blank" rel="noopener" href="https://wa.me/250' + esc(l.ownerPhone) + '">' + icon("chat", 16) + ' WhatsApp owner</a>' +
            '<p class="demo-note">Innonzu never charges buyers or renters a fee. Owners pay a one-time listing fee to publish.</p>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    /* ---------- wizard ---------- */
    function startWizard() {
        S.wizard = { step: 1, type: null, data: {}, photos: {}, listingId: null };
        S.route = "post";
        render();
    }

    function wizardHtml() {
        var w = S.wizard;
        var steps = ["Type", "Details", "Photos", "Payment"];
        var stepperHtml = '<div class="stepper">' + steps.map(function(s, i) {
            var n = i + 1,
                cls = n < w.step ? "done" : (n === w.step ? "active" : "");
            return '<div class="step ' + cls + '"><div class="dot">' + (n < w.step ? "\u2713" : n) + '</div><div class="lbl">' + s + '</div></div>';
        }).join("") + '</div>';

        var body = "";
        if (w.step === 1) body = wizardStep1();
        else if (w.step === 2) body = wizardStep2();
        else if (w.step === 3) body = wizardStep3();
        else if (w.step === 4) body = w.published ? wizardSuccess() : wizardStep4();

        return '<div class="container section" style="max-width:760px">' +
            '<h1 style="font-size:1.5rem;margin:0 0 4px">List your property</h1>' +
            '<p style="color:var(--text-soft);margin:0 0 6px">Pay Innovatoor a one-time fee to publish. You keep full control of the price afterwards.</p>' +
            stepperHtml + body +
            '</div>';
    }

    function wizardStep1() {
        var cards = [
            ["rent", "home", "Rent out a house", "Monthly rent, one tenant at a time"],
            ["sale", "doc", "Sell a house", "A house or apartment with a title"],
            ["plot", "ruler", "Sell a plot", "Vacant land, residential or otherwise"]
        ];
        return '<div class="type-pick">' + cards.map(function(c) {
            return '<button class="type-card" data-action="picktype" data-type="' + c[0] + '">' + icon(c[1], 26) + '<b>' + c[2] + '</b><span>' + c[3] + '</span></button>';
        }).join("") + '</div>';
    }

    function fld(id, label, inputHtml, hint) {
        return '<div class="field"><label class="label" for="' + id + '">' + label + '</label>' + inputHtml + (hint ? '<div class="hint">' + hint + '</div>' : "") + '</div>';
    }

    function wizardStep2() {
        var w = S.wizard,
            d = w.data,
            isPlot = w.type === "plot";
        var districts = ["Gasabo", "Kicukiro", "Nyarugenge"];
        var html = '<div class="field-row">' +
            fld("f-title", "Listing title", '<input id="f-title" class="input" placeholder="e.g. 2-bedroom house in Kimironko" value="' + esc(d.title || "") + '">') +
            fld("f-area", "Neighbourhood / sector", '<input id="f-area" class="input" placeholder="e.g. Kimironko" value="' + esc(d.area || "") + '">') +
            '</div>' +
            '<div class="field-row">' +
            fld("f-street", "Street", '<input id="f-street" class="input" placeholder="e.g. KK 15 Ave" value="' + esc(d.street || "") + '">') +
            fld("f-district", "District", '<select id="f-district" class="select">' + districts.map(function(x) { return '<option ' + (d.district === x ? "selected" : "") + '>' + x + '</option>'; }).join("") + '</select>') +
            '</div>' +
            fld("f-price", "Price (RWF)" + (w.type === "rent" ? " per month" : ""), '<input id="f-price" type="number" min="0" class="input" placeholder="e.g. 200000" value="' + esc(d.price || "") + '">');

        if (isPlot) {
            html += '<div class="field-row">' +
                fld("f-size", "Plot size", '<input id="f-size" type="number" min="0" class="input" placeholder="e.g. 450" value="' + esc(d.size || "") + '">') +
                fld("f-unit", "Unit", '<select id="f-unit" class="select"><option value="sqm" ' + (d.unit !== "ha" ? "selected" : "") + '>sqm</option><option value="ha" ' + (d.unit === "ha" ? "selected" : "") + '>hectares</option></select>') +
                '</div>' +
                '<div class="field-row">' +
                '<div class="field"><label class="checkbox-row"><input id="f-water" type="checkbox" ' + (d.waterNearby ? "checked" : "") + '> <span>Water line nearby</span></label></div>' +
                '<div class="field"><label class="checkbox-row"><input id="f-elec" type="checkbox" ' + (d.elecNearby ? "checked" : "") + '> <span>Electricity nearby</span></label></div>' +
                '</div>';
        } else {
            html += '<div class="field-row">' +
                fld("f-beds", "Bedrooms", '<input id="f-beds" type="number" min="0" class="input" value="' + esc(d.beds || "") + '">') +
                fld("f-baths", "Bathrooms", '<input id="f-baths" type="number" min="0" class="input" value="' + esc(d.baths || "") + '">') +
                '</div>' +
                '<div class="field-row">' +
                fld("f-year", "Year built", '<input id="f-year" type="number" min="1900" max="2026" class="input" value="' + esc(d.yearBuilt || "") + '">') +
                fld("f-water", "Water & electricity", '<select id="f-water" class="select">' + UTIL_OPTS.map(function(u) { return '<option value="' + u[0] + '" ' + (d.water === u[0] ? "selected" : "") + '>' + u[1] + '</option>'; }).join("") + '</select>') +
                '</div>' +
                '<div class="field"><label class="checkbox-row"><input id="f-renovated" type="checkbox" data-action="togglerenovated" ' + (d.renovated ? "checked" : "") + '> <span>This property has been renovated</span></label></div>' +
                (d.renovated ? fld("f-yearren", "Year renovated", '<input id="f-yearren" type="number" min="1900" max="2026" class="input" value="' + esc(d.yearRenovated || "") + '">') : "");
        }

        html += '<div class="field"><label class="checkbox-row"><input id="f-deed" type="checkbox" ' + (d.titleDeed ? "checked" : "") + '> <span>Title deed / ownership documents available</span></label></div>' +
            fld("f-desc", "Description", '<textarea id="f-desc" class="textarea" placeholder="What makes this place worth seeing?">' + esc(d.desc || "") + '</textarea>',
                '<button class="btn btn-outline btn-sm" style="margin-top:8px" data-action="aidesc">' + (w.aiWriting ? '<span class="spin"></span>' : icon("sparkle", 14)) + ' Help me write this</button>') +
            '<div class="field-row">' +
            fld("f-oname", "Your name", '<input id="f-oname" class="input" value="' + esc(d.ownerName || "") + '">') +
            fld("f-ophone", "Your phone number", '<input id="f-ophone" class="input" placeholder="e.g. 0788xxxxxx" value="' + esc(d.ownerPhone || "") + '">') +
            '</div>';

        return html + wizardActions(true, true, w.savingDraft);
    }

    function wizardStep3() {
        var w = S.wizard,
            cats = w.type === "plot" ? PLOT_CATS : HOUSE_CATS;
        var html = cats.map(function(c) {
            var photos = w.photos[c[0]] || [];
            var tiles = photos.map(function(p) {
                return '<div class="photo-tile"><img src="' + p.url + '"><button class="rm" data-action="rmphoto" data-cat="' + c[0] + '" data-photoid="' + p.id + '">\u2715</button></div>';
            }).join("");
            var canAdd = photos.length < 4;
            return '<div class="cat-block"><h4>' + c[1] + '</h4><p class="sub">Up to 4 photos</p>' +
                '<div class="photo-grid">' + tiles + (canAdd ? '<label class="upload-tile">' + icon("camera", 20) + 'Add<input type="file" accept="image/*" style="display:none" data-role="photoinput" data-cat="' + c[0] + '"></label>' : "") + '</div>' +
                '</div>';
        }).join("");
        return html + wizardActions(true, true);
    }

    function wizardStep4() {
        var w = S.wizard;
        var fee = S.fees[w.type] || 0;
        if (w.payFailed) {
            return '<div class="pay-pending">' + icon("warn", 30) + '<h3 style="margin:12px 0 8px">That payment didn\u2019t go through</h3>' +
                '<p style="color:var(--text-soft)">No charge was made. You can try again with the same or a different number.</p>' +
                '<div class="wizard-actions" style="justify-content:center"><button class="btn btn-accent" data-action="retrypay">Try again</button></div></div>';
        }
        if (w.payPending) {
            return '<div class="pay-pending">' +
                '<div class="pulse-wrap">' + icon("wallet", 30) + '<span class="ring r1"></span><span class="ring r2"></span></div>' +
                '<h3 style="margin:0 0 8px">Processing your payment of ' + money(fee, "RWF") + '</h3>' +
                '<p style="color:var(--text-soft)">Payment request sent to ' + esc(w.payPhoneDisplay || "") + ' \u2014 approve it on that phone to publish your listing.</p>' +
                '</div>';
        }
        return '<div class="fee-box"><div><div style="font-weight:700">Innonzu listing fee \u2014 ' + TYPE_LABEL[w.type] + '</div><div style="color:var(--text-soft);font-size:.84rem">Paid once, to Innovatoor, before your listing goes live</div></div><div class="amt">' + money(fee, "RWF") + '</div></div>' +
            fld("f-payphone", "Phone number to pay from", '<input id="f-payphone" class="input" placeholder="07xx xxx xxx">', "We'll send a payment request straight to this number.") +
            '<p class="demo-note">Payments run through Innonzu\u2019s mobile money gateway \u2014 the connected provider (MTN MoMo, Airtel Money, or card) can be switched anytime from Innovatoor admin.</p>' +
            '<div class="wizard-actions"><button class="btn btn-outline" data-action="wizback">' + icon("arrowL", 15) + ' Back</button>' +
            '<button class="btn btn-accent" data-action="requestpay">Send payment request</button></div>';
    }

    function wizardActions(back, next, busy) {
        return '<div class="wizard-actions">' +
            (back ? '<button class="btn btn-outline" data-action="wizback">' + icon("arrowL", 15) + ' Back</button>' : '<span></span>') +
            (next ? '<button class="btn btn-accent" data-action="wiznext" ' + (busy ? "disabled" : "") + '>' + (busy ? '<span class="spin"></span> Saving\u2026' : "Continue") + '</button>' : "") +
            '</div>';
    }

    function wizardSuccess() {
        return '<div class="success-box">' + icon("check", 48) + '<h2 style="margin:0 0 6px">Your listing is live</h2>' +
            '<p style="color:var(--text-soft)">Seekers can now find, call or WhatsApp you directly. You can update the price or mark it as rented/sold anytime from My listings.</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap">' +
            '<button class="btn btn-accent" data-action="opendetail" data-id="' + S.wizard.listingId + '">View my listing</button>' +
            '<button class="btn btn-outline" data-action="nav" data-route="mylistings">Go to My listings</button>' +
            '</div></div>';
    }

    function readStep2() {
        var w = S.wizard,
            d = w.data;
        d.title = qs("f-title").value.trim();
        d.area = qs("f-area").value.trim();
        d.street = qs("f-street").value.trim();
        d.district = qs("f-district").value;
        d.price = Number(qs("f-price").value) || 0;
        d.titleDeed = qs("f-deed").checked;
        d.desc = qs("f-desc").value.trim();
        d.ownerName = qs("f-oname").value.trim();
        d.ownerPhone = qs("f-ophone").value.trim();
        if (w.type === "plot") {
            d.size = Number(qs("f-size").value) || 0;
            d.unit = qs("f-unit").value;
            d.waterNearby = qs("f-water").checked;
            d.elecNearby = qs("f-elec").checked;
        } else {
            d.beds = Number(qs("f-beds").value) || 0;
            d.baths = Number(qs("f-baths").value) || 0;
            d.yearBuilt = Number(qs("f-year").value) || "";
            d.water = qs("f-water").value;
            d.renovated = qs("f-renovated").checked;
            if (d.renovated) d.yearRenovated = Number((qs("f-yearren") || {}).value) || "";
        }
    }

    function validStep2() {
        var d = S.wizard.data;
        if (!d.title || !d.area || !d.price || !d.ownerName || !d.ownerPhone) { showToast("Please fill in title, location, price and your contact details."); return false; }
        return true;
    }

    function readSoft() {
        var w = S.wizard,
            d = w.data;
        ["title", "area", "street", "desc"].forEach(function(id) { var e = qs("f-" + id); if (e) d[id] = e.value; });
        if (qs("f-price")) d.price = Number(qs("f-price").value) || d.price;
        if (qs("f-beds")) d.beds = Number(qs("f-beds").value) || d.beds;
        if (qs("f-baths")) d.baths = Number(qs("f-baths").value) || d.baths;
        if (qs("f-year")) d.yearBuilt = Number(qs("f-year").value) || d.yearBuilt;
        if (qs("f-size")) d.size = Number(qs("f-size").value) || d.size;
    }

    /* ---------- my listings ---------- */
    function myListingsHtml() {
        var html = '<div class="container section simple-page"><h1 style="font-size:1.4rem">My listings</h1>' +
            '<p style="color:var(--text-soft)">Enter the phone number you listed with to manage your properties.</p>' +
            '<div class="search-row"><input id="my-phone" class="input" placeholder="e.g. 0788xxxxxx" value="' + esc(S.myPhone) + '"><button class="btn btn-dark" data-action="findmine">Find</button></div>';
        if (S.myResults) {
            if (!S.myResults.length) html += '<p style="margin-top:20px;color:var(--text-soft)">No listings found for that number.</p>';
            else html += '<div style="margin-top:20px">' + S.myResults.map(myRowHtml).join("") + '</div>';
        }
        return html + '</div>';
    }

    function myRowHtml(l) {
        var priceLabel = l.type === "rent" ? money(l.price, "RWF") + "/mo" : money(l.price, "RWF");
        return '<div class="my-row">' + (l.thumb ? '<img alt="" src="' + l.thumb + '">' : '<div style="width:70px;height:56px;border-radius:8px;background:var(--surface-2);flex-shrink:0"></div>') + '<div class="info">' +
            '<div class="title">' + esc(l.title) + '</div>' +
            '<div style="font-size:.82rem;color:var(--text-soft)">' + priceLabel + ' \u00B7 <span class="status-pill ' + (l.status === "published" ? "" : "off") + '">' + l.status + '</span></div>' +
            '<div class="actions">' +
            '<button class="btn btn-outline btn-sm" data-action="editprice" data-id="' + l.id + '">Edit price</button>' +
            '<button class="btn btn-outline btn-sm" data-action="markstatus" data-id="' + l.id + '" data-status="' + (l.type === "rent" ? "rented" : "sold") + '">Mark as ' + (l.type === "rent" ? "rented" : "sold") + '</button>' +
            '<button class="btn btn-danger btn-sm" data-action="deletelisting" data-id="' + l.id + '">Delete</button>' +
            '</div></div></div>';
    }
    async function refreshMyResults() {
        if (!S.myPhone) return;
        try { S.myResults = await api("/api/listings/mine?phone=" + encodeURIComponent(S.myPhone)); } catch (e) { showToast(friendlyError(e)); }
    }

    /* ---------- admin ---------- */
    function adminHtml() {
        if (!S.adminLoggedIn) {
            return '<div class="container section simple-page"><h1 style="font-size:1.4rem">Innovatoor admin</h1>' +
                '<p style="color:var(--text-soft)">For the Innonzu team only.</p>' +
                fld("admin-user", "Username", '<input id="admin-user" class="input" value="admin">') +
                fld("admin-pass", "Password", '<input id="admin-pass" type="password" class="input">') +
                '<button class="btn btn-dark btn-block" data-action="adminlogin">Log in</button></div>';
        }
        var all = S.adminListings || [],
            byType = { rent: 0, sale: 0, plot: 0 },
            live = 0;
        all.forEach(function(l) { byType[l.type] = (byType[l.type] || 0) + 1; if (l.status === "published") live++; });
        return '<div class="container section"><h1 style="font-size:1.4rem">Innovatoor admin</h1>' +
            '<div class="admin-grid">' +
            statBox(all.length, "Total listings") + statBox(live, "Currently live") + statBox(byType.plot || 0, "Plots listed") +
            '</div>' +
            '<h2 style="font-size:1.1rem">Listing fees (RWF)</h2>' +
            '<div class="field-row">' +
            fld("fee-rent", "Rent", '<input id="fee-rent" type="number" class="input" value="' + S.fees.rent + '">') +
            fld("fee-sale", "Sale", '<input id="fee-sale" type="number" class="input" value="' + S.fees.sale + '">') +
            '</div>' +
            fld("fee-plot", "Plot", '<input id="fee-plot" type="number" class="input" value="' + S.fees.plot + '">') +
            '<button class="btn btn-accent" data-action="savefees">Save fees</button>' +
            '<h2 style="font-size:1.1rem;margin-top:30px">All listings</h2>' +
            all.map(function(l) {
                return '<div class="my-row">' + (l.thumb ? '<img alt="" src="' + l.thumb + '">' : '<div style="width:70px;height:56px;border-radius:8px;background:var(--surface-2);flex-shrink:0"></div>') + '<div class="info"><div class="title">' + esc(l.title) + '</div>' +
                    '<div style="font-size:.8rem;color:var(--text-soft)">' + TYPE_LABEL[l.type] + ' \u00B7 ' + l.status + '</div>' +
                    '<div class="actions"><button class="btn btn-danger btn-sm" data-action="adminremove" data-id="' + l.id + '">Remove</button></div></div></div>';
            }).join("") +
            '</div>';
    }

    function statBox(n, l) { return '<div class="stat-box"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>'; }

    /* ---------- event delegation ---------- */
    document.addEventListener("click", async function(e) {
        var el = e.target.closest("[data-action]");
        if (!el) return;
        var a = el.dataset.action;

        if (a === "nav") {
            S.route = el.dataset.route;
            if (el.dataset.type) S.filterType = el.dataset.type;
            S.aiIds = null;
            if (S.route === "post") startWizard();
            if (S.route === "mylistings") { S.myResults = null; }
            if (S.route === "browse") { await refreshListings(S.filterType); }
            if (S.route === "admin" && S.adminLoggedIn) { await loadAdminData(); }
            render();
            return;
        }
        if (a === "theme") { toggleTheme(); return; }
        if (a === "setchip") {
            S.filterType = el.dataset.type;
            render();
            return;
        }
        if (a === "settab") {
            S.filterType = el.dataset.type;
            S.aiIds = null;
            await refreshListings(S.filterType);
            render();
            return;
        }
        if (a === "clearai") {
            S.aiIds = null;
            S.query = "";
            await refreshListings("all");
            render();
            return;
        }
        if (a === "opendetail") { await openDetail(el.dataset.id); return; }
        if (a === "detailtab") {
            S.detailTab = Number(el.dataset.i);
            render();
            return;
        }
        if (a === "setmain") {
            var src = decodeURIComponent(el.dataset.src);
            document.querySelector(".gallery-main img").src = src;
            document.querySelectorAll(".thumb").forEach(function(t) { t.setAttribute("aria-current", t.src === src); });
            return;
        }

        if (a === "smartsearch") {
            var q = (qs("home-search") || {}).value || "";
            S.query = q.trim();
            if (!S.query) { showToast("Type what you're looking for first."); return; }
            S.aiLoading = true;
            render();
            try {
                var res = await api("/api/search/smart", { method: "POST", json: { query: S.query } });
                S.aiIds = res.ids || [];
                S.aiReasons = res.reasons || {};
            } catch (err) {
                showToast(friendlyError(err));
                S.aiIds = [];
            }
            S.aiLoading = false;
            S.route = "browse";
            S.filterType = "all";
            render();
            return;
        }

        if (a === "picktype") {
            S.wizard.type = el.dataset.type;
            S.wizard.step = 2;
            render();
            return;
        }
        if (a === "wiznext") {
            if (S.wizard.step === 2) {
                readStep2();
                if (!validStep2()) return;
                S.wizard.savingDraft = true;
                render();
                try {
                    var payload = Object.assign({ type: S.wizard.type }, S.wizard.data);
                    var created = await api("/api/listings/draft", { method: "POST", json: payload });
                    S.wizard.listingId = created.id;
                } catch (err) {
                    S.wizard.savingDraft = false;
                    showToast(friendlyError(err));
                    render();
                    return;
                }
                S.wizard.savingDraft = false;
            }
            S.wizard.step++;
            render();
            return;
        }
        if (a === "wizback") {
            if (S.wizard.step === 2) { S.wizard.step = 1; } else { S.wizard.step--; }
            render();
            return;
        }
        if (a === "togglerenovated") {
            readSoft();
            S.wizard.data.renovated = el.checked;
            render();
            return;
        }
        if (a === "aidesc") {
            readSoft();
            var d = S.wizard.data;
            S.wizard.aiWriting = true;
            render();
            try {
                var out = await api("/api/ai/describe", { method: "POST", json: d });
                d.desc = out.description;
            } catch (err) { showToast("Couldn't reach the writing assistant, try again."); }
            S.wizard.aiWriting = false;
            render();
            return;
        }
        if (a === "rmphoto") {
            var cat = el.dataset.cat,
                photoId = el.dataset.photoid;
            try { await api("/api/listings/" + S.wizard.listingId + "/photos/" + photoId, { method: "DELETE" }); } catch (err) {}
            S.wizard.photos[cat] = (S.wizard.photos[cat] || []).filter(function(p) { return String(p.id) !== String(photoId); });
            render();
            return;
        }
        if (a === "requestpay") {
            var raw = (qs("f-payphone").value || "").trim();
            var digits = raw.replace(/[^0-9]/g, "");
            if (digits.length < 9) { showToast("Enter a valid phone number."); return; }
            var last9 = digits.slice(-9);
            S.wizard.payPhoneDisplay = "0" + last9.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
            S.wizard.payFailed = false;
            S.wizard.payPending = true;
            render();
            try {
                var pr = await api("/api/payments/request", { method: "POST", json: { listingId: S.wizard.listingId, phone: last9 } });
                S.wizard.paymentRef = pr.reference;
                pollPayment(pr.reference);
            } catch (err) {
                S.wizard.payPending = false;
                S.wizard.payFailed = true;
                render();
            }
            return;
        }
        if (a === "retrypay") {
            S.wizard.payFailed = false;
            render();
            return;
        }

        if (a === "findmine") {
            S.myPhone = (qs("my-phone").value || "").trim();
            await refreshMyResults();
            render();
            return;
        }
        if (a === "editprice") {
            var nv = prompt("New price (RWF):");
            if (nv === null) return;
            var num = Number(nv.replace(/[^0-9]/g, ""));
            if (!num) { showToast("Enter a valid number."); return; }
            try {
                await api("/api/listings/" + el.dataset.id, { method: "PATCH", json: { price: num, ownerPhone: S.myPhone } });
                await refreshMyResults();
                showToast("Price updated.");
                render();
            } catch (err) { showToast(friendlyError(err)); }
            return;
        }
        if (a === "markstatus") {
            try {
                await api("/api/listings/" + el.dataset.id, { method: "PATCH", json: { status: el.dataset.status, ownerPhone: S.myPhone } });
                await refreshMyResults();
                showToast("Listing marked as " + el.dataset.status + ".");
                render();
            } catch (err) { showToast(friendlyError(err)); }
            return;
        }
        if (a === "deletelisting") {
            if (!confirm("Delete this listing for good?")) return;
            try {
                await api("/api/listings/" + el.dataset.id + "?ownerPhone=" + encodeURIComponent(S.myPhone), { method: "DELETE" });
                await refreshMyResults();
                showToast("Listing deleted.");
                render();
            } catch (err) { showToast(friendlyError(err)); }
            return;
        }

        if (a === "adminlogin") {
            try {
                await api("/api/admin/login", { method: "POST", json: { username: qs("admin-user").value, password: qs("admin-pass").value } });
                S.adminLoggedIn = true;
                await loadAdminData();
                render();
            } catch (err) { showToast("Incorrect username or password."); }
            return;
        }
        if (a === "savefees") {
            try {
                S.fees = await api("/api/admin/fees", { method: "POST", json: { rent: Number(qs("fee-rent").value) || 0, sale: Number(qs("fee-sale").value) || 0, plot: Number(qs("fee-plot").value) || 0 } });
                showToast("Fees updated.");
                render();
            } catch (err) { showToast(friendlyError(err)); }
            return;
        }
        if (a === "adminremove") {
            if (!confirm("Remove this listing?")) return;
            try {
                await api("/api/admin/listings/" + el.dataset.id, { method: "DELETE" });
                await loadAdminData();
                render();
            } catch (err) { showToast(friendlyError(err)); }
            return;
        }
    });

    document.addEventListener("change", async function(e) {
        if (e.target.matches('[data-role="photoinput"]')) {
            var cat = e.target.dataset.cat,
                file = e.target.files[0];
            if (!file) return;
            var fd = new FormData();
            fd.append("category", cat);
            fd.append("file", file);
            try {
                var res = await api("/api/listings/" + S.wizard.listingId + "/photos", { method: "POST", formData: fd });
                S.wizard.photos[cat] = S.wizard.photos[cat] || [];
                S.wizard.photos[cat].push({ id: res.id, url: res.url });
                render();
            } catch (err) { showToast(friendlyError(err)); }
        }
    });

    async function pollPayment(reference) {
        var attempts = 0;
        var timer = setInterval(async function() {
            attempts++;
            try {
                var pr = await api("/api/payments/" + reference);
                if (pr.status === "SUCCESSFUL") {
                    clearInterval(timer);
                    S.wizard.payPending = false;
                    S.wizard.published = true;
                    render();
                } else if (pr.status === "FAILED") {
                    clearInterval(timer);
                    S.wizard.payPending = false;
                    S.wizard.payFailed = true;
                    render();
                } else if (attempts >= 20) {
                    clearInterval(timer);
                    S.wizard.payPending = false;
                    S.wizard.payFailed = true;
                    render();
                }
            } catch (err) {
                if (attempts >= 20) {
                    clearInterval(timer);
                    S.wizard.payPending = false;
                    S.wizard.payFailed = true;
                    render();
                }
            }
        }, 1500);
    }

    async function loadAdminData() {
        try {
            S.adminListings = await api("/api/admin/listings");
            S.fees = await api("/api/admin/fees");
        } catch (e) { S.adminLoggedIn = false; }
    }

    /* ---------- boot ---------- */
    initTheme();
    document.getElementById("app").innerHTML = '<div class="container section"><p style="color:var(--text-soft)">Loading Innonzu\u2026</p></div>';
    loadAll().then(render);
})();