# Studio Portfolio — WordPress Theme

**Blue · Black · White · Gold** design portfolio theme.

## Download

### Option A — From this repo
Copy the folder:
```
wordpress-theme/studio-portfolio/
```
to your WordPress site:
```
wp-content/themes/studio-portfolio/
```

### Option B — Zip file
Use `wordpress-theme/studio-portfolio.zip` — upload via WordPress Admin.

---

## Install (3 steps)

1. **Upload theme**
   - WordPress Admin → **Appearance → Themes → Add New → Upload Theme**
   - Choose `studio-portfolio.zip`
   - Click **Install Now** → **Activate**

   *Or copy the `studio-portfolio` folder to `wp-content/themes/` via FTP/cPanel.*

2. **Set homepage**
   - **Settings → Reading**
   - Select **A static page**
   - Create a page called "Home" and set it as Homepage
   - The theme uses `front-page.php` automatically

3. **Flush permalinks**
   - **Settings → Permalinks → Save Changes**

---

## Add portfolio projects (backend upload)

1. **Portfolio → Add New**
2. **Title** + description
3. **Featured Image** (right sidebar) — main project image
4. **Portfolio Details** box:
   - Display Number (01, 02…)
   - Year, Client, Project URL
   - Tags (comma-separated)
5. **Portfolio Gallery → Upload / Add Images**
6. **Portfolio Categories** — e.g. Branding, UI/UX
7. **Page Attributes → Order** — lower number = shown first
8. **Publish**

---

## Customize text

**Appearance → Customize → Portfolio Settings**
- Hero title & description
- About section
- Stats (projects, clients, awards)
- Contact email & location

---

## Theme features

| Feature | Description |
|---------|-------------|
| Colors | Blue, Black, White, Gold |
| Portfolio hover scroll | Gallery auto-scrolls when hovered |
| Backend upload | Featured image + gallery in admin |
| Contact form | Built-in, sends to your email |
| Design system section | Colors, typography, components |
| Responsive | Mobile-friendly |

---

## File structure

```
studio-portfolio/
├── style.css              ← Theme info + styles
├── functions.php          ← Setup & enqueues
├── front-page.php         ← Homepage
├── header.php / footer.php
├── single-portfolio.php   ← Single project page
├── inc/
│   ├── portfolio-cpt.php  ← Portfolio post type
│   ├── portfolio-meta.php ← Admin upload boxes
│   └── contact-form.php
├── template-parts/        ← Hero, Work, About, etc.
└── assets/js/main.js      ← Hover auto-scroll
```

---

## Requirements

- WordPress 6.0+
- PHP 7.4+

---

## Preview without WordPress

```bash
cd studio-portfolio/demo
npm start
# Open http://localhost:3000
```

---

## Support

Repo: https://github.com/Abdullahsajid075/amz-prints-erp-new  
Branch: `cursor/design-portfolio-website-09e5`
