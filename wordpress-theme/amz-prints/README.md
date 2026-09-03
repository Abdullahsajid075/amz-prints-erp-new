# AMZ Prints — WordPress Theme

A modern, fully customizable WordPress theme for **AMZ Prints** (professional printing & advertising). Powerful homepage, products, services, gallery, quote, and contact pages — everything editable from the WordPress Customizer and admin.

## Install

1. Zip the `amz-prints` folder (the folder itself, not its parent).
2. In WordPress: **Appearance → Themes → Add New → Upload Theme**.
3. Activate **AMZ Prints**.
4. On activation the theme will:
   - Create Home, About, Services, Products, Gallery, Get a Quote, Contact pages
   - Set Home as the front page
   - Create a Primary menu
   - Seed demo Products & Services

### Local / FTP install

Copy `amz-prints` into:

```
wp-content/themes/amz-prints
```

Then activate it under **Appearance → Themes**.

## Customize everything

Go to **Appearance → Customize**:

| Section | What you can change |
|--------|----------------------|
| **Site Identity** | Logo, site title |
| **AMZ Brand Colors** | Primary, secondary, accent |
| **Company Info** | Name, tagline, phone, email, address, hours, WhatsApp |
| **Homepage Hero** | Headline, subcopy, CTAs, background image |
| **Homepage Sections** | Titles, subtitles, show/hide sections |
| **Social Links** | Facebook, Instagram, LinkedIn, YouTube, TikTok |
| **Menus** | Primary & footer |

### Products & Services

- **Services** and **Products** appear in the WordPress admin sidebar.
- Add, edit, reorder, set featured images anytime.
- Services have an **icon** field; products have a **price label** (e.g. `From $25`).

### Forms

Built-in Contact and Quote forms email your company email (Customizer → Company Info).

For advanced forms, edit the Contact or Quote page and paste a **Contact Form 7** / **WPForms** shortcode — page content replaces the default form.

### Gallery

Edit the Gallery page and add a WordPress **Gallery** or image blocks. Until then, a sample mosaic is shown.

## Pages included

- Home (hero + quick actions + services + products + process + trust + NADRA + track + CTA)
- About
- Services
- Products (premium product cards)
- How We Work (full working mechanism with visual steps)
- NADRA E-Services (authorized partner + certifications)
- Track Order (Order ID / phone lookup — connect ERP via `amz_prints_track_order` filter)
- Gallery
- Get a Quote
- Contact
- 404

## Brand defaults

Matches your ERP brand:

- Primary (blue): `#0747a3`
- Accent (orange): `#ff6d00`
- Text: `#111111`
- Company: AMZ Prints

## Customer login portal

Header **Log in** / **Sign up** open `/customer-login/`.

- **Log in:** email + password, or **Continue with Google** (existing accounts only).
- **Sign up:** name / email / phone / password, or **Continue with Google** (Google verifies the Gmail; first-time Google creates the CRM account).
- **Forgot password:** 6-digit code emailed via WordPress `wp_mail`, then set a new password.

Set **Appearance → Customize → Customer Portal → Google OAuth Client ID**. After uploading this theme, **redeploy Apps Script** (`gas/Code.gs`, New version) so Google signup-create and email reset APIs exist.

## Tips

1. Upload a logo under **Customize → Site Identity**.
2. Upload a hero photo under **Customize → Homepage Hero**.
3. Replace demo product/service content with your real catalog.
4. After activation, visit **Settings → Permalinks** and click **Save** if product/service URLs 404.
5. Recommended plugins (optional): Contact Form 7, Yoast SEO, Smush (images).

## File structure

```
amz-prints/
├── style.css
├── functions.php
├── front-page.php
├── header.php / footer.php
├── page.php / single.php / index.php / 404.php
├── archive-amz_product.php
├── archive-amz_service.php
├── page-templates/
├── inc/          (customizer, post types, assets)
└── assets/css|js
```
