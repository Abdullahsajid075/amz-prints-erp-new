import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { invoicesAPI } from '@/services/api';
import { notifyOrderEvent } from '@/services/notifications';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Printer, MessageCircle, Copy, Download, CheckCircle2, Edit, Bell } from 'lucide-react';
import { toast } from 'sonner';

const InvoiceView = ({ isPublic = false }) => {
  const navigate = useNavigate();
  const { invoiceId, shareToken } = useParams();
  const { brand, company, primary } = useBrand();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const template = brand?.invoice?.template || 'classic';
  const accent = primary || '#F26522';
  const showQR = brand?.invoice?.showQR !== false;
  const showStamp = brand?.invoice?.showStamp !== false;
  const showSignature = brand?.invoice?.showSignature !== false;
  const terms = brand?.invoice?.terms || 'Payment due within 30 days. All disputes subject to local jurisdiction.';

  const load = useCallback(async () => {
    try {
      const invRes = isPublic
        ? await invoicesAPI.getByToken(shareToken)
        : await invoicesAPI.getById(invoiceId);
      setInvoice(invRes.data);
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

  const pendingBalance = () =>
    Math.max(0, Number(invoice?.totalAmount || 0) + Number(invoice?.previousBalance || 0) - Number(invoice?.paidAmount || 0));

  const shareOnWhatsApp = async () => {
    const bal = pendingBalance();
    await notifyOrderEvent({
      event: 'invoice_generated',
      order: {
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        orderId: invoice.orderId,
        totalAmount: invoice.totalAmount,
        balanceAmount: bal,
      },
      invoice: { ...invoice, balanceAmount: bal, paidAmount: invoice.paidAmount || 0 },
      openWhatsApp: true,
    });
    toast.message('WhatsApp opened — invoice + pending payment');
  };

  const sendReminder = async () => {
    const bal = pendingBalance();
    if (!(bal > 0)) {
      toast.error('No pending balance');
      return;
    }
    if (!invoice.customerPhone) {
      toast.error('Customer phone missing');
      return;
    }
    await notifyOrderEvent({
      event: 'payment_reminder',
      order: {
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        orderId: invoice.orderId,
        totalAmount: invoice.totalAmount,
        balanceAmount: bal,
      },
      invoice: { ...invoice, balanceAmount: bal, paidAmount: invoice.paidAmount || 0 },
      openWhatsApp: true,
    });
    toast.success('Payment reminder opened on WhatsApp');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Invoice not found.</div>;
  }

  const verifyUrl = `${window.location.origin}/invoice/${invoice.shareToken}`;
  const balance = pendingBalance();

  const shellClass = {
    classic: 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border border-gray-200',
    modern: 'invoice-container max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border-0',
    minimal: 'invoice-container max-w-3xl mx-auto bg-white border border-gray-300',
    bold: 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border-4',
  }[template] || 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border border-gray-200';

  const headerPad = template === 'minimal' ? 'p-6' : 'p-8';
  const tableHeadBg = template === 'bold' ? accent : template === 'minimal' ? '#fff' : '#2E2E2E';
  const tableHeadColor = template === 'minimal' ? '#2E2E2E' : '#fff';
  const tableHeadClass = template === 'minimal' ? 'border-b-2 border-gray-800' : '';

  const LogoBlock = () => (
    company.logo ? (
      <img src={company.logo} alt="logo" className={template === 'bold' ? 'h-20 object-contain' : 'h-16 object-contain'} />
    ) : (
      <div
        className={`${template === 'modern' ? 'w-16 h-16 rounded-full' : template === 'bold' ? 'w-20 h-20 rounded-none' : 'w-20 h-20 rounded-2xl'} flex items-center justify-center shadow-lg`}
        style={{ backgroundColor: accent }}
      >
        <span className="text-white text-3xl font-bold">{(company.name || 'A').charAt(0)}</span>
      </div>
    )
  );

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
            {balance > 0 && (
              <Button variant="outline" onClick={sendReminder} className="text-amber-700 border-amber-300" data-testid="remind-invoice-button">
                <Bell className="h-4 w-4 mr-2" />
                Reminder
              </Button>
            )}
            <Button onClick={handlePrint} style={{ backgroundColor: accent }} className="text-white" data-testid="print-invoice-button">
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

      <div
        className={shellClass}
        id="printable-invoice"
        data-testid="invoice-template"
        data-template={template}
        style={template === 'bold' ? { borderColor: accent } : undefined}
      >
        {template !== 'minimal' && (
          <div className="h-2" style={{ background: template === 'modern' ? accent : `linear-gradient(90deg, ${accent} 0%, #FF8A50 50%, ${accent} 100%)` }} />
        )}

        <div className={`${headerPad} flex justify-between items-start ${template === 'minimal' ? 'border-b border-gray-300' : 'border-b-2 border-orange-100'}`}>
          <div className={`flex items-center gap-4 ${template === 'modern' ? 'flex-row-reverse' : ''}`}>
            <LogoBlock />
            <div className={template === 'modern' ? 'text-right' : ''}>
              <h1 className={`${template === 'bold' ? 'text-4xl uppercase tracking-tight' : 'text-3xl'} font-bold`} style={{ color: '#2E2E2E' }}>
                {company.name || 'AMZ Prints'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{company.tagline || 'Professional Printing & Advertising Services'}</p>
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                {company.address && <p>{company.address}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.email && <p>{company.email}</p>}
                {company.website && <p>{company.website}</p>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-block px-6 py-3 ${template === 'modern' ? 'rounded-full' : template === 'minimal' ? '' : 'rounded-lg'}`} style={template === 'minimal' ? undefined : { backgroundColor: accent }}>
              <p className={`text-xs uppercase tracking-wider ${template === 'minimal' ? 'text-gray-500' : 'text-white/80'}`}>Invoice</p>
              <p className={`text-2xl font-bold ${template === 'minimal' ? '' : 'text-white'}`} style={template === 'minimal' ? { color: accent } : undefined}>
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(invoice.date)}</span></p>
              {invoice.dueDate && (
                <p><span className="text-gray-500">Due:</span> <span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
              )}
              {invoice.orderId && (
                <p><span className="text-gray-500">Order:</span> <span className="font-semibold" style={{ color: accent }}>{invoice.orderId}</span></p>
              )}
            </div>
          </div>
        </div>

        <div className={`${headerPad} grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-200`}>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accent }}>Bill To</p>
            <p className="font-bold text-lg" style={{ color: '#2E2E2E' }}>{invoice.customerName}</p>
            {invoice.customerAddress && <p className="text-sm text-gray-600 mt-1">{invoice.customerAddress}</p>}
            {invoice.customerPhone && <p className="text-sm text-gray-600">{invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accent }}>Status</p>
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

        <div className={headerPad}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: tableHeadBg, color: tableHeadColor }} className={tableHeadClass}>
                <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold">#</th>
                <th className="text-left p-3 text-xs uppercase tracking-wider font-semibold">Description</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider font-semibold">Qty</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider font-semibold">Rate</th>
                <th className="text-right p-3 text-xs uppercase tracking-wider font-semibold">Amount</th>
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
                      {itemMeta && <p className="text-xs text-gray-500 mt-0.5">{itemMeta}</p>}
                    </td>
                    <td className="p-3 text-right text-sm">{item.quantity}</td>
                    <td className="p-3 text-right text-sm">{formatCurrency(item.rate)}</td>
                    <td className="p-3 text-right text-sm font-semibold">{formatCurrency(item.quantity * item.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={`px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6`}>
          <div className="space-y-4">
            {showQR && (
              <div className={`p-4 ${template === 'modern' ? 'rounded-2xl bg-gray-50' : 'rounded-lg border-2 border-dashed border-orange-200 bg-orange-50'}`}>
                <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accent }}>Scan to Verify</p>
                <div className="flex gap-3 items-start">
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <QRCodeSVG value={verifyUrl} size={90} level="M" fgColor="#2E2E2E" />
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-semibold mb-1" style={{ color: '#2E2E2E' }}>Verify Authenticity</p>
                    <p>Scan this QR code with any smartphone camera to view the digital copy of this invoice.</p>
                  </div>
                </div>
              </div>
            )}
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
            <div className={`flex justify-between py-3 px-3 ${template === 'modern' ? 'rounded-full' : 'rounded-lg'}`} style={{ backgroundColor: accent }}>
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
          <div className={`p-4 ${template === 'minimal' ? '' : 'bg-gray-50 rounded-lg border border-gray-200'}`}>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2 text-gray-700">Terms & Conditions</p>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{terms}</p>
          </div>
        </div>

        <div className="px-8 pb-8 grid grid-cols-2 gap-8">
          {showStamp && (
            <div className="text-center pt-8 border-t border-gray-200">
              <div className="relative h-24 mb-2 flex items-center justify-center">
                {company.stamp ? (
                  <img src={company.stamp} alt="Company stamp" className="h-24 object-contain opacity-90" />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-double flex items-center justify-center opacity-30 rotate-[-8deg]" style={{ borderColor: accent, color: accent }}>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase">{company.name || 'AMZ Prints'}</p>
                      <p className="text-xs uppercase">Official</p>
                      <p className="text-xs uppercase">Stamp</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Company Stamp</p>
            </div>
          )}
          {showSignature && (
            <div className={`text-center pt-8 border-t border-gray-200 ${!showStamp ? 'col-span-2' : ''}`}>
              <div className="h-24 flex items-end justify-center">
                {company.signature ? (
                  <img src={company.signature} alt="Authorized signature" className="max-h-20 object-contain" />
                ) : (
                  <div className="italic text-xl font-serif text-gray-700 pb-1 opacity-70" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                    {company.authorizedSignatory || 'Authorized Person'}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-400 pt-2 mt-2">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Authorized Signature</p>
                <p className="text-xs text-gray-500 mt-1">{company.authorizedSignatory || 'Authorized Person'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 text-center border-t border-gray-100 invoice-print-footer" style={{ backgroundColor: template === 'bold' ? accent : '#F5F7FB' }}>
          <p className={`text-xs ${template === 'bold' ? 'text-white' : 'text-gray-500'}`}>
            {company.name || 'AMZ Prints'}
            {company.phone ? ` · ${company.phone}` : ''}
            {company.website ? ` · ${company.website}` : ''}
            {' · '}Thank you for your business
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
