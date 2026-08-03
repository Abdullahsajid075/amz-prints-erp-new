# Google Apps Script Backend Integration Guide

This guide helps you connect the AMZ Prints ERP frontend with your Google Apps Script backend.

## Quick Start

1. **Set Your API URL**

Edit `/app/frontend/.env` and add your Google Apps Script deployment URL:

```env
REACT_APP_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

2. **Restart Frontend**

```bash
sudo supervisorctl restart frontend
```

## Google Apps Script Backend Setup

Your Google Apps Script backend should handle CORS and return JSON responses in this format:

### Authentication Response Format

```javascript
// Login Success
{
  "success": true,
  "token": "jwt_token_or_session_id",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Admin"
  }
}

// Login Error
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Dashboard Stats Response

```javascript
{
  "totalOrders": 150,
  "pendingOrders": 25,
  "completedOrders": 120,
  "revenue": 500000,
  "expenses": 150000,
  "receivables": 100000,
  "payables": 50000,
  "activeCustomers": 45
}
```

### Orders List Response

```javascript
[
  {
    "id": "order_id",
    "orderId": "ORD-001",
    "customerName": "ABC Company",
    "customerEmail": "contact@abc.com",
    "customerPhone": "+91-9876543210",
    "date": "2024-01-15",
    "deliveryDate": "2024-01-20",
    "status": "Printing",
    "totalAmount": 15000,
    "advancePayment": 5000,
    "balanceAmount": 10000,
    "products": [
      {
        "name": "Business Cards",
        "quantity": 500,
        "rate": 30,
        "size": "3.5x2 inches",
        "material": "Premium Card Stock"
      }
    ]
  }
]
```

## CORS Configuration

Your Google Apps Script should include CORS headers:

```javascript
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({data: 'response'}))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function doPost(e) {
  // Similar CORS headers
  return handleRequest(e);
}
```

## API Request Format

The frontend sends requests with:

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body (POST/PUT):**
```json
{
  "customerName": "ABC Company",
  "customerPhone": "+91-9876543210",
  "deliveryDate": "2024-01-20",
  "products": [...]
}
```

## Authentication Flow

1. User enters credentials in login form
2. Frontend sends POST to `/auth/login`
3. Backend validates credentials
4. Backend returns token and user data
5. Frontend stores token in localStorage
6. Token sent in Authorization header for all subsequent requests

## Google Sheets Database Structure

### Orders Sheet
| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique order ID |
| orderId | String | Display order number |
| customerName | String | Customer name |
| customerEmail | String | Email address |
| customerPhone | String | Phone number |
| date | Date | Order date |
| deliveryDate | Date | Expected delivery |
| status | String | Order status |
| totalAmount | Number | Total amount |
| products | JSON String | Array of products |

### Customers Sheet
| Column | Type | Description |
|--------|------|-------------|
| id | String | Customer ID |
| name | String | Customer name |
| email | String | Email |
| phone | String | Phone |
| address | String | Address |

### Users Sheet (Authentication)
| Column | Type | Description |
|--------|------|-------------|
| id | String | User ID |
| name | String | Full name |
| email | String | Email/Username |
| password | String | Hashed password |
| role | String | User role |

## File Upload Integration

For file uploads to Google Drive:

```javascript
// Frontend sends FormData
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('orderId', 'order_123');

// Backend saves to Google Drive
function uploadFile(fileBlob, fileName) {
  const folder = DriveApp.getFolderById('YOUR_FOLDER_ID');
  const file = folder.createFile(fileBlob);
  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl()
  };
}
```

## Sample Google Apps Script Code

```javascript
function doPost(e) {
  try {
    const path = e.parameter.path || '/';
    const body = JSON.parse(e.postData.contents);
    
    let response;
    
    switch(path) {
      case '/auth/login':
        response = handleLogin(body);
        break;
      case '/orders':
        response = createOrder(body);
        break;
      default:
        response = { error: 'Invalid endpoint' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLogin(data) {
  const sheet = SpreadsheetApp.openById('SHEET_ID').getSheetByName('Users');
  const users = sheet.getDataRange().getValues();
  
  // Find user and validate password
  // Return token and user data
  
  return {
    success: true,
    token: 'generated_token',
    user: {
      id: 'user_id',
      name: 'User Name',
      role: 'Admin'
    }
  };
}
```

## Testing the Integration

1. **Test Authentication:**
```bash
curl -X POST https://your-script-url/exec?path=/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amz.com","password":"password"}'
```

2. **Test Orders API:**
```bash
curl -X GET https://your-script-url/exec?path=/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

**Issue: CORS Error**
- Ensure CORS headers are set in Google Apps Script
- Check if the script is deployed as "web app"
- Make sure "Execute as" is set to "Me"
- "Who has access" should be "Anyone"

**Issue: Authentication Not Working**
- Verify token is being saved in localStorage
- Check Authorization header format
- Ensure Google Script validates token correctly

**Issue: Data Not Loading**
- Check browser console for errors
- Verify API endpoints match expected format
- Confirm Google Sheets structure matches expected columns

## Security Best Practices

1. **Password Hashing**: Use secure hashing for passwords
2. **Token Validation**: Validate tokens on every request
3. **Input Sanitization**: Clean all user inputs
4. **Rate Limiting**: Implement request rate limits
5. **HTTPS Only**: Always use HTTPS
6. **Role-Based Access**: Check user permissions for each action

## Support

For integration issues:
1. Check browser console for error messages
2. Verify Google Apps Script logs
3. Test API endpoints independently
4. Review this guide thoroughly
