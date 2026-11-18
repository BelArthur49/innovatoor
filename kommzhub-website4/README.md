# Kommz Hub + The Up Close website

Plain HTML, CSS and JavaScript. No backend. Developed by Innovatoor.

| Page | File | Text lives in |
|---|---|---|
| Kommz Hub (home) | `index.html` | `content/kommzhub.json` |
| The Up Close | `upclose.html` | `content/upclose.json` |
| Privacy Policy | `privacy.html` | `content/legal.json` |
| Terms of Use | `terms.html` | `content/legal.json` |

## Editing text, buttons and links (no coding needed)
Open a JSON file in any text editor and change only the text inside the quotes on the right of each
colon. Keep every quote mark, comma and bracket. Lines named `_help` are notes and never show on the site.
Check a file at https://jsonlint.com before uploading: it points to any missing comma or quote.

Every button has a `label` (its text) and a `link` (where it goes). An empty link (`""`) keeps the
button visible but it does nothing yet: use this for links the client has not given you.

## Photos and logos you only need to drop in (no code)
Put these files in `assets/img/` with exactly these names. They appear on the site automatically.
Any of `.jpg`, `.JPG`, `.jpeg`, `.png` or `.webp` works.

| What | File name | Where it shows |
|---|---|---|
| Photo gallery | `gallery1.jpg` … `gallery20.jpg` | Our Work, Photography card (in number order; gaps are skipped) |
| Your photos | `1kommz.jpg` … `15kommz.jpg` (lowercase .jpg) | Banner picture, services, gallery until gallery photos are added |
| Team photos | `junior.jpg`, `brian-sheja.jpg`, `prince-kamanzi.jpg` | Team section (initials show until the photo is there) |
| Client logos | `assets/img/clients/kayko.png`, `oasis-interiors.png`, `f-and-y.png`, `moja-erp.png`, `the-nook.png`, `nest-and-beyond.png` | Sliding logo band under the banner (logo only, no name). `.svg` also works. The Kommz Hub mark shows until a logo is there |
| Opening video | `assets/video/AHTS.mp4` | The banner |

More than 20 gallery photos: raise `galleryCount` in `content/kommzhub.json`.
Another client: copy one line in `clientLogos`, change the name and file name, and save the logo with that name.
While no `gallery…` photos exist, the gallery shows the photos listed in `fallbackImages`; empty that list
(`[]`) once your gallery photos are in.

## Our Work
Two cards:
- **Video Production** opens the Vimeo showcase (`vimeoUrl`) in a player on the page, with a
  "Watch on Vimeo" button underneath. If the showcase does not play inside the page, turn on embedding
  for the showcase in Vimeo (Showcase settings > Embed); the button always works.
- **Photography** opens a full-screen gallery (arrows, swipe, thumbnails, keyboard).

## Services
All six services sit in one card, in 3 rows of 2 (one column on phones). Clicking a service opens its
details; only one is open at a time, and clicking it again closes it. Each service button can fill in the contact form's "What can we help
you with?" box (`preselect`).

## Team
Everyone, founder first, appears in one sliding row of portraits: swipe on phones, drag or use the
arrows on computers. Clicking a portrait opens that person's full bio.

## Contact form
Enquiries go to `booking.email` using FormSubmit (formsubmit.co). Confirm the address with the client.
1. Upload the site and send one test enquiry.
2. FormSubmit emails an **activation link** to that address. Click it once.
3. From then on every enquiry arrives in that inbox.

## Opening video
Convert iPhone `.MOV` files to `.mp4` (H.264) first: Chrome, Edge and Firefox often cannot play .MOV.
HandBrake (free): preset "Fast 1080p30", Constant Quality 27, tick "Web Optimized", remove audio if not
needed. Aim for under 10 MB.

## Previewing and hosting
Upload the whole folder to any host, or preview locally with VS Code's Live Server. Double-clicking
`index.html` will not load the text. Keep the folder structure exactly as it is.

## Motion
All animation is in `assets/js/motion.js` (GSAP, ScrollTrigger and Lenis, saved in `assets/vendor/`).
It switches off for visitors whose device asks for reduced motion.
