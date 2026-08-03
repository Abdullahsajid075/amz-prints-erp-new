# AMZ Prints ERP System

A modern, professional, cloud-based Enterprise Resource Planning (ERP) web application designed specifically for AMZ Prints printing and advertising company.

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **React Router 7** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Recharts** - Data visualization and charts
- **Lucide React** - Beautiful icon system
- **Axios** - HTTP client for API calls
- **Sonner** - Toast notifications

### Backend Integration
- **Google Apps Script** - Custom backend API
- **Google Sheets** - Database
- **Google Drive** - File storage system

### Design System
- **Primary Color**: Orange (#F26522)
- **Secondary Color**: Dark Gray (#2E2E2E)
- **Background**: Light Gray (#F5F7FB)
- **Cards**: White (#FFFFFF)
- **Typography**: Poppins font family

## Project Structure

```
/app/frontend/src/
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx          # Main application layout
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   └── Sidebar.jsx             # Left sidebar menu
│   ├── modules/
│   │   ├── auth/
│   │   │   └── Login.jsx           # Authentication page
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx       # Business overview dashboard
│   │   ├── orders/
│   │   │   ├── OrdersList.jsx      # Orders listing and management
│   │   │   └── OrderForm.jsx       # Create/edit order form
│   │   ├── customers/              # Customer management (structure ready)
│   │   ├── products/               # Product catalog (structure ready)
│   │   ├── designers/              # Designer management (structure ready)
│   │   ├── production/             # Production workflow (structure ready)
│   │   ├── inventory/              # Stock management (structure ready)
│   │   ├── invoices/               # Invoice generation (structure ready)
│   │   ├── payments/               # Payment tracking (structure ready)
│   │   ├── expenses/               # Expense management (structure ready)
│   │   ├── employees/              # Employee management (structure ready)
│   │   ├── reports/                # Business reports (structure ready)
│   │   └── settings/               # System settings (structure ready)
│   ├── ui/                         # Reusable shadcn/ui components
│   └── ProtectedRoute.jsx          # Route authentication guard
├── services/
│   └── api.js                      # API integration service
├── context/
│   └── AuthContext.jsx             # Authentication state management
├── utils/
│   ├── constants.js                # Application constants
│   └── helpers.js                  # Utility functions
├── lib/
│   └── utils.js                    # Library utilities
└── App.js                          # Main application component
```

## Features Implemented

### ✅ Authentication Module
- Login page with email/username and password
- Integration with Google Apps Script authentication
- Session management with localStorage
- Protected routes and automatic redirects
- Role-based access control ready

### ✅ Dashboard Module (Fully Functional)
- Business statistics overview
- Date range filters
- Statistics cards:
  - Total Orders
  - Pending Orders
  - Completed Orders
  - Revenue
  - Expenses
  - Receivables
  - Payables
  - Active Customers
- Data visualization:
  - Monthly Sales Trend (Line Chart)
  - Order Status Distribution (Pie Chart)
- Recent orders table with status badges

### ✅ Orders Module (Fully Functional)
- Complete order listing with search and filters
- Create new orders
- Edit existing orders
- Duplicate orders
- Delete orders
- Multi-product support per order
- Customer information capture
- Designer assignment
- Delivery date tracking
- Order status workflow:
  - Order Received
  - Designing
  - Proof Approval
  - Printing
  - Finishing
  - Packing
  - Ready
  - Delivered
  - Cancelled
- Automatic calculations:
  - Product subtotals
  - Total amount
  - Advance payment
  - Balance amount
- Remarks and notes support

### 🏗️ Additional Modules (Structure Ready)
All remaining modules have complete:
- Navigation integration
- Routing setup
- Page layout and structure
- Placeholder content
- Ready for implementation

Modules with structure:
- Customers Management
- Products Catalog
- Designers Management
- Production Workflow
- Inventory Management
- Invoice Generation
- Payment Tracking
- Expense Management
- Employee Management
- Business Reports
- System Settings

## API Integration

The frontend is configured to integrate with your existing Google Apps Script backend. Update the API base URL in:

```bash
# /app/frontend/.env
REACT_APP_GAS_API_URL=your_google_apps_script_deployment_url
```

See **INTEGRATION_GUIDE.md** for detailed backend integration instructions.

## Running the Application

### Development
```bash
cd /app/frontend
yarn install
yarn start
```

### Production Build
```bash
yarn build
```

## Configuration

### Environment Variables

Create `/app/frontend/.env`:
```
REACT_APP_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
REACT_APP_BACKEND_URL=https://your-domain.com
```

## User Roles

The system supports multiple user roles:
- Super Admin
- Admin
- Manager
- Sales
- Designer
- Production Staff
- Accounts
- Cashier
- Employee

## Design Guidelines

- **Color Palette**:
  - Primary: #F26522 (Orange)
  - Secondary: #2E2E2E (Dark Gray)
  - Background: #F5F7FB (Light Gray)
  - Card: #FFFFFF (White)

- **Typography**: Poppins font family
- **Spacing**: Consistent padding and margins
- **Shadows**: Soft shadows for depth
- **Rounded Corners**: Modern rounded corners
- **Responsive**: Mobile-first design approach

## File Upload Support

The system supports uploading files to Google Drive with these formats:
- PDF, AI, PSD, CDR, EPS, SVG
- JPG, PNG, TIFF
- DOCX, XLSX
- ZIP

Files are stored in Google Drive with only File ID and metadata in the database.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Documentation

- **README.md** (this file) - Overview and quick start
- **INTEGRATION_GUIDE.md** - Detailed Google Apps Script backend integration guide

## License

Proprietary - AMZ Prints
