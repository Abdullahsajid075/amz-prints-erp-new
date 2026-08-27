# Studio Portfolio — WordPress Theme

A beautiful, eye-catching design portfolio WordPress theme with **blue, black, white, and gold** styling.

## Features

- **Portfolio Custom Post Type** — Manage projects from WordPress admin
- **Backend Image Upload** — Featured image + gallery uploader with drag-to-reorder
- **Hover Auto-Scroll** — Portfolio gallery auto-scrolls when you hover over it
- **Design System** — Built-in showcase of colors, typography, and components
- **Customizer** — Edit hero text, stats, contact info from Appearance → Customize
- **Contact Form** — Built-in form sends to your email
- **Responsive** — Mobile-first design

## Color Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#0A0A0F` | Background |
| Blue | `#2563EB` | Primary accent |
| White | `#FFFFFF` | Text |
| Gold | `#D4AF37` | Highlights & CTAs |

## Installation

1. **Copy the theme** to your WordPress installation:
   ```
   wp-content/themes/studio-portfolio/
   ```

2. **Activate** in WordPress Admin → Appearance → Themes → **Studio Portfolio**

3. **Set homepage**: Settings → Reading → "Your homepage displays" → **A static page** → select any page (or create "Home") and set **Homepage** to it. The theme uses `front-page.php` automatically.

4. **Flush permalinks**: Settings → Permalinks → Save (registers portfolio URLs)

## Adding Portfolio Items (Backend Upload)

1. Go to **Portfolio → Add New** in WordPress admin
2. Enter **Title** and **Description** (content editor)
3. Set **Featured Image** (main project image) in the right sidebar
4. Fill in **Portfolio Details** meta box:
   - Display Number (01, 02...)
   - Year, Client, Project URL
   - Tags (comma-separated)
5. Use **Portfolio Gallery** to upload additional images:
   - Click **Upload / Add Images**
   - Select multiple images from media library
   - Drag to reorder, click × to remove
6. Assign a **Portfolio Category**
7. Set **Order** via Page Attributes → Order (lower = first)
8. **Publish**

## Customizer Options

Appearance → Customize → **Portfolio Settings**:

- Hero status, title lines, description
- About title and text
- Contact email and location
- Stats (projects, clients, years, awards)

## Portfolio Auto-Scroll

The portfolio section on the homepage automatically scrolls horizontally when you **hover** over it. Users can also **drag** to scroll manually. Works on desktop and touch devices.

## File Structure

```
studio-portfolio/
├── style.css              # Theme styles + metadata
├── functions.php          # Theme setup, enqueues
├── front-page.php         # Homepage template
├── header.php / footer.php
├── single-portfolio.php   # Single project page
├── inc/
│   ├── portfolio-cpt.php  # Custom post type
│   ├── portfolio-meta.php # Admin upload meta boxes
│   └── contact-form.php   # Form handler
├── template-parts/        # Section templates
└── assets/
    ├── js/main.js         # Auto-scroll, nav, animations
    ├── js/admin.js        # Gallery uploader
    └── css/admin.css      # Admin styles
```

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Development

This theme is standalone — no build step required. Edit PHP templates and CSS directly.

For local development, use [Local WP](https://localwp.com/), [MAMP](https://www.mamp.info/), or Docker with WordPress.
