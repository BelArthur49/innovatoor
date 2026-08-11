(function () {
  const { icon, renderHeader, renderFooter, loadData, showLoadError } = window.P2A;

  const sevClass = { red: "red", amber: "amber", green: "green" };

  function photoFrame(photoPath, altName, frameClass) {
    if (photoPath) {
      return `<div class="photo-frame has-photo ${frameClass}"><img src="${photoPath}" alt="${altName}" onerror="this.parentElement.classList.remove('has-photo'); this.innerHTML='<svg class=&quot;icon&quot;><use href=&quot;assets/icons/icons.svg#icon-photo&quot;></use></svg>';"></div>`;
    }
    return `<div class="photo-frame ${frameClass}">${icon("photo")}</div>`;
  }

  function renderBarriers(c) {
    return (c.barriers || []).map(b => `
      <article class="entry" id="${b.id}">
        <div class="entry-icon badge ${sevClass[b.severity] || "amber"}">${icon(b.icon)}</div>
        <div>
          <span class="sev-label ${sevClass[b.severity] || "amber"}">${(b.severity || "").toUpperCase()}</span>
          <h3>${b.label}</h3>
          ${(b.statements || []).map(s => `
            <div class="statement">
              <p>${s.text}</p>
              ${s.citation ? `<p class="cite">${s.citation}${s.url ? ` &mdash; <a href="${s.url}" target="_blank" rel="noopener">source</a>` : ""}</p>` : ""}
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderFacilitators(c) {
    return `
      ${c.facilitatorsIntro ? `<p class="lede" style="margin:8px 0 26px;">${c.facilitatorsIntro}</p>` : ""}
      ${(c.facilitators || []).map(f => `
        <article class="facilitator-entry" id="${f.id}">
          ${photoFrame(f.photo, f.id, "facilitator-photo")}
          <div>
            <p>${f.text}</p>
            ${f.citation ? `<p class="cite">${f.citation}${f.url ? ` &mdash; <a href="${f.url}" target="_blank" rel="noopener">source</a>` : ""}</p>` : ""}
          </div>
        </article>
      `).join("")}
    `;
  }

  function render(c, countryId, kind) {
    document.getElementById("country-eyebrow").textContent = c.name;
    document.getElementById("page-title").textContent = kind === "facilitators" ? "Facilitators" : "Barriers";
    document.getElementById("page-lede").textContent = kind === "facilitators"
      ? "Partners and programmes helping move vaccines further along the ports-to-arms pathway."
      : "Everything standing between vaccine ports and arms in " + c.name + ", with sources.";

    document.getElementById("tab-row").innerHTML = `
      <a class="tab-link ${kind !== "facilitators" ? "active" : ""}" href="barriers.html?c=${countryId}&kind=barriers">Barriers</a>
      <a class="tab-link ${kind === "facilitators" ? "active" : ""}" href="barriers.html?c=${countryId}&kind=facilitators">Facilitators</a>
      <a class="tab-link" href="report.html?c=${countryId}">&larr; Back to report</a>
    `;

    document.getElementById("entry-list").innerHTML = kind === "facilitators"
      ? renderFacilitators(c)
      : renderBarriers(c);

    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  loadData().then(data => {
    renderHeader("barriers.html");
    renderFooter(data.site);
    const params = new URLSearchParams(location.search);
    const id = params.get("c") && data.countries[params.get("c")] ? params.get("c") : "cd";
    const kind = params.get("kind") === "facilitators" ? "facilitators" : "barriers";
    render(data.countries[id], id, kind);
  }).catch(showLoadError);
})();
