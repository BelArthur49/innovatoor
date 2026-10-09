# Kommz Hub + The Up Close website

Two pages, plain HTML, CSS and JavaScript. No backend.

- `index.html` – Kommz Hub
- `upclose.html` – The Up Close with Davis Higiro

## Editing the text (no coding needed)
All words, links, images, services and episodes live in two files:

- `content/kommzhub.json` – Kommz Hub page
- `content/upclose.json` – The Up Close page

Open the file in any text editor (Notepad, TextEdit, VS Code) and change only the text
inside the quotes on the right of each colon. Keep every quote mark, comma and bracket.
Lines named `_help` are notes and never show on the site.

To check a file before uploading, paste it into https://jsonlint.com – it points to any
missing comma or quote.

### Adding a new podcast episode
In `content/upclose.json`, find `"episodes"` → `"items"`. Copy one whole `{ ... }` block,
paste it at the top of the list (newest first), add a comma after it, and change the details.
Put the artwork image in `assets/img/` and write its path in `"image"`.

### Changing images
Put the new image in `assets/img/`, then write its path in the JSON, e.g.
`"image": "assets/img/my-new-photo.jpg"`.

### Team, testimonials and work
- **Team** (`team` → `members`): name, role, short bio, photo path, optional LinkedIn/Instagram links.
  Leave `photo` empty and the person's initials are shown instead.
- **Client testimonials** (`testimonials` → `items`) and **listener reviews** on The Up Close
  (`reviews` → `items`): quote, name, role. Only publish real quotes.
- **Our work** (`work` → `items`): each project becomes a card. `category` creates the filter
  buttons automatically. Clicking a card opens a case study with `challenge`, `approach`,
  `result`, `services` and a `gallery` of extra images.
- **Numbers** (`stats` → `items`): value and label; they count up as you scroll.

Anything marked **SAMPLE** in the JSON is a placeholder to replace with real content.

## Booking forms
Both forms send requests to the `email` set in the `booking` section of each JSON file
(currently info@kommzhub.com), using FormSubmit (formsubmit.co).

1. Upload the site, then send one test booking.
2. FormSubmit emails an **activation link** to info@kommzhub.com. Click it once.
3. From then on every booking arrives in that inbox.

If the form ever cannot send, the visitor gets a button that opens their own email app with
the request filled in. Set `"provider": "mailto"` to always use that method instead.

## Previewing and hosting
The pages read their text from the JSON files, which browsers block when you double-click
`index.html`. Either:
- upload the whole folder to any host (Netlify drop, Vercel, cPanel, GitHub Pages), or
- preview locally with VS Code's Live Server extension.

## Fonts
- Kommz Hub: Syne + Geist (Google Fonts), as in the brand guide.
- The Up Close: Plus Jakarta Sans for body. Anton stands in for GC Sublime, which isn't a
  free web font. With a web licence, add GC Sublime via `@font-face` and put its name first
  in `--font-display` at the top of `assets/css/upclose.css`.

## Motion and parallax
All animation lives in `assets/js/motion.js` and uses GSAP, ScrollTrigger and Lenis, which are
saved inside `assets/vendor/` so nothing depends on an outside CDN.

What happens: a loading counter and curtain; headlines rising word by word; a smooth-scroll feel;
the hero splitting apart as you scroll; a running ticker that speeds up with your scroll; a paragraph
that lights up word by word; numbers counting up; services pinned and scrolling sideways (desktop);
images wiping open; the process line filling step by step; sliding photo strips; a headline that grows
to full size; a cursor that says "View" over projects; and buttons that lean toward the mouse.

Motion switches off for visitors whose device asks for reduced motion. On Windows that is
Settings > Accessibility > Visual effects > Animation effects. If it is off on your computer,
you will see the site without animation.
