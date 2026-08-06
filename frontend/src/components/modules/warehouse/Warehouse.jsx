import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useBrand } from '@/context/BrandContext';
import { Package, Boxes } from 'lucide-react';

const links = [
  {
    title: 'Products',
    description: 'Manage products, services, rates and stock',
    path: '/warehouse/products',
    icon: Package,
    testId: 'warehouse-products',
  },
  {
    title: 'Inventory',
    description: 'Stock levels and adjustments',
    path: '/warehouse/inventory',
    icon: Boxes,
    testId: 'warehouse-inventory',
  },
];

const Warehouse = () => {
  const { primary } = useBrand();

  return (
    <div className="space-y-6" data-testid="warehouse-hub">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Warehouse</h1>
        <p className="text-gray-600 mt-1">Products and inventory (Purchases is on the main menu)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default Warehouse;
