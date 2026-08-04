# Google Apps Script Backend

**Web App URL:**  
`https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec`

## Redeploy required

Copy latest `gas/Code.gs` → Apps Script → **Deploy → New version**.

Then run `setupCounters` once (optional) to seed Counter 1 / Counter 2 if Counters sheet is empty.

## Sheets used (existing only)

Orders, Products, Customers, Invoices, Vendors, Users, Purchases, Expenses, Payments, **Counters**, Settings

## Users sheet

| Username | Password | Name | Role | Status |
|----------|----------|------|------|--------|
| admin | admin123 | Administrator | Admin | Active |

## Counters sheet (Token Booking)

Same sheet stores:

1. **Counter rows** (`RecordType=Counter`): CounterName, AccessHolder, Prefix, LastNumber, Status  
2. **Token rows** (`RecordType=Token`): TokenNo, Date, Time, Customer*, Service, TokenStatus, CalledAt, OrderId

Do not create a separate Tokens sheet.

## Token APIs

- `GET /counters`
- `POST /tokens` — upserts customer by phone, generates token
- `GET /tokens?counter=Counter%201`
- `POST /tokens/:tokenNo/call|complete|skip|link-order`

## Frontend

- `/tokens` — Token Booking (print + WhatsApp)
- `/tokens/counter` — live Counter / Access Holder screen
- Create Order from called token → `/orders/new?...` prefilled

## Fix: Customers / Orders not saving

Older `appendRow_` wrote `obj[header]` using raw sheet headers while API sent camelCase keys. Latest Code.gs maps headers correctly and preserves existing column names.
