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

**Every button has a `label` (its text) and a `link` (where it goes):**
- `#contact`, `#work`, `#services`, `#about`, `#team`, `#upclose` jump to that section of the homepage.
- `upclose.html`, `privacy.html` open another page; `upclose.html#episodes` opens a page at a section.
- `https://...` opens an outside website in a new tab.
- `""` (empty) keeps the button visible but it does nothing yet. Use this for links the client has not
  given you. All social media links are set up this way: paste the real link when you receive it.

Service buttons also have `preselect`: clicking the button fills the "What can we help you with?" box
in the contact form with that option.

## Hero video
Put the video in `assets/video/` and set `hero.video` in `content/kommzhub.json`.
- **Convert the .MOV to .MP4 (H.264) first.** Safari plays .MOV, but Chrome, Edge and Firefox often cannot
  (iPhone and Mac videos are usually HEVC). On a Mac with ffmpeg installed, double-click
  `tools/convert-video-mac.command` and it creates `assets/video/AHTS.mp4` for you. Otherwise use HandBrake
  (preset "Fast 1080p30", tick "Web Optimized").
- Aim for under 10 MB: 15 to 30 seconds, 1920 px wide or less. On mobile data a large file loads slowly.
- `videoFallback` can point at the original .MOV as a second option.
- `overlay` is 0, so the video is fully visible. Raise it (for example 0.3) only if text is hard to read.
- The video plays muted (browsers require this for autoplay). A "Sound on" button lets visitors turn
  sound on; set `soundButton` to false to hide it.

## Our Work
Each project in `work.items` becomes a card and a case study:
Client, Project overview, The challenge, Our approach, The work (video and gallery), The outcome,
results, Our contribution. **Sections left empty are hidden**, so fill them only with confirmed facts.
- `filters` decides which filter buttons show the project. A filter with no project is hidden.
- `image`: leave empty to show a designed cover with the client name (or `coverText`).
- `video`: a YouTube link or an `.mp4` path.
- `metrics`: only rows with a `value` appear. Never invent figures.
- `visualAssets` is a reminder for you and never appears on the site.

## Team, clients, testimonials
- `team.founder` is shown large; add other people to `team.members` (example in its `_help`).
- `clients.logos`: add a `logo` path once each client approves. Without one, the name is shown.
- `clients.testimonials` and The Up Close `reviews`: only real quotes. With none, the section stays hidden.

## Contact form
Enquiries go to `booking.email` using FormSubmit (formsubmit.co). Confirm the address with the client.
1. Upload the site and send one test enquiry.
2. FormSubmit emails an **activation link** to that address. Click it once.
3. From then on every enquiry arrives in that inbox.
The form fields are listed in `booking.fields` and can be renamed, reordered or removed.
Contact email and phone (`contact.email`, `contact.phone`) are hidden while empty.

## The Up Close
Episodes are entered once in `content/upclose.json` and appear on both the homepage and the podcast page.
`footer.producedBy` is empty on purpose: only add "A Kommz Hub production" if the client confirms it.

## Legal pages
`content/legal.json` holds a starting Privacy Policy and Terms of Use written to match how this site
works. Have the client's legal adviser review them before publishing.

## Previewing and hosting
Upload the whole folder to any host (Netlify drop, Vercel, cPanel), or preview locally with VS Code's
Live Server. Double-clicking `index.html` will not load the text.

## Images
Compress new photos before adding them (Squoosh.app, WebP, about 1800 px wide). This keeps the site fast.

## Opening logo reveal
The homepage opens with a cinematic logo intro: light beams rise and rush into the centre, the KH mark
appears out of a flash, a light sweeps across it, the name rises underneath, and the mark zooms through
the screen into the website. It lasts about 3.5 seconds. Visitors can press "Skip intro" (or Esc / Enter).
The full version plays once per browser session; later visits in the same session get a short version.
Timing and steps are in `assets/js/motion.js` under "Cinematic logo intro".

## Motion
All animation is in `assets/js/motion.js` (GSAP, ScrollTrigger and Lenis, saved in `assets/vendor/`).
It switches off for visitors whose device asks for reduced motion (on Windows: Settings > Accessibility >
Visual effects > Animation effects).
