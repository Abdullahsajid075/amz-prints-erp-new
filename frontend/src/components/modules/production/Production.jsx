import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ordersAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Factory, User, Calendar, Eye, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'sonner';

const STAGES = [
  { key: 'Order Received', label: 'Received', color: '#3B82F6' },
  { key: 'Designing', label: 'Designing', color: '#8B5CF6' },
  { key: 'Proof Approval', label: 'Proof Approval', color: '#F59E0B' },
  { key: 'Printing', label: 'Printing', color: '#F26522' },
  { key: 'Finishing', label: 'Finishing', color: '#EC4899' },
  { key: 'Packing', label: 'Packing', color: '#06B6D4' },
  { key: 'Ready', label: 'Ready', color: '#10B981' }
];

const Production = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      setOrders(res.data || []);
    } catch (err) { console.error(err); toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s.key] = orders.filter(o => o.status === s.key); });
    return map;
  }, [orders]);

  const totalInProduction = STAGES.reduce((s, st) => s + (byStage[st.key]?.length || 0), 0);
  const overdue = orders.filter(o => {
    if (!o.deliveryDate) return false;
    return new Date(o.deliveryDate) < new Date() && !['Delivered', 'Cancelled'].includes(o.status);
  }).length;

  const moveOrder = async (order, newStatus) => {
    try {
      await ordersAPI.update(order.id, { ...order, status: newStatus });
      toast.success(`${order.orderId} → ${newStatus}`);
      fetchOrders();
    } catch (err) { console.error(err); toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-6" data-testid="production-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Production</h1>
          <p className="text-gray-600 mt-1">Kanban view — drag orders through production stages</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F26522' }}><Factory className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">In Production</p><p className="text-lg font-bold">{totalInProduction}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}><Clock className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Ready</p><p className="text-lg font-bold text-emerald-700">{byStage['Ready']?.length || 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}><Calendar className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Overdue</p><p className="text-lg font-bold text-rose-600">{overdue}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><User className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Orders</p><p className="text-lg font-bold">{orders.length}</p></div>
        </CardContent></Card>
      </div>

      {loading ? <div className="text-center py-8 text-gray-500">Loading production board...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STAGES.map(stage => (
            <Card key={stage.key} className="flex flex-col" data-testid={`stage-${stage.key}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.label}
                  </span>
                  <Badge variant="outline" className="text-xs">{byStage[stage.key]?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[80px]">
                {(byStage[stage.key] || []).length === 0 ? (
                  <p className="text-center py-4 text-gray-400 text-xs">No orders</p>
                ) : (
                  byStage[stage.key].map(o => {
                    const idx = STAGES.findIndex(s => s.key === stage.key);
                    const next = STAGES[idx + 1];
                    return (
                      <div key={o.id} className="p-3 rounded-lg border border-gray-100 bg-white hover:shadow-sm transition-all" data-testid={`prod-order-${o.id}`}>
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="font-bold text-sm" style={{ color: '#1F2937' }}>{o.orderId}</p>
                          <Badge className="text-[9px] px-1.5" style={{ backgroundColor: stage.color + '20', color: stage.color, border: 'none' }}>{stage.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{o.customerName}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Due {formatDate(o.deliveryDate)}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#F26522' }}>{formatCurrency(o.totalAmount)}</p>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs flex-1" onClick={() => navigate(`/orders/${o.id}/edit`)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          {next && (
                            <Button size="sm" className="h-7 px-2 text-xs text-white" style={{ backgroundColor: '#F26522' }} onClick={() => moveOrder(o, next.key)} data-testid={`move-${o.id}-${next.key}`}>
                              {next.label}<ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Production;
