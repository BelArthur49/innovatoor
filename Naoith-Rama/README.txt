NAIOTH RAMAH CENTRE — WEBSITE FILES
=====================================

WHAT'S IN THIS FOLDER
- index.html   → the page itself (don't need to edit this)
- styles.css   → all visual styling (don't need to edit this)
- script.js    → makes the page interactive (don't need to edit this)
- content.json → ALL of your text, prices, photos and contact info. Edit THIS file.

HOW TO EDIT YOUR WEBSITE (no coding needed)
1. Open content.json in any plain text editor (Notepad, TextEdit, or a free
   editor like Notepad++ / VS Code).
2. Find the text you want to change between the quotation marks, e.g.
      "headline": "Still waters, gathered people."
   Change only the text inside the quotes, then save the file.
3. To change a photo, replace the "image" link with a link to your own photo
   (upload it to your hosting's /images folder, or use a Google Drive / Dropbox
   link set to "anyone with the link can view").
4. To add another testimonial, gallery photo, space, or event type, copy one
   whole { ... } block in that list, paste it above or below, and edit the text.
5. Do not delete commas, colons, or quotation marks — that will break the page.
   If you're unsure, keep a backup copy of content.json before editing.

HOW TO PUT IT ONLINE
This is a static website — it works on any standard web host (e.g. Netlify,
Vercel, GitHub Pages, or your own hosting/cPanel). Upload all four files
(index.html, styles.css, script.js, content.json) into the same folder on
your host, keeping the file names exactly as they are.

IMPORTANT — TESTING ON YOUR OWN COMPUTER
Because the page loads content.json separately, opening index.html by
double-clicking it will show a "could not load content.json" message in
most browsers (this is a browser security rule, not a bug). To preview
changes locally before uploading, either:
 - use a simple local server (e.g. open a terminal in this folder and run
   "python3 -m http.server", then visit http://localhost:8000), or
 - upload the folder to any free static host and preview it there.

CONTACT FORM
The "Send enquiry" button opens the visitor's email app with their details
pre-filled, addressed to the email set in content.json → site → email.
No data is stored or sent anywhere else — there is no backend/database.
