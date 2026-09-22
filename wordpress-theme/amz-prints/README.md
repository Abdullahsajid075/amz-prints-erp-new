# AMZ Prints WordPress Theme (v2.3.0)

Marketing site + customer e-commerce storefront connected to the AMZ Prints ERP (Google Apps Script).

## What’s new in 2.3.0

- Promo popup (Customizer: image, style, pages, session dismiss)
- Homepage hero: 1 large + 5 supporting images (mobile carousel)
- Compact mobile nav with Products, Services, NADRA, Cart, Login, Checkout, Track
- Full shop flow: Product → Cart → Checkout → Login/Register → Place order
- Orders created in ERP Orders (`orderSource: website`)
- Payment methods: Cash on Delivery / Online Payment (order first; status tracked)
- Order Processing Policy acknowledgement required
- Product images from ERP catalog (`/public/products`)

## Deploy

1. Upload folder `wordpress-theme/amz-prints` (or zip it) to WordPress → Appearance → Themes.
2. Activate **AMZ Prints** (pages Cart / Checkout / Account / Product are auto-created).
3. Paste latest `gas/Code.gs` + `gas/appsscript.json` into Apps Script → authorize → **Deploy → New version**.
4. Customizer → **ERP Order Tracking** → set ERP API URL to your GAS web app.
5. Customizer → Homepage Hero / Promo Popup / Shop & Checkout as needed.

## Customer checkout flow

Browse → Product → Add to cart → Cart → Checkout → Login/Register → Accept policy → COD or Online → Place order → ERP Orders + payment record.
