/** Canonical AMZ Prints ERP operator manual — used on-screen, print, and download. */

export const GUIDE_VERSION = '2.1';
export const GUIDE_EFFECTIVE = 'September 2026';

export const GUIDE_SECTIONS = [
  {
    id: 'overview',
    title: '1. System overview',
    audience: 'All staff',
    body: [
      'AMZ Prints ERP is the operational system of record for Amazon Printing Services. It covers the full commercial cycle: enquiry → quotation → token / POS / order → production → invoice → collection, plus purchasing, HR, inventory, and reporting.',
      'Live data is stored in the company database (not Google Sheets). Sheets remain a read-only historical backup. Do not treat the old sheet as the current balance.',
      'Each login is limited to the modules assigned by Admin. If a menu item is missing, request access in Settings → Users rather than sharing another person’s password.',
    ],
  },
  {
    id: 'access',
    title: '2. Access, roles & security',
    audience: 'Admin / all staff',
    body: [
      'Sign in with the username and password issued by Admin. Sessions expire according to Settings → Users → Session timeout.',
      'Recommended roles: Super Admin / Admin (full control), Manager (operations + reports), Sales (quotations, orders, customers, CRM), Designer (assigned jobs), Production (status updates), Accounts (invoices, payments, purchases, expenses), Cashier (POS, tokens, payments).',
      'Never reuse the admin password. Disable leavers immediately (status Inactive). Customer blocking is available on the customer record; only Admin can unblock.',
      'Public pages (order tracking, employee ID verify) do not require staff login. Do not publish internal URLs on social media.',
    ],
  },
  {
    id: 'dashboard',
    title: '3. Command dashboard',
    audience: 'Managers',
    body: [
      'The dashboard is the daily start screen. Use Today / 7 days / Month / All (or a custom date range) then Apply. Filters apply to revenue, expenses, and order counts. Receivables are company-wide customer balances (not limited to the date chip).',
      'Tiles: Quotations, Orders, Invoices, Revenue, Receivables (click to open unpaid balances), Cash net (Payments in − Payments out), Payables (unpaid purchase orders), pipeline stages (Design, Production, Ready, Delivered).',
      'Needs attention lists ready jobs, overdue deliveries, and unpaid order balances. Jump search finds an order, tracking number, or customer from recent work.',
      'Monthly sales shows the last six calendar months. If a chart is empty, confirm that orders have valid YYYY-MM-DD dates.',
    ],
  },
  {
    id: 'tokens',
    title: '4. Token booking & counter',
    audience: 'Front desk / cashier',
    body: [
      'Issue a token for walk-in customers waiting for design consultation, file check, or collection. Capture name, phone, and service.',
      'Call → In progress → Complete / Skip / Cancel. Link a token to an order once the job is confirmed so the queue and the job card stay connected.',
      'Do not create a second customer if the phone already exists — the system reuses the CRM record.',
    ],
  },
  {
    id: 'pos',
    title: '5. Point of sale',
    audience: 'Cashier',
    body: [
      'POS is for same-day / over-the-counter sales. Select products, quantities, and a payment method. Walk-in is the default customer when no phone is entered.',
      'A POS ticket posts an order (doc type POS) and typically a paid invoice. Cash must match the Payments module (inflow).',
      'POS is for same-day / over-the-counter sales. Menu → POS opens a dedicated till window. Open the cash register (opening float) before the first sale; close with a Z-report (counted cash vs expected). Statement and Z-reports live under Accounts.',
    ],
  },
  {
    id: 'quotations',
    title: '6. Quotations',
    audience: 'Sales',
    body: [
      'Create a quotation for jobs that are not yet confirmed. Line items should match the product catalogue rates unless a written discount is approved.',
      'Share the quotation with the customer. When accepted, convert it to an order — do not re-key products. The order keeps a quotation reference for audit.',
      'Expired or rejected quotations stay in the list for history; they do not affect receivables.',
    ],
  },
  {
    id: 'orders',
    title: '7. Orders & production pipeline',
    audience: 'Sales / design / production',
    body: [
      'An order is the job card. Required: customer (or walk-in), products, totals, delivery date when Settings require it.',
      'Advance payment reduces the order balance. Remaining balance is what the customer still owes on that job until it is covered by an invoice payment or customer credit.',
      'Status flow (typical): Order Received → Designing / Proof → Printing / Finishing / Packing → Ready → Delivered. Cancelled jobs drop out of receivables.',
      'Assign a designer when artwork is needed. Update status as work moves — dashboard pipeline and WhatsApp templates depend on the current status.',
      'Tracking number can be sent to the customer. Delivery slip is printable from the order.',
    ],
  },
  {
    id: 'invoices',
    title: '8. Invoicing',
    audience: 'Accounts / sales',
    body: [
      'Invoices are the commercial document for AR. One invoice may cover one or more orders (order IDs are stored on the invoice).',
      'Previous balance on an invoice is the customer’s already-open AR at billing time. Total due = invoice total + previous balance − paid.',
      'Record collections against the invoice (not only as a loose note). Partial payments set status to Partial; full settlement sets Paid.',
      'Print or share the branded PDF/HTML invoice. Logo, stamp, signature, tax, and terms come from Settings → Company / Invoice.',
      'Do not create a second invoice for the same order unless Admin is splitting or correcting a voided document.',
    ],
  },
  {
    id: 'receivables',
    title: '9. Customer balances (source of truth)',
    audience: 'Accounts',
    body: [
      'Customer Outstanding is calculated as: unpaid invoice dues + balances on orders that are not yet on an invoice − customer credit. If the older order-balance total is higher (legacy jobs), the system keeps the higher figure so nothing disappears after the database cutover.',
      'Credit balance is money received with no open invoice (overpayment or advance without a bill). It reduces outstanding and should be applied to the next invoice.',
      'Customers list and ledger both show this figure. Dashboard Receivables is the sum of every customer’s outstanding.',
      'Send a WhatsApp balance request from the customer card. Always confirm the amount on screen before sending.',
      'Blocked customers cannot receive new orders until Admin unblocks them with a reason on file.',
    ],
  },
  {
    id: 'payments',
    title: '10. Payments (cash book)',
    audience: 'Cashier / accounts',
    body: [
      'Payments is the cash book: Inflow (customer collections, POS, other income) and Outflow (vendor payments, some cash expenses).',
      'Dashboard Net position uses this module only — it does not mix the Expenses sheet into cash. That is intentional so bank/cash can be reconciled.',
      'Every collection should have method (Cash, Bank, Card, etc.), date, party, and a reference (invoice / order / PO).',
      'Vendor PO payments are posted from Purchases → Pay; they appear here as outflows and reduce the PO outstanding.',
    ],
  },
  {
    id: 'customers',
    title: '11. Customers & CRM',
    audience: 'Sales',
    body: [
      'Customers hold identity, contacts, notification flags, block status, credit, and outstanding. Phone is the duplicate key — the same number updates the existing record.',
      'CRM stages (Lead → … → Won/Lost) are configured in Settings → Modules. Move cards on the CRM board; notes are timestamped.',
      'Notification toggles control whether WhatsApp / email templates fire for that customer.',
      'Walk-in is a system customer for POS. Do not block or delete it.',
    ],
  },
  {
    id: 'warehouse',
    title: '12. Products, inventory & costing',
    audience: 'Warehouse / sales',
    body: [
      'Products store rates, sale price, category, photos, and “show on website”. Keep names consistent with what appears on quotations and the public catalogue.',
      'Website catalog rule: a product is published only when it has at least one HD photo and a description. Incomplete items are auto-hidden from amzprints.com until both are added.',
      'Inventory lists only products that have Track inventory on. Services have no quantity and never appear in inventory. Each product has its own Track inventory switch — if it is off, sales continue without stock.',
      'POS opens as a dedicated till window (not an ERP tab). Register, slip QRs, and service cards live in POS settings. Statement stays under Accounts.',
      'Printing Cost Calculator is a planning tool for media, size, and quantity. Transfer the result into a quotation/order; the calculator itself does not post stock or AR.',
    ],
  },
  {
    id: 'purchases',
    title: '13. Purchases & vendors',
    audience: 'Accounts / procurement',
    body: [
      'Vendors are suppliers. Outstanding payable is the sum of unpaid / partial purchase orders for that vendor.',
      'Create a PO with lines, vendor invoice number, and expected delivery. Status moves Draft → Ordered → Received → Partial / Fully Paid.',
      'Pay against the PO; do not reduce totals by editing history. Cancelled POs do not count as payables.',
      'Link a PO to a customer order when the purchase is job-specific (outsourced print, special material).',
    ],
  },
  {
    id: 'expenses',
    title: '14. Expenses',
    audience: 'Accounts / admin',
    body: [
      'Log operating expenses (rent, utilities, courier, petty cash) with category, amount, and payee.',
      'Unapproved expenses do not hit dashboard P&L. Approvers should review daily. Rejected items stay out of totals.',
      'Do not duplicate a vendor PO payment as an expense unless it is a true overhead not on a PO.',
    ],
  },
  {
    id: 'hr',
    title: '15. Employees & designers',
    audience: 'Admin / HR',
    body: [
      'HR → Employees is the staff master: code, CNIC, role, salary, photo, validity dates (used on public ID verify).',
      'Grant ERP login from Settings → Users by linking employee ID. Designers module shows workload from assigned orders.',
      'Do not store government ID scans in notes fields. Photo should be a small compressed image.',
    ],
  },
  {
    id: 'reports',
    title: '16. Reports & audit',
    audience: 'Management',
    body: [
      'Reports include P&L, sales, POS statement, purchases, expenses, payments, order detail, top customers/products, and assets.',
      'Export CSV or print for accountants. Date filters are inclusive (from/to).',
      'P&L uses order revenue minus approved expenses (and purchase totals where shown). Receivables in reports follow the same customer outstanding rules as the dashboard.',
    ],
  },
  {
    id: 'settings',
    title: '17. Settings (control panel)',
    audience: 'Admin',
    body: [
      'Company: legal name, address, tax id, logo (PNG with transparency), stamp, signature. These print on invoices and this guidebook cover.',
      'Invoice: prefix, tax %, terms, template, QR / stamp / signature toggles.',
      'Theme: primary / secondary / accent used across the ERP chrome.',
      'Modules: order prefix, customer codes, credit limit, CRM stages, product categories, payment methods, HR attendance.',
      'Users: create accounts, assign module permissions, password policy.',
      'Notifications: WhatsApp / email templates and daily reminder hour. Invoice WhatsApp and customer ledger WhatsApp open the official app with a filled message — staff must tap Send. Allow popups if the chat does not open.',
      'System: currency (PKR), date format. Guide Book (this document) plus house rules you type below are stored with settings.',
    ],
  },
  {
    id: 'sop',
    title: '18. Daily operating procedures',
    audience: 'All shifts',
    body: [
      'Opening: login, check dashboard Needs attention, call waiting tokens, confirm cash float vs yesterday’s POS statement.',
      'During shift: never skip customer phone when the job is credit. Confirm delivery date. Take advance on large jobs. Update status when a stage actually finishes.',
      'Collections: receive money → post payment to invoice/customer → print receipt if requested → WhatsApp confirmation optional.',
      'Closing: no Ready jobs left unannounced, expenses submitted for approval, POS statement saved, logout.',
    ],
  },
  {
    id: 'controls',
    title: '19. Internal controls & exceptions',
    audience: 'Admin / accounts',
    body: [
      'Segregation: the person who creates a PO should not be the only approver of its payment when amounts are material.',
      'Voids and deletes: prefer Cancel + note. Deleting historical invoices/orders is an Admin-only exception.',
      'Discounts above policy require Manager/Admin mention in order remarks.',
      'If a balance looks wrong: open Customer → Ledger, compare invoices, uninvoiced orders, payments, and credit. Fix the source document; do not type a balancing figure into Settings.',
    ],
  },
  {
    id: 'website',
    title: '20. Website, tracking & cutover notes',
    audience: 'Admin',
    body: [
      'Public catalogue / order forms on the company website talk to the same API as this ERP. Only products with an HD photo and a description are listed; everything else is auto-hidden.',
      'Customers can track jobs with order/tracking numbers without staff login.',
      'Google Sheets is retained as backup only. New work must be done in this ERP so balances, stock, and invoices stay in one place.',
    ],
  },
];
