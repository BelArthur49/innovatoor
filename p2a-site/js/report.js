(function () {
  const { icon, renderHeader, renderFooter, loadData, showLoadError } = window.P2A;

  function photoFrame(photoPath, altName, frameClass) {
    if (photoPath) {
      return `<div class="photo-frame has-photo ${frameClass}"><img src="${photoPath}" alt="${altName}" onerror="this.parentElement.classList.remove('has-photo'); this.innerHTML='<svg class=&quot;icon&quot;><use href=&quot;assets/icons/icons.svg#icon-photo&quot;></use></svg>';"></div>`;
    }
    return `<div class="photo-frame ${frameClass}">${icon("photo")}</div>`;
  }

  function progressRing(pct) {
    const r = 40, c = 2 * Math.PI * r;
    const offset = c - (Math.min(pct, 100) / 100) * c;
    return `
      <div class="progress-ring">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle class="bg" cx="48" cy="48" r="${r}" fill="none" stroke-width="8"></circle>
          <circle class="fg" cx="48" cy="48" r="${r}" fill="none" stroke-width="8"
            stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="pct">${pct}%</div>
      </div>`;
  }

  function render(c, countryId) {
    document.getElementById("hero").innerHTML = `
      <div class="wrap">
        <span class="eyebrow">Country report</span>
        <h1>${c.name}</h1>
        <p class="lede">${c.reportIntro || c.intro || ""}</p>
      </div>`;

    const highlighted = (c.barriers || []).filter(b => (c.highlightedBarrierIds || []).includes(b.id));
    const sevClass = { red: "red", amber: "amber", green: "green" };

    const grid = document.getElementById("report-grid");
    grid.innerHTML = `
      <div class="main-col">
        <div class="progress-block">
          ${progressRing(c.stats && c.stats.supplyCoveragePct ? parseFloat(c.stats.supplyCoveragePct) : c.vaccinatedPct)}
          <div class="progress-legend">
            <span><span class="dot red"></span> Poor progress</span>
            <span><span class="dot amber"></span> Moderate progress</span>
            <span><span class="dot green"></span> Good progress</span>
          </div>
        </div>

        ${c.stats && c.stats.population ? `
        <div class="stat-grid">
          <div class="stat-card"><div class="label">Population</div><div class="value">${c.stats.population}</div></div>
          <div class="stat-card"><div class="label">Total vaccine supply</div><div class="value">${c.stats.totalSupply}</div></div>
          <div class="stat-card"><div class="label">Vaccine administered</div><div class="value">${c.stats.administeredTotal} <small style="font-weight:600;color:var(--ink-soft);">(${c.stats.administeredPctOfSupply} of supply)</small></div></div>
          <div class="stat-card"><div class="label">Partially / fully vaccinated</div><div class="value">${c.stats.partiallyVaccinatedPct} / ${c.stats.completelyVaccinatedPct}</div></div>
        </div>
        <p class="source-note">${c.stats.sourceLabel} &mdash; <a href="${c.stats.sourceUrl}" target="_blank" rel="noopener">source</a></p>
        ` : ""}

        ${highlighted.length ? `
        <div class="highlight-band">
          <h3>Highlighted Barriers</h3>
          <div class="highlight-cards">
            ${highlighted.map(b => `
              <div class="highlight-card">
                <div class="icon-badge">${icon(b.icon)}</div>
                <h4>${b.label}</h4>
                <p>${b.summary}</p>
                <a class="readmore" href="barriers.html?c=${countryId}&kind=barriers#${b.id}">Read more ${icon("chevron")}</a>
              </div>
            `).join("")}
          </div>
        </div>` : ""}

        <div style="margin-top:36px;">
          <h3 class="section-heading">Indicator levels</h3>
          <p class="section-sub">Indicator colours range from poor (red) through moderate (amber) to good (green).</p>
          <div class="indicator-legend">
            <span><span class="dot red"></span> Poor</span>
            <span><span class="dot amber"></span> Moderate</span>
            <span><span class="dot green"></span> Good</span>
          </div>
          <div class="indicator-grid">
            ${(c.barriers || []).map(b => `
              <a class="indicator-tile" href="barriers.html?c=${countryId}&kind=barriers#${b.id}">
                <span class="badge ${sevClass[b.severity] || "amber"}">${icon(b.icon)}</span>
                <span class="t-label">${b.label}</span>
                <span class="t-summary">${b.summary}</span>
                <span class="t-more">Read more.</span>
              </a>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="side-col">
        ${c.monitor && c.monitor.name ? `
        <div class="monitor-card">
          ${photoFrame(c.monitor.photo, c.monitor.name, "monitor-photo round")}
          <div>
            <div class="monitor-eyebrow">Meet your Monitor!</div>
            <div class="monitor-name">${c.monitor.name}</div>
            <div class="monitor-org">${c.monitor.orgLine}</div>
            ${c.monitor.location ? `<div class="monitor-org">${c.monitor.location}</div>` : ""}
            <p class="monitor-quote">&ldquo;${c.monitor.quote}&rdquo;</p>
          </div>
        </div>` : ""}

        <div class="facilitators-teaser">
          ${icon("facilitator", "")}
          <h4>Facilitators</h4>
          <p>${c.facilitatorsIntro || "Partners and programmes helping move vaccines further along the pathway."}</p>
          <a class="readmore" href="barriers.html?c=${countryId}&kind=facilitators">See facilitators ${icon("chevron")}</a>
        </div>
      </div>
    `;
  }

  loadData().then(data => {
    renderHeader("report.html");
    renderFooter(data.site);
    const params = new URLSearchParams(location.search);
    const id = params.get("c") && data.countries[params.get("c")] ? params.get("c") : "cd";
    render(data.countries[id], id);
  }).catch(showLoadError);
})();
