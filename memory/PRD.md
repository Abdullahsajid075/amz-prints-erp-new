# AMZ Prints ERP — Product Requirements Document

## Original Problem Statement
Modern cloud-based ERP for "AMZ Prints" (printing & advertising).
Frontend: React + Shadcn + Tailwind + Poppins + Orange `#F26522`.
Backend: Google Apps Script (GAS) with Google Sheets DB + Google Drive files.
Deployment: **Frontend on Vercel**, backend on Google Apps Script.

## Architecture
- **Smart API wrapper** (`src/services/api.js`) auto-routes to `REACT_APP_GAS_API_URL` if set, else full mock backend (`src/services/mockAuth.js`).
- **Stateful mock** across orders, customers, invoices, purchases, vendors, payments, products, expenses, settings, reports.
- **Token storage** centralised in `src/services/tokenStorage.js` (24h expiry + base64 obfuscation).
- **Vercel-ready**: `vercel.json` + SPA rewrites + `.env.example` + `.nvmrc`.

## Modules
Dashboard, Orders, Customer Portal, Products, Designers, Production (kanban), Vendors, Purchases, Inventory, Invoices (+ create/edit form), Payments (transaction ledger), Expenses, Employees, Reports, Settings.

## Environment Variables (Vercel)
| Key | Purpose |
| --- | --- |
| `REACT_APP_GAS_API_URL` | Apps Script Web App URL (empty = mock). |
| `REACT_APP_DEMO_PASSWORD` | Mock admin password. |
| `REACT_APP_DEMO_TOKEN` | Mock JWT. |

## Changelog

### 2026-02 — Customers, Production, Invoice CRUD, auto-recording
- **Customers portal** (was placeholder): full CRUD + card grid + search + stats. Click any customer → **Ledger dialog** with Total Billed / Total Paid / Outstanding stats + tabs for Invoices / Orders / Payments.
- **Production module** (was placeholder): kanban board with 7 stages (Received → Designing → Proof → Printing → Finishing → Packing → Ready). Each order card has a "next stage" button that mutates status in-place.
- **InvoiceForm** (new file): create + edit at `/invoices/new` and `/invoices/:id/edit`. Customer picker with "Add new customer" inline. Auto-loads previous outstanding balance from customer ledger. Live totals, tax/discount, previous balance rolled into grand total. Derived Paid/Partial/Unpaid status.
- **Invoice auto-upsert customer**: on invoice create/update, customer is matched by phone (or name) and inserted/updated in `mockCustomers` so they appear in Customer Portal automatically.
- **InvoiceView** now has an **Edit** button.
- **Invoice cards** made compact (`xl:grid-cols-4`, ~50 % smaller footprint) with View / Edit / Copy-link / WhatsApp buttons.
- Fixed **stateless mockOrdersAPI** bug (kanban moves now persist).
- Fixed React controlled/uncontrolled warning on Select and added DialogDescription for a11y.

### 2026-02 — Orders redesign + Payments + Print/WhatsApp
- OrdersList: In-progress compact cards + Completed table. Each order → View / Generate Invoice / WhatsApp / Print (A4 popup) / Edit.
- Payments module built from scratch — transaction history + methods from Settings.
- Invoice print CSS tuned for single-page A4 up to 10 items.

### 2026-02 — Dashboard modern redesign + Deployment ready
- Hero gradient dashboard, KPI cards, responsive charts.
- Centralised tokenStorage, hook exhaustive-deps fixes, stable keys, useMemo perf, tokenStorage wrapper.
- Vercel deployment config.

## Prioritised Backlog

### P1
- **Theme Apply**: settings → CSS variables (currently stored but not consumed).
- **Purchase → Order auto-flip**: PO Received → linked customer order = Ready for Delivery (only toasts today).
- **Payments auto-link**: Recording payment on Invoice/PO should push into Payments ledger.
- **OpenAI ERP copilot** (Msg 75 backlog).
- **Google Drive uploads** via GAS.

### P2
- Persist mock state to localStorage across refreshes.
- Real aggregations for Reports.
- Full RBAC (roles defined but not enforced).
- Component splitting for large files (Products 445, Expenses 425, OrderForm 397 lines).
- Emergent Google Auth swap when moving off GAS.

## Test Credentials
See `/app/memory/test_credentials.md` — `admin / admin123`.
