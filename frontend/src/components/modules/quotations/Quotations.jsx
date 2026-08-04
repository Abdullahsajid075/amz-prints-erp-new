import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { quotationsAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { Plus, Search, Eye, Edit, Trash2, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Quotations = () => {
  const navigate = useNavigate();
  const { primary } = useBrand();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsAPI.getAll();
      setQuotations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const filtered = quotations.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(q.orderId || '').toLowerCase().includes(s) ||
      String(q.customerName || '').toLowerCase().includes(s) ||
      String(q.customerPhone || '').toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      await quotationsAPI.delete(id);
      toast.success('Quotation deleted');
      fetchQuotations();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePrint = async (q) => {
    try {
      const res = await quotationsAPI.getById(q.id);
      const full = res.data;
      navigate(`/quotations/${full.id}/print`);
    } catch {
      toast.error('Failed to open print view');
    }
  };

  return (
    <div className="space-y-6" data-testid="quotations-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Quotations</h1>
          <p className="text-gray-600 mt-1">Create quotes, convert to orders, print</p>
        </div>
        <Button
          onClick={() => navigate('/quotations/new')}
          className="text-white"
          style={{ backgroundColor: primary || '#F26522' }}
          data-testid="create-quotation-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by ID, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="quotation-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-gray-500">No quotations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Quote #</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600 hidden md:table-cell">Date</th>
                    <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Status</th>
                    <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="border-b hover:bg-orange-50/40" data-testid={`quotation-row-${q.id}`}>
                      <td className="py-2.5 px-3 font-semibold">{q.orderId}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium">{q.customerName}</div>
                        <div className="text-xs text-gray-500">{q.customerPhone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 hidden md:table-cell">{formatDate(q.date)}</td>
                      <td className="py-2.5 px-3 text-right font-bold" style={{ color: primary || '#F26522' }}>
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline">{q.status || 'Draft'}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="View / Edit" onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Open" onClick={() => navigate(`/quotations/${q.id}/edit`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Print" onClick={() => handlePrint(q)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Delete" onClick={() => handleDelete(q.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && filtered.length === 0 && (
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        </div>
      )}
    </div>
  );
};

export default Quotations;
