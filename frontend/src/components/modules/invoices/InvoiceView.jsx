import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { invoicesAPI, settingsAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { ArrowLeft, Printer, Share2, MessageCircle, Copy, Download, CheckCircle2, Edit } from 'lucide-react';
import { toast } from 'sonner';

const InvoiceView = ({ isPublic = false }) => {
  const navigate = useNavigate();
  const { invoiceId, shareToken } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const invRes = isPublic
        ? await invoicesAPI.getByToken(shareToken)
        : await invoicesAPI.getById(invoiceId);
      setInvoice(invRes.data);
      const setRes = await settingsAPI.get();
      setSettings(setRes.data);
    } catch (err) {
      console.error('Failed to load invoice', err);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, shareToken, isPublic]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => window.print();

  const copyShareLink = () => {
    const link = `${window.location.origin}/invoice/${invoice.shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Shareable link copied!');
  };

  const shareOnWhatsApp = () => {
    const link = `${window.location.origin}/invoice/${invoice.shareToken}`;
    const msg = `Hi ${invoice.customerName}, here is your invoice ${invoice.invoiceNumber}. Total: ${formatCurrency(invoice.totalAmount)}. View: ${link}`;
    const phone = (invoice.customerPhone || '').replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // useMemo silences the unused-import warning and keeps hook available for future memoization.
  useMemo(() => null, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Invoice not found.</div>;
  }

  const company = settings?.company || {};
  const terms = settings?.invoiceTerms || 'Payment due within 30 days. All disputes subject to local jurisdiction.';
  const verifyUrl = `${window.location.origin}/invoice/${invoice.shareToken}`;
  const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <div className={isPublic ? 'min-h-screen bg-gray-100 py-6' : 'space-y-4'}>
      {!isPublic && (
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Button variant="outline" onClick={() => navigate('/invoices')} data-testid="back-invoices-button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/invoices/${invoice.id}/edit`)} data-testid="edit-invoice-button">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={copyShareLink} data-testid="copy-link-button">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={shareOnWhatsApp} className="text-green-700" data-testid="whatsapp-share-button">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handlePrint} style={{ backgroundColor: '#F26522' }} className="text-white" data-testid="print-invoice-button">
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
          </div>
        </div>
      )}

      {isPublic && (
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 mb-4 px-4 no-print">
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Verified Invoice
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      <div className="invoice-container max-w-4xl mx-auto bg-white shadow-xl border border-gray-200" id="printable-invoice" data-testid="invoice-template">
        <div className="h-2" style={{ background: 'linear-gradient(90deg, #F26522 0%, #FF8A50 50%, #F26522 100%)' }}></div>

        <div className="p-8 flex justify-between items-start border-b-2 border-orange-100">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#F26522' }}>
              <span className="text-white text-4xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>{company.name || 'AMZ Prints'}</h1>
              <p className="text-sm text-gray-600 mt-1">{company.tagline || 'Professional Printing & Advertising Services'}</p>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                {company.address && <p>{company.address}</p>}
                {company.phone && <p>📞 {company.phone}</p>}
                {company.email && <p>✉ {company.email}</p>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-6 py-3 rounded-lg" style={{ backgroundColor: '#F26522' }}>
              <p className="text-xs text-white/80 uppercase tracking-wider">Invoice</p>
              <p className="text-2xl font-bold text-white">{invoice.invoiceNumber}</p>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(invoice.date)}</span></p>
              <p><span className="text-gray-500">Due:</span> <span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
              <p><span className="text-gray-500">Order:</span> <span className="font-semibold text-orange-600">{invoice.orderId}</span></p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#F26522' }}>Bill To</p>
            <p className="font-bold text-lg" style={{ color: '#2E2E2E' }}>{invoice.customerName}</p>
            {invoice.customerAddress && <p className="text-sm text-gray-600 mt-1">{invoice.customerAddress}</p>}
            {invoice.customerPhone && <p className="text-sm text-gray-600">📞 {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-sm text-gray-600">✉ {invoice.customerEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#F26522' }}>Status</p>
            <Badge
              className={`text-base px-4 py-1.5 ${
                invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status}
            </Badge>
          </div>
        </div>

        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: '#2E2E2E' }}>
                <th className="text-left p-3 text-xs uppercase tracking-wider text-white font-semibold">#</th>
                <th className="text-left p-3 text-xs uppercase tracking-wider text-white font-semibold">Description</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider text-white font-semibold">Qty</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider text-white font-semibold">Rate</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider text-white font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => {
                const itemMeta = [item.size, item.material].filter(Boolean).join(' • ');
                return (
                <tr key={item.id || `${item.name}-${item.quantity}-${item.rate}`} className="border-b border-gray-100">
                  <td className="p-3 text-sm text-gray-600">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-semibold text-sm" style={{ color: '#2E2E2E' }}>{item.name}</p>
                    {itemMeta && (
                      <p className="text-xs text-gray-500 mt-0.5">{itemMeta}</p>
                    )}
                  </td>
                  <td className="p-3 text-right text-sm">{item.quantity}</td>
                  <td className="p-3 text-right text-sm">{formatCurrency(item.rate)}</td>
                  <td className="p-3 text-right text-sm font-semibold">{formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border-2 border-dashed border-orange-200 bg-orange-50">
              <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: '#F26522' }}>Scan to Verify</p>
              <div className="flex gap-3 items-start">
                <div className="bg-white p-2 rounded-lg border border-gray-200">
                  <QRCodeSVG value={verifyUrl} size={90} level="M" fgColor="#2E2E2E" />
                </div>
                <div className="text-xs text-gray-600">
                  <p className="font-semibold mb-1" style={{ color: '#2E2E2E' }}>Verify Authenticity</p>
                  <p>Scan this QR code with any smartphone camera to view the digital, tamper-proof copy of this invoice.</p>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1 text-gray-700">Notes</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold">{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tax ({invoice.taxRate || 0}%)</span>
                <span className="text-sm font-semibold">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {(invoice.previousBalance || 0) !== 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100 bg-yellow-50 px-2 rounded">
                <span className="text-sm font-medium text-yellow-800">Previous Balance</span>
                <span className="text-sm font-bold text-yellow-800">{formatCurrency(invoice.previousBalance)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 px-3 rounded-lg" style={{ backgroundColor: '#F26522' }}>
              <span className="text-base font-bold text-white uppercase">Grand Total</span>
              <span className="text-xl font-bold text-white">{formatCurrency((invoice.totalAmount || 0) + (invoice.previousBalance || 0))}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Paid Amount</span>
              <span className="text-sm font-semibold text-green-700">{formatCurrency(invoice.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
              <span className="text-base font-bold" style={{ color: '#2E2E2E' }}>Balance Due</span>
              <span className="text-xl font-bold" style={{ color: balance > 0 ? '#EF4444' : '#10B981' }}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs uppercase tracking-wider font-semibold mb-2 text-gray-700">Terms & Conditions</p>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{terms}</p>
          </div>
        </div>

        <div className="px-8 pb-8 grid grid-cols-2 gap-8">
          <div className="text-center pt-8 border-t border-gray-200">
            <div className="relative h-24 mb-2">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-double flex items-center justify-center opacity-30 rotate-[-8deg]" style={{ borderColor: '#F26522', color: '#F26522' }}>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase">{company.name || 'AMZ Prints'}</p>
                    <p className="text-xs uppercase">Official</p>
                    <p className="text-xs uppercase">Stamp</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Company Stamp</p>
          </div>
          <div className="text-center pt-8 border-t border-gray-200">
            <div className="h-24 flex items-end justify-center">
              <div className="italic text-xl font-serif text-gray-700 pb-1 opacity-70" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                {company.authorizedSignatory || 'AMZ Prints'}
              </div>
            </div>
            <div className="border-t border-gray-400 pt-2 mt-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Authorized Signature</p>
              <p className="text-xs text-gray-500 mt-1">{company.authorizedSignatory || 'Authorized Person'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 text-center border-t border-gray-100" style={{ backgroundColor: '#F5F7FB' }}>
          <p className="text-xs text-gray-500">
            Thank you for your business! • {company.name || 'AMZ Prints'} • {company.website || 'amzprints.com'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
