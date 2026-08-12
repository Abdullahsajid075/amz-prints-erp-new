import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { quotationsAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { openWhatsAppChat } from '@/services/notifications';
import { useBrand } from '@/context/BrandContext';
import { Plus, Search, Eye, Edit, Trash2, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

const QUOTATION_SORT_OPTS = [
  { value: 'date', label: 'Date' },
  { value: 'orderId', label: 'Quote #' },
  { value: 'customerName', label: 'Customer' },
  { value: 'totalAmount', label: 'Amount' },
  { value: 'status', label: 'Status' },
];

const Quotations = () => {
  const navigate = useNavigate();
  const { primary, company } = useBrand();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });

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

  const sorted = useMemo(() => sortBy(filtered, sort, {
    date: (q) => q.date || '',
    orderId: (q) => q.orderId || q.quotationId || '',
    quotationId: (q) => q.orderId || q.quotationId || '',
    customerName: (q) => q.customerName || '',
    totalAmount: (q) => Number(q.totalAmount || 0),
    status: (q) => q.status || '',
  }), [filtered, sort]);

  const sendFollowUp = async (q) => {
    try {
      const status = String(q?.status || '').trim().toLowerCase();
      if (status === 'accepted' || status.includes('accept') || status.includes('converted')) {
        toast.message('Quotation already accepted — follow-up not needed');
        return;
      }
      const full = q.customerPhone ? q : (await quotationsAPI.getById(q.id)).data;
      const phone = full?.customerPhone || '';
      if (!phone) {
        toast.error('Customer phone missing — add phone to follow up');
        return;
      }
      const name = full.customerName || 'Customer';
      const quoteNo = full.orderId || full.quotationId || full.id || '';
      const amount = formatCurrency(full.totalAmount || 0);
      const companyName = company?.name || 'Amazon Printing Services';
      const msg = (
        `Dear ${name},\n\n`
        + `*Soft follow-up — Quotation*\n\n`
        + `Just checking in regarding quotation *${quoteNo}*`
        + (Number(full.totalAmount) > 0 ? ` (Total: ${amount})` : '')
        + `.\n\n`
        + `Please let us know if you would like to proceed, need any changes, or have questions.\n\n`
        + `We are ready to start as soon as you confirm.\n\n`
        + `Thank you.\n${companyName}`
      );
      const result = openWhatsAppChat(phone, msg);
      if (!result.ok) toast.error('Could not open WhatsApp');
      else toast.message('Follow-up opened — tap Send');
    } catch (err) {
      console.error(err);
      toast.error('Failed to open follow-up');
    }
  };

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
          <p className="text-gray-600 mt-1">Create quotes, follow up, convert to orders, print</p>
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
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by ID, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="quotation-search"
              />
            </div>
            <SortBar value={sort} onChange={setSort} options={QUOTATION_SORT_OPTS} className="w-full sm:w-auto sm:min-w-[280px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-gray-500">Loading...</p>
          ) : sorted.length === 0 ? (
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
                  {sorted.map((q) => (
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
                          {!(['accepted'].includes(String(q.status || '').trim().toLowerCase())
                            || /accept|converted/i.test(String(q.status || ''))) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                              title="Follow up on WhatsApp"
                              data-testid={`quotation-followup-${q.id}`}
                              onClick={() => sendFollowUp(q)}
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Follow up</span>
                            </Button>
                          )}
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

      {!loading && sorted.length === 0 && (
        <div className="text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        </div>
      )}
    </div>
  );
};

export default Quotations;
