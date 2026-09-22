import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';

const Designers = () => {
  return (
    <div className="space-y-6" data-testid="designers-page">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#0747a3' }}>Designers</h1>
        <p className="text-gray-600 mt-1">Manage designers and their workload</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Designer Management Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Designer management features will be implemented here. This includes designer profiles, assigned jobs, pending work, completed tasks, and performance tracking.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Designers;