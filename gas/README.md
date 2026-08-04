# Google Apps Script Backend

**Web App URL:**  
`https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec`

## Redeploy required (one time)

Copy the latest `gas/Code.gs` into Apps Script and **Deploy → New version** so the frontend gets:

- Auth token via `?token=` query param (required for browser requests)
- Flexible Users sheet column names (`Email`, `email`, `Username`, etc.)
- Proper 401 responses for invalid login

## Users sheet format

Tab name: **Users**

| id | name | email | password | role |
|----|------|-------|----------|------|
| user_1 | Admin User | admin | your-password | Super Admin |

Login with the **email** (or username) and **password** exactly as stored in the sheet.

## Verify from frontend folder

```bash
node scripts/verify-gas.mjs YOUR_EMAIL YOUR_PASSWORD
```

## Frontend env

```
REACT_APP_GAS_API_URL=https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec
```

Set in `frontend/.env` (local) and Vercel (production). Mock mode has been removed — GAS URL is required.

