# Google Apps Script Backend — Database Sync

## Why UI works but Sheets stay empty

Usually one of these:

1. **Old Code.gs still deployed** (most common) — UI talks to GAS, but old script has no `/tokens` write logic / wrong header mapping  
2. **Counters/Customers columns missing** — data can't map into your existing headers  
3. **SPREADSHEET_ID** Script property points to a different spreadsheet  

## Fix now (do in order)

### 1. Redeploy Code.gs
1. Open Apps Script project  
2. Replace ALL code with repo file `gas/Code.gs`  
3. Project Settings → enable **Show "appsscript.json" manifesto file**  
4. Paste repo `gas/appsscript.json` (includes Drive scope for employee/product photos)  
5. Select function **`authorizeDriveAccess`** → **Run** → click **Allow** (Drive permission)  
6. **Deploy → Manage deployments → Edit → New version → Deploy**

### Employee / product photos
- **Employee photos** try Drive first; if Drive is not authorized they save as a compressed image in the Employees sheet (no Drive needed).
- **Product photos** still prefer Drive folders (`AMZ-ERP-Product-Images`).
- Optional: run **`authorizeDriveAccess`** → Allow → Deploy New version for Drive URLs.

### 2. Prepare database (pick one)

**Option A — Apps Script editor**  
Select function `prepareDatabase` → Run (authorize if asked)

**Option B — ERP UI**  
Token Booking page → **Sync Sheets** button

This only **adds missing columns**. It does not delete your data.

### 3. Verify
- Token Booking page should show: `Connected · N counter(s) loaded…`  
- Book a token → check **Counters** sheet for a new `Token` row  
- Check **Customers** sheet for customer (by phone)

## Counters sheet

Rows can be:

| RecordType | CounterName | Prefix | LastNumber | Status | TokenNo | … |
|------------|-------------|--------|------------|--------|---------|---|
| Counter | Counter 1 | A | 0 | Active | | |
| Token | Counter 1 | | | | A-001 | … |

If Counters was empty, Sync creates Counter 1 / Counter 2.

## Debug API

After login token:

- `GET ?path=/debug/schema&token=...` → sheet headers + row counts  
- `POST ?path=/debug/prepare&token=...` → ensure columns  

## Users login

| Username | Password |
|----------|----------|
| admin | admin123 |

(Use exact values from your Users sheet.)
