# Ports 2 Arms — site files

## What's in here
- `index.html` — **home page.** Clickable map of Africa — click a shaded country to open its report
- `report.html` — full country report (progress ring, stats, highlighted barriers, indicator grid)
- `barriers.html` — every barrier and facilitator in full, with sources (this is what "Read more" links open)
- `map.html` — old URL, just redirects to `index.html` now (kept in case it's bookmarked anywhere)
- `data/content.json` — **all the words and numbers on the site.** Edit this file to change anything — no coding needed.
- `css/style.css` — visual styling (colors, spacing, fonts)
- `js/` — the code that reads `content.json` and draws each page
- `assets/icons/icons.svg` — the icon set used for each barrier category

## How to edit content
Open `data/content.json` in any plain text editor (Notepad, TextEdit, VS Code). Each field has changed instructions right in the file under `_note` keys. Change the text between quotes, save, and refresh your browser.

To add a new country: copy the whole `"drc": { ... }` block, paste it as a new entry under `"countries"`, give it a new key (e.g. `"malawi"`), and fill in the fields. It will automatically show up on the map page.

## How to view the site
Browsers block a page from reading a local `.json` file when you just double-click the `.html` file open — you'll see a "Couldn't load the site content" message if you try that. Instead, run a tiny local server (it doesn't install anything or need the internet):

**Mac:** double-click `start-server.command` (right-click → Open the first time, if macOS warns you), then visit `http://localhost:8000/map.html`

**Windows:** double-click `start-server.bat`, then visit `http://localhost:8000/map.html`

**Any OS with Python installed:** open a terminal in this folder and run `python3 -m http.server 8000`, then visit `http://localhost:8000/map.html`

## About the map
`assets/maps/africa.svg` is built from your uploaded reference image's outline — same shapes and borders — but rebuilt as one `<path>` per country (each tagged with its two-letter code, e.g. `id="cd"` for D.R. Congo), so each country is individually clickable. It's derived from the [@svg-maps/world](https://github.com/VictorCazanave/svg-maps) map by Victor Cazanave, based on [MapSVG's](https://mapsvg.com/maps/world) world map, both under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) — cropped to Africa and re-exported for this site.

To add a country's report: fill it into `data/content.json` the same way DRC is filled in — the matching shape on the map will automatically turn orange (clickable) once its two-letter key exists in `content.json`. `data/content.json`'s `mapCountryNames` object has the full name for every African country/territory's two-letter code, for reference.

## About the icons
The real Wix site's barrier icons (`icons-Artboard 37/38/39/41/42.png` etc.) are stored on Wix's private media CDN and can't be downloaded outside the Wix editor, so this build uses an original icon set instead: `assets/icons/icons.svg`. It's a single SVG "sprite sheet" — one clean line icon per barrier category (hesitancy, cold chain & logistics, poverty, expired vaccines, fake news, conflict, arrival at sites, health-worker strikes) plus a couple of shared ones (facilitator, chevron, external link, population, supply, syringe). To swap in your own icon for any category, replace the matching `<symbol id="icon-...">` block with your own SVG paths — everything else keeps working unchanged. If you'd rather use real photos/illustrations instead of line icons for any category, drop image files into `assets/icons/` and swap the `<use href="assets/icons/icons.svg#icon-...">` calls in `js/report.js` / `js/barriers.js` / `js/map.js` for `<img>` tags.

## About the photo placeholders
The Monitor card and each Facilitator entry now show a dashed-border photo frame instead of a colored icon badge. Drop a photo file into `assets/monitors/` or `assets/facilitators/`, then set that person/org's `"photo"` field in `data/content.json` to its path (e.g. `"assets/monitors/suzan.jpg"`) — the real photo will appear automatically, cropped to fill the frame. Leave `"photo": ""` and the dashed placeholder stays, so it's always obvious where a picture is expected.

## Content sourced from
`data/content.json`'s DRC entry is transcribed directly from the live Wix pages you sent me (Map, D.R. Congo report, and the barriers/facilitators page), including every citation and source link that was on those pages.
