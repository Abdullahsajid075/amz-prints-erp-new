import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound } from 'lucide-react';

const Employees = () => {
  return (
    <div className="space-y-6" data-testid="employees-page">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Employees</h1>
        <p className="text-gray-600 mt-1">Manage employee information</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Employee Management Module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Employee management features will be implemented here. This includes employee profiles, attendance, salaries, roles, permissions, and performance.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;