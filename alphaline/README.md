# Alpha Line Construction Website - Easy Editing Guide

## 📋 What You Get
- **alpha-line-enhanced.html** - Your complete website (open this in a browser)
- **content.json** - Easy-to-edit configuration file for all content
- **README.md** - This guide

## 🎯 How to Use This Website

### Step 1: View Your Website
1. Double-click `alpha-line-enhanced.html`
2. It will open in your web browser
3. That's it! Your website is live locally

### Step 2: Edit Content (No Programming Required!)
All website content can be edited by opening `content.json` in any text editor (Notepad, TextEdit, VS Code, etc.)

---

## 📝 EDITING GUIDE - SIMPLE INSTRUCTIONS

### 🏠 Homepage Features Section
**Location in JSON:** `features` array

**What it controls:** The feature cards on the homepage (Expert Engineering, Fast Delivery, etc.)

**How to edit:**
```json
{
  "icon": "🏗️",  ← Change emoji icon
  "title": "Expert Engineering",  ← Change title
  "text": "State-of-the-art structural..."  ← Change description
}
```

**To add a new feature:** Copy an entire block from `{` to `}` and paste it, then edit the values.

---

### 🖼️ Parallax Sections (Scrolling Image Backgrounds)
**Location in JSON:** `parallax` array

**What it controls:** The two big sections with background images and text

**How to edit:**
```json
{
  "backgroundImage": "https://...",  ← Replace image URL
  "title": "Precision Engineering",  ← Change heading
  "text": "Our team of certified..."  ← Change description
}
```

**How to change the background image:**
1. Find a new image URL from Unsplash or your own hosting
2. Replace the entire URL between the quotes
3. Save the file

---

### 💪 Capabilities Section
**Location in JSON:** `capabilities` array

**What it controls:** The alternating image/text sections showing your capabilities

**How to edit:**
```json
{
  "title": "Structural Engineering",  ← Section heading
  "image": "https://...",  ← Replace image URL
  "description": "Our structural engineering...",  ← Main text
  "list": [  ← Bullet points
    "Steel & Concrete Design",
    "Foundation Engineering",
    "Seismic Analysis"
  ]
}
```

**To change bullet points:**
- Edit text between quotes
- Add new items: `"New Item Name",`
- Remove items: Delete entire line including comma

---

### 🏢 Services Section
**Location in JSON:** `services` array

**What it controls:** The service cards users can click to see details

**How to edit:**
```json
{
  "icon": "🏘️",  ← Change emoji
  "title": "Residential Construction",  ← Card title
  "preview": "Custom homes built...",  ← Short description
  "key": "residential"  ← DON'T CHANGE (links to modal)
}
```

---

### 💬 Testimonials
**Location in JSON:** `testimonials` array

**What it controls:** Customer testimonials slider

**How to edit:**
```json
{
  "text": "Alpha Line transformed...",  ← Customer quote
  "author": "Sarah Johnson",  ← Customer name
  "position": "CEO, Tech Innovations",  ← Job title
  "avatar": "https://..."  ← Profile picture URL
}
```

**To add more testimonials:** Copy entire block and paste, then edit.

---

### 🏗️ Projects (Portfolio)
**Location in JSON:** `projects` array

**What it controls:** The portfolio projects on "Our Work" page

**How to edit:**
```json
{
  "image": "https://...",  ← Project image URL
  "category": "residential",  ← Filter category (residential/commercial/renovation)
  "title": "Skyline Modern Villa",  ← Project name
  "description": "A stunning 5-bedroom..."  ← Short description
}
```

**Categories must be:** `residential`, `commercial`, or `renovation`

---

### 📞 Contact Information
**Location in JSON:** `contact` array

**What it controls:** Contact details on Contact page

**How to edit:**
```json
{
  "icon": "📍",  ← Emoji icon
  "title": "Address",  ← Label
  "text": "1234 Construction Blvd..."  ← Your info
}
```

---

### 🦶 Footer
**Location in JSON:** `footer` object

**How to edit:**
```json
"footer": {
  "description": "Building excellence...",  ← Company tagline
  "quickLinks": ["Home", "About Us", ...],  ← Navigation links
  "services": ["Residential Construction", ...],  ← Services list
  "contact": {
    "address": "1234 Construction Blvd...",
    "phone": "+1 (555) 123-4567",
    "email": "info@alphaline.construction"
  }
}
```

---

## 🖼️ HOW TO CHANGE IMAGES

### Option 1: Use Unsplash (Free Stock Photos)
1. Go to https://unsplash.com
2. Search for the type of image you want (e.g., "construction site")
3. Click on the image you like
4. Right-click the image and select "Copy Image Address"
5. Paste this URL in your JSON file

**Image URL Format for Unsplash:**
```
https://images.unsplash.com/photo-XXXXXXXXXX?w=800&h=600&fit=crop
```

### Option 2: Use Your Own Images
1. Upload your image to an image hosting service (Imgur, Cloudinary, etc.)
2. Get the direct image URL
3. Replace the URL in the JSON file

**Pro Tip:** Always use HTTPS (not HTTP) URLs for images.

---

## 🎨 CUSTOMIZATION TIPS

### Changing Colors
Open `alpha-line-enhanced.html` and find this section near the top:
```css
:root {
    --primary-red: #ff0000;  ← Change this color code
    --dark-bg: #0a0a0a;
    --darker-bg: #050505;
    --light-text: #ffffff;
    --gray-text: #999;
}
```

**Popular Color Codes:**
- Red: `#ff0000`
- Blue: `#0066ff`
- Green: `#00ff00`
- Orange: `#ff6600`
- Purple: `#9933ff`

### Changing Company Name
1. Open `alpha-line-enhanced.html`
2. Find and replace all instances of "ALPHA LINE" with your company name
3. Save the file

---

## ✅ TESTING YOUR CHANGES

1. Edit `content.json`
2. Save the file
3. Refresh your browser (press F5 or Ctrl+R)
4. Check if changes appear
5. If not showing, try Ctrl+Shift+R (hard refresh)

---

## 🚨 COMMON MISTAKES TO AVOID

### ❌ DON'T DO THIS:
```json
{
  "title": "My Title"  ← Missing comma at end
  "text": "My description"
}
```

### ✅ DO THIS:
```json
{
  "title": "My Title",  ← Comma added
  "text": "My description"
}
```

### Important Rules:
1. **Always use commas** between items
2. **Always use quotes** around text values
3. **Keep the structure** - don't delete brackets `{` `}` or `[` `]`
4. **Test after each change** - save and refresh browser

---

## 🆘 TROUBLESHOOTING

### Website shows blank or error:
1. Check if you saved `content.json`
2. Validate your JSON at https://jsonlint.com
3. Look for missing commas or quotes
4. Make sure all brackets match `{` with `}` and `[` with `]`

### Images not showing:
1. Check if URL starts with `https://`
2. Make sure URL ends with image extension (.jpg, .png, etc.)
3. Try copying the image URL again

### Changes not appearing:
1. Save the file first
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear browser cache if still not working

---

## 📦 DEPLOYING YOUR WEBSITE

### To put your website online:

1. **Using Netlify (Easiest):**
   - Go to https://www.netlify.com
   - Drag and drop both files
   - Get instant live website

2. **Using GitHub Pages:**
   - Create GitHub account
   - Upload files to repository
   - Enable GitHub Pages
   - Done!

3. **Using Web Hosting:**
   - Upload both files to your hosting via FTP
   - Place in public_html or www folder
   - Access via your domain

---

## 🎓 WHAT EACH FILE DOES

- **alpha-line-enhanced.html** - The website code (only edit for major changes)
- **content.json** - All your content (this is where you edit text/images)
- **README.md** - This instruction guide

---

## 💡 QUICK REFERENCE

| Task | JSON Location | What to Edit |
|------|---------------|--------------|
| Homepage features | `features` | icon, title, text |
| Background images | `parallax` | backgroundImage, title, text |
| Capabilities | `capabilities` | title, image, description, list |
| Services | `services` | icon, title, preview |
| Testimonials | `testimonials` | text, author, position, avatar |
| Projects | `projects` | image, category, title, description |
| Contact info | `contact` | icon, title, text |
| Footer | `footer` | description, quickLinks, services, contact |

---

## 🎉 YOU'RE READY!

This website is now completely customizable without any programming knowledge. Just edit the JSON file, save, and refresh your browser to see changes.

**Need help?** Common issues:
- Forgot a comma → Use jsonlint.com to find it
- Image won't load → Check URL starts with https://
- Text looks weird → Check for missing quotes

**Pro Tip:** Always keep a backup copy of your working `content.json` file before making major changes!

---

**Happy Building! 🏗️**
