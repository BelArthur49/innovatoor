(function() {
        const { icon, renderHeader, renderFooter, loadData, showLoadError } = window.P2A;

        function initials(name) {
            return (name || "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        }

        function photoFrame(photoPath, altName, frameClass) {
            if (photoPath) {
                return `<div class="photo-frame has-photo ${frameClass}"><img src="${photoPath}" alt="${altName}" onerror="this.parentElement.classList.remove('has-photo'); this.innerHTML='<svg class=&quot;icon&quot;><use href=&quot;assets/icons/icons.svg#icon-photo&quot;></use></svg>';"></div>`;
            }

            return `<div class="photo-frame ${frameClass}">${icon("photo")}</div>`;
        }

        function levelToDot(level) {
            if (level === "poor") return "red";
            if (level === "moderate") return "amber";
            return "green";
        }

        function renderSidePreview(c, countryId) {
            const side = document.getElementById("map-side");
            if (!c) {
                side.innerHTML = `
        <div class="empty-state">
          ${icon("population", "")}
          <h3>Hover a country</h3>
          <p>Countries shaded orange have a Ports&nbsp;2&nbsp;Arms report. Click one to open it.</p>
        </div>`;
                return;
            }

            const hasFull = c.stats && c.stats.population;

            side.innerHTML = `
      <div class="detail-panel">
        <div class="detail-head">
          <h2>${c.name}</h2>
          ${c.progressLevel ? `<span class="progress-pill ${levelToDot(c.progressLevel)}">${c.progressLabel}</span>` : ""}
        </div>
        ${c.intro ? `<p class="detail-intro">${c.intro}</p>` : ""}

        ${hasFull ? `
        <div class="stat-grid">
          <div class="stat-card"><div class="label">Population</div><div class="value">${c.stats.population}</div></div>
          <div class="stat-card"><div class="label">Vaccine supply</div><div class="value">${c.stats.totalSupply}</div></div>
          <div class="stat-card"><div class="label">Supply coverage</div><div class="value">${c.stats.supplyCoveragePct}</div></div>
          <div class="stat-card"><div class="label">Fully vaccinated</div><div class="value">${c.stats.completelyVaccinatedPct}</div></div>
        </div>` : `<p class="detail-intro">${c.vaccinatedPct}% vaccinated (at least one dose). Full report coming soon.</p>`}

        ${c.monitor && c.monitor.name ? `
        <div class="monitor-card">
          ${photoFrame(c.monitor.photo, c.monitor.name, "monitor-photo round")}
          <div>
            <div class="monitor-eyebrow">Meet your Monitor!</div>
            <div class="monitor-name">${c.monitor.name}</div>
            <div class="monitor-org">${c.monitor.orgLine || ""}</div>
          </div>
        </div>` : ""}

        <p style="margin-top:18px;"><a class="btn" href="report.html?c=${countryId}">Open ${c.name} report ${icon("chevron")}</a></p>
      </div>`;
  }

  function renderNoDataSide(countryName) {
    const side = document.getElementById("map-side");
    side.innerHTML = `
      <div class="empty-state">
        ${icon("photo", "")}
        <h3>${countryName}</h3>
        <p>No Ports&nbsp;2&nbsp;Arms report has been added for ${countryName} yet.</p>
      </div>`;
  }

  loadData().then(data => {
    renderHeader("index.html");
    renderFooter(data.site);

    fetch("assets/maps/africa.svg", { cache: "no-store" })
      .then(r => r.text())
      .then(svgText => {
        const mount = document.getElementById("map-mount");
        mount.innerHTML = svgText;
        const svg = mount.querySelector("svg");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        const tooltip = document.getElementById("map-tooltip");
        const stage = document.querySelector(".map-stage");

        svg.querySelectorAll(".country").forEach(pathEl => {
          const cid = pathEl.id;
          const dataName = pathEl.getAttribute("data-name");
          const country = data.countries[cid];
          if (country) pathEl.classList.add("has-data");

          pathEl.addEventListener("mouseenter", (e) => {
            tooltip.textContent = country ? `${country.name} \u2014 ${country.vaccinatedPct}%` : dataName;
            tooltip.classList.add("show");
            renderSidePreview(country, cid);
          });
          pathEl.addEventListener("mousemove", (e) => {
            const rect = stage.getBoundingClientRect();
            tooltip.style.left = (e.clientX - rect.left) + "px";
            tooltip.style.top = (e.clientY - rect.top) + "px";
          });
          pathEl.addEventListener("mouseleave", () => {
            tooltip.classList.remove("show");
          });
          pathEl.addEventListener("focus", () => renderSidePreview(country, cid));
          pathEl.addEventListener("click", () => {
            if (country) {
              location.href = `report.html?c=${cid}`;
            } else {
              renderNoDataSide(dataName);
            }
          });
          pathEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (country) location.href = `report.html?c=${cid}`;
              else renderNoDataSide(dataName);
            }
          });
        });

        renderSidePreview(null);
      });
  }).catch(showLoadError);
})();