# Localhost Demo — Studio Portfolio

Preview the WordPress theme **without installing WordPress**.

## Quick Start

### Option 1 — Double-click (Windows)
Double-click **`start.bat`**

### Option 2 — Terminal (Mac / Linux / Windows)
```bash
cd wordpress-theme/studio-portfolio/demo
chmod +x start.sh
./start.sh
```

### Option 3 — npm
```bash
cd wordpress-theme/studio-portfolio/demo
npm start
```
Open **http://localhost:3000**

---

## Important

Do **NOT** open `index.html` directly in the browser (file://).  
CSS and JavaScript will not load. You **must** use a local server.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / no styles | Use a server — don't open file directly |
| `python not found` | Run `npm start` instead (needs Node.js) |
| Port in use | Run `npx serve -l 4000 .` and open http://localhost:4000 |
| `npx` slow first time | Wait — it downloads `serve` once, then starts |
| Wrong folder | Must run from the **`demo`** folder |

---

## What You'll See

- Blue, black, white, and gold theme
- Portfolio gallery with **hover auto-scroll**
- Hero, About, Design System, Contact sections
