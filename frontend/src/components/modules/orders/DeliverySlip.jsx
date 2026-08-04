import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ordersAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';

const DeliverySlip = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const [order, setOrder] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getById(orderId);
      const o = res.data;
      setOrder(o);
      setDeliveryAddress(o.deliveryAddress || o.customerAddress || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAddress = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await ordersAPI.update(order.id, { ...order, deliveryAddress });
      toast.success('Delivery address saved');
      setOrder({ ...order, deliveryAddress });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-500">Loading delivery slip...</div>;
  if (!order) return <div className="py-16 text-center text-gray-500">Order not found</div>;

  return (
    <div className="space-y-4" data-testid="delivery-slip">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Orders
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={saveAddress}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save Address'}
          </Button>
          <Button className="text-white" style={{ backgroundColor: primary || '#F26522' }} onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />Print Slip
          </Button>
        </div>
      </div>

      <div className="no-print max-w-3xl mx-auto mb-4">
        <Label>Delivery Address</Label>
        <Textarea rows={3} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
      </div>

      <div className="max-w-3xl mx-auto bg-white border shadow-sm print:shadow-none print:border-0" id="printable-delivery-slip">
        <div className="h-2" style={{ backgroundColor: primary || '#F26522' }} />
        <div className="p-8">
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="flex items-start gap-3">
              {company.logo ? (
                <img src={company.logo} alt="logo" className="h-14 w-14 object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: primary || '#F26522' }}>
                  {(company.name || 'A').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{company.name || 'AMZ Prints'}</h1>
                <p className="text-sm text-gray-600">{company.tagline}</p>
                <p className="text-xs text-gray-500 mt-1">{[company.address, company.phone, company.email].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: primary || '#F26522' }}>Delivery Slip</p>
              <p className="text-xl font-bold">{order.orderId}</p>
              <p className="text-sm text-gray-600">Date: {formatDate(order.date)}</p>
              <p className="text-sm text-gray-600">Delivery: {formatDate(order.deliveryDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase font-semibold mb-1" style={{ color: primary || '#F26522' }}>Deliver To</p>
              <p className="font-bold text-lg">{order.customerName}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{deliveryAddress || order.customerAddress || '—'}</p>
              {order.customerPhone && <p className="text-sm text-gray-600 mt-1">📞 {order.customerPhone}</p>}
            </div>
            <div>
              <p className="text-xs uppercase font-semibold mb-1" style={{ color: primary || '#F26522' }}>Order Info</p>
              <p className="text-sm">Status: <strong>{order.status}</strong></p>
              <p className="text-sm">Tracking: {order.trackingNumber || '—'}</p>
              <p className="text-sm">Total: <strong style={{ color: primary || '#F26522' }}>{formatCurrency(order.totalAmount)}</strong></p>
            </div>
          </div>

          <table className="w-full text-sm mb-8">
            <thead>
              <tr style={{ backgroundColor: '#2E2E2E', color: '#fff' }}>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {(order.products || []).map((p, i) => (
                <tr key={p.id || `${p.name}-${i}`} className="border-b">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">
                    {p.name}
                    {(p.size || p.material) && (
                      <span className="text-xs text-gray-500 block">{[p.size, p.material].filter(Boolean).join(' · ')}</span>
                    )}
                  </td>
                  <td className="p-2 text-right font-semibold">{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t">
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-gray-400 pt-2 text-xs uppercase text-gray-500">Received By</div>
            </div>
            <div className="text-center">
              <div className="h-16 flex items-end justify-center opacity-70">
                {company.stamp ? (
                  <img src={company.stamp} alt="stamp" className="h-16 object-contain" />
                ) : (
                  <span className="text-sm italic">{company.authorizedSignatory || company.name}</span>
                )}
              </div>
              <div className="border-t border-gray-400 pt-2 text-xs uppercase text-gray-500">Authorized</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySlip;
