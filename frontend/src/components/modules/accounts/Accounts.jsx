import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useBrand } from '@/context/BrandContext';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Receipt, Truck } from 'lucide-react';

const allLinks = [
  {
    title: 'Payments',
    description: 'Money in / money out and payment methods',
    path: '/accounts/payments',
    icon: CreditCard,
    testId: 'accounts-payments',
  },
  {
    title: 'Expenses',
    description: 'Operating expenses by category',
    path: '/accounts/expenses',
    icon: Receipt,
    testId: 'accounts-expenses',
  },
  {
    title: 'Vendors',
    description: 'Suppliers and payables (restricted)',
    path: '/accounts/vendors',
    icon: Truck,
    testId: 'accounts-vendors',
    requireVendors: true,
  },
];

const Accounts = () => {
  const { primary } = useBrand();
  const { canAccessVendors } = useAuth();
  const links = allLinks.filter((item) => !item.requireVendors || canAccessVendors);

  return (
    <div className="space-y-6" data-testid="accounts-hub">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Accounts</h1>
        <p className="text-gray-600 mt-1">Payments, expenses and vendors</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((item) => (
          <Link key={item.path} to={item.path} data-testid={item.testId} className="block group">
            <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 border-gray-100">
              <CardContent className="p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
                  style={{ backgroundColor: primary || '#F26522' }}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#2E2E2E' }}>{item.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                <p className="text-sm font-semibold mt-4 group-hover:underline" style={{ color: primary || '#F26522' }}>
                  Open →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
