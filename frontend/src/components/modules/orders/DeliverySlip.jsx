import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ordersAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { barcodeBlock, openPrintWindow, printOnLoadScript, moneyPKR, documentFileName } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';

const DeliverySlip = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { company } = useBrand();
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

  const printBlackSlip = () => {
    if (!order) return;
    const companyName = company.name || 'Amazon Printing Services';
    const code = order.trackingNumber || order.orderId || order.id || 'AMZ';
    const items = (order.products || [])
      .map(
        (p, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${p.name || ''}${p.size || p.material ? `<div class="muted">${[p.size, p.material].filter(Boolean).join(' · ')}</div>` : ''}</td>
            <td class="r">${p.quantity || 0}</td>
          </tr>`
      )
      .join('');

    const printTitle = documentFileName({
      docType: 'Delivery',
      customerName: order.customerName,
      orderNumber: order.orderId,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${printTitle}</title>
  <style>
    @page { size: A5; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
    .sheet { border: 2px solid #000; padding: 14px; }
    .top { display: flex; justify-content: space-between; gap: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
    .brand h1 { margin: 0; font-size: 20px; letter-spacing: 0.02em; }
    .brand p { margin: 2px 0; font-size: 11px; }
    .meta { text-align: right; }
    .meta .label { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
    .meta .oid { font-size: 18px; font-weight: 800; margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px; }
    .box h3 { margin: 0 0 4px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .box p { margin: 2px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
    th, td { border: 1px solid #000; padding: 6px; font-size: 12px; }
    th { background: #000; color: #fff; text-align: left; }
    .r { text-align: right; }
    .muted { font-size: 10px; }
    .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; }
    .sign { text-align: center; border-top: 1px solid #000; padding-top: 6px; font-size: 11px; text-transform: uppercase; }
    .barcode-wrap { text-align: center; margin-top: 10px; }
    .foot { text-align: center; font-size: 10px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div class="brand">
        <h1>${companyName}</h1>
        <p>${company.address || 'King Road, Mandi Bahauddin'}</p>
        <p>${[company.phone, company.website || 'amzprints.com'].filter(Boolean).join(' · ')}</p>
      </div>
      <div class="meta">
        <div class="label">Delivery Slip</div>
        <div class="oid">${order.orderId || ''}</div>
        <div style="font-size:11px;margin-top:4px">Date: ${formatDate(order.date)}</div>
        <div style="font-size:11px">Delivery: ${formatDate(order.deliveryDate) || '—'}</div>
      </div>
    </div>
    <div class="grid">
      <div class="box">
        <h3>Deliver To</h3>
        <p><strong>${order.customerName || ''}</strong></p>
        <p>${(deliveryAddress || order.customerAddress || '—').replace(/\n/g, '<br/>')}</p>
        <p>${order.customerPhone || ''}</p>
      </div>
      <div class="box">
        <h3>Order Info</h3>
        <p>Status: <strong>${order.status || ''}</strong></p>
        <p>Tracking: <strong>${order.trackingNumber || '—'}</strong></p>
        <p>Total: <strong>Rs ${moneyPKR(order.totalAmount)}</strong></p>
        <p>Paid: <strong>Rs ${moneyPKR(order.advancePayment)}</strong></p>
        <p>Balance: <strong>Rs ${moneyPKR(order.balanceAmount)}</strong></p>
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item</th><th class="r">Qty</th></tr></thead>
      <tbody>${items || '<tr><td colspan="3">No items</td></tr>'}</tbody>
    </table>
    ${barcodeBlock(code, { height: 42 })}
    <div class="signs">
      <div class="sign">Received By</div>
      <div class="sign">Authorized</div>
    </div>
    <div class="foot">Amazon Printing Services · Professional Delivery Document</div>
  </div>
  ${printOnLoadScript(400)}
</body>
</html>`;

    const res = openPrintWindow(html, { width: 520, height: 720 });
    if (!res.ok) toast.error('Allow popups to print delivery slip');
  };

  if (loading) return <div className="py-16 text-center text-gray-500">Loading delivery slip...</div>;
  if (!order) return <div className="py-16 text-center text-gray-500">Order not found</div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto" data-testid="delivery-slip">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Orders
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={saveAddress}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save Address'}
          </Button>
          <Button className="bg-black text-white hover:bg-black/90" onClick={printBlackSlip}>
            <Printer className="h-4 w-4 mr-2" />Print Delivery Slip
          </Button>
        </div>
      </div>

      <div className="no-print mb-2">
        <Label>Delivery Address</Label>
        <Textarea rows={3} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
        <p className="text-xs text-gray-500 mt-1">Print opens a professional black delivery slip with barcode.</p>
      </div>

      <div className="bg-white border-2 border-black p-6">
        <div className="flex justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="text-xl font-black">{company.name || 'Amazon Printing Services'}</h1>
            <p className="text-xs">{company.address || 'King Road, Mandi Bahauddin'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase">Delivery Slip</p>
            <p className="text-lg font-black">{order.orderId}</p>
            <p className="text-xs">Total {formatCurrency(order.totalAmount)} · Paid {formatCurrency(order.advancePayment)}</p>
          </div>
        </div>
        <p className="text-sm"><strong>{order.customerName}</strong> · {order.customerPhone}</p>
        <p className="text-sm whitespace-pre-line mt-1">{deliveryAddress || order.customerAddress || '—'}</p>
        <p className="text-xs mt-3 text-gray-600">Preview — print for final black barcode slip.</p>
      </div>
    </div>
  );
};

export default DeliverySlip;
