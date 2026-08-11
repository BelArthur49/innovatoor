/* Ports 2 Arms — shared site logic.
   Loads data/content.json once, then each page's own <script> (map.js /
   report.js / barriers.js) reads from window.SITE_DATA and draws the page. */

(function() {
        const SEV_LABEL = { red: "Poor", amber: "Moderate", green: "Good" };

        function icon(name, extraClass) {
            return `<svg class="icon ${extraClass || ""}"><use href="assets/icons/icons.svg#icon-${name}"></use></svg>`;
        }

        function el(html) {
            const t = document.createElement("template");
            t.innerHTML = html.trim();
            return t.content.firstElementChild;
        }

        function renderHeader(activePage) {
            const header = document.getElementById("site-header");
            if (!header) return;
            const links = [
                { href: "index.html", label: "Home" },
                { href: "report.html", label: "Country Report" },
                { href: "barriers.html", label: "Barriers & Facilitators" }
            ];
            header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html">
  <span class="brand-mark"><img src="assets/logo.png" alt="Ports 2 Arms logo"></span>
  <!--<span class="brand-word">Ports 2 Arms<small>African Alliance</small></span>-->
</a>
        <nav class="main-nav">
          ${links.map(l => `<a href="${l.href}" class="${l.href === activePage ? "active" : ""}">${l.label}</a>`).join("")}
        </nav>
      </div>`;
  }

  function renderFooter(site) {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <h5>${site.orgName}</h5>
            <p>${site.tagline}</p>
          </div>
          <div>
            <h5>${site.title} address</h5>
            <p>${site.address}<br><a href="mailto:${site.email}">${site.email}</a></p>
          </div>
        </div>
        <div class="foot-bottom">
          <span>${site.footerNote}</span>
        </div>
      </div>`;
  }

  function loadData() {
    return fetch("data/content.json", { cache: "no-store" })
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
  }

  function showLoadError(err) {
    const main = document.querySelector("main") || document.body;
    main.innerHTML = `
      <div class="wrap" style="padding:60px 0;">
        <h2 style="font-family:Georgia,serif;">Couldn't load the site content</h2>
        <p style="max-width:60ch;color:#555;">
          This page reads its text and numbers from <code>data/content.json</code>,
          which browsers block from loading when a page is opened directly by
          double-clicking the file. Please view the site through a local server instead:
        </p>
        <ol style="max-width:60ch;color:#555;">
          <li>Open a terminal in this folder</li>
          <li>Run <code>python3 -m http.server 8000</code> (or double-click <code>start-server.command</code> / <code>start-server.bat</code>)</li>
          <li>Visit <code>http://localhost:8000/map.html</code> in your browser</li>
        </ol>
        <p style="color:#999;font-size:.85rem;">Technical detail: ${err && err.message ? err.message : err}</p>
      </div>`;
  }

  window.P2A = { icon, el, renderHeader, renderFooter, loadData, showLoadError, SEV_LABEL };
})();
