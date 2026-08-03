import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse } from 'lucide-react';

const Inventory = () => {
  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Inventory</h1>
        <p className="text-gray-600 mt-1">Manage stock and inventory levels</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Inventory Management Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Inventory management features will be implemented here. This includes stock control, suppliers, purchases, stock movements, and low-stock alerts.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;