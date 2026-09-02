import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { invoicesAPI } from '@/services/api';
import { notifyOrderEvent } from '@/services/notifications';
import { formatCurrency, formatDate, invoiceOrderIds, invoiceLineItems } from '@/utils/helpers';
import { documentFileName, printWithDocumentTitle } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Printer, Copy, Download, CheckCircle2, Edit } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
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
      const data = invRes.data;
      if (!data || data.message || (!data.id && !data.invoiceNumber)) {
        setInvoice(null);
        return;
      }
      setInvoice(data);
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

  const handlePrint = () => {
    printWithDocumentTitle(
      documentFileName({
        docType: 'Invoice',
        customerName: invoice.customerName,
        orderNumber: invoice.orderId || invoice.invoiceNumber,
      })
    );
  };

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
  const items = invoiceLineItems(invoice);
  const linkedOrders = invoiceOrderIds(invoice);
  const itemCount = items.length;
  const fitOnePage = itemCount <= 10;

  const shellClass = {
    classic: 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border border-gray-200',
    modern: 'invoice-container max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border-0',
    minimal: 'invoice-container max-w-3xl mx-auto bg-white border border-gray-300',
    bold: 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border-4',
  }[template] || 'invoice-container max-w-4xl mx-auto bg-white shadow-xl border border-gray-200';
  const printFitClass = fitOnePage ? ' invoice-fit-one-page' : ' invoice-multi-page';

  const headerPad = template === 'minimal' ? 'p-6' : 'p-8';
  const tableHeadBg = template === 'bold' ? accent : template === 'minimal' ? '#fff' : '#2E2E2E';
  const tableHeadColor = template === 'minimal' ? '#2E2E2E' : '#fff';
  const tableHeadClass = template === 'minimal' ? 'border-b-2 border-gray-800' : '';

  const LogoBlock = () => (
    company?.logo ? (
      <img
        src={company.logo}
        alt="logo"
        className="inv-logo h-12 w-auto max-w-[120px] object-contain"
      />
    ) : (
      <div
        className={`inv-logo ${template === 'modern' ? 'w-11 h-11 rounded-full' : 'w-11 h-11 rounded-xl'} flex items-center justify-center shrink-0`}
        style={{ backgroundColor: accent }}
      >
        <span className="text-white text-lg font-bold">{(company.name || 'A').charAt(0)}</span>
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
              <WhatsAppIcon className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            {balance > 0 && (
              <Button variant="outline" onClick={sendReminder} className="text-amber-700 border-amber-300" data-testid="remind-invoice-button">
                <WhatsAppIcon className="h-4 w-4 mr-2" />
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
        className={`${shellClass}${printFitClass}`}
        id="printable-invoice"
        data-testid="invoice-template"
        data-template={template}
        data-item-count={itemCount}
        data-fit-one-page={fitOnePage ? '1' : '0'}
        style={template === 'bold' ? { borderColor: accent } : undefined}
      >
        {template !== 'minimal' && (
          <div className="h-1.5 inv-accent-bar" style={{ background: template === 'modern' ? accent : `linear-gradient(90deg, ${accent} 0%, #FF8A50 50%, ${accent} 100%)` }} />
        )}

        <div className={`${headerPad} inv-section flex justify-between items-start gap-4 ${template === 'minimal' ? 'border-b border-gray-300' : 'border-b border-orange-100'}`}>
          <div className={`flex items-center gap-3 min-w-0 ${template === 'modern' ? 'flex-row-reverse' : ''}`}>
            <LogoBlock />
            <div className={`min-w-0 ${template === 'modern' ? 'text-right' : ''}`}>
              <h1 className="inv-brand-name text-xl font-bold leading-tight truncate" style={{ color: '#2E2E2E' }}>
                {company.name || 'AMZ Prints'}
              </h1>
              <p className="inv-muted text-xs text-gray-600 mt-0.5">{company.tagline || 'Professional Printing & Advertising Services'}</p>
              <div className="inv-muted text-[11px] text-gray-500 mt-1.5 space-y-0.5 leading-snug">
                {company.address && <p>{company.address}</p>}
                {(company.phone || company.email) && (
                  <p>{[company.phone, company.email].filter(Boolean).join(' · ')}</p>
                )}
                {company.website && <p>{company.website}</p>}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className={`inline-block px-3 py-1.5 ${template === 'modern' ? 'rounded-full' : template === 'minimal' ? '' : 'rounded-md'}`}
              style={template === 'minimal' ? undefined : { backgroundColor: accent }}
            >
              <p className={`text-[10px] uppercase tracking-wider ${template === 'minimal' ? 'text-gray-500' : 'text-white/80'}`}>Invoice</p>
              <p className={`inv-doc-no text-base font-bold leading-tight ${template === 'minimal' ? '' : 'text-white'}`} style={template === 'minimal' ? { color: accent } : undefined}>
                {invoice.invoiceNumber}
              </p>
            </div>
            <div className="mt-2 space-y-0.5 text-xs">
              <p><span className="text-gray-500">Date:</span> <span className="font-semibold">{formatDate(invoice.date)}</span></p>
              {invoice.dueDate && (
                <p><span className="text-gray-500">Due:</span> <span className="font-semibold">{formatDate(invoice.dueDate)}</span></p>
              )}
              {linkedOrders.length > 0 && (
                <p><span className="text-gray-500">Order:</span> <span className="font-semibold" style={{ color: accent }}>{linkedOrders.join(', ')}</span></p>
              )}
            </div>
          </div>
        </div>

        <div className={`${headerPad} inv-section grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200`}>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: accent }}>Bill To</p>
            <p className="inv-customer font-bold text-base leading-snug" style={{ color: '#2E2E2E' }}>{invoice.customerName}</p>
            {invoice.customerAddress && <p className="text-xs text-gray-600 mt-0.5">{invoice.customerAddress}</p>}
            {invoice.customerPhone && <p className="text-xs text-gray-600">{invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-xs text-gray-600">{invoice.customerEmail}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: accent }}>Status</p>
            <Badge
              className={`text-xs px-2.5 py-0.5 ${
                invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}
            >
              {invoice.status}
            </Badge>
          </div>
        </div>

        <div className={headerPad + ' inv-section'}>
          <table className="w-full inv-table">
            <thead>
              <tr style={{ backgroundColor: tableHeadBg, color: tableHeadColor }} className={tableHeadClass}>
                <th className="text-left p-2 text-[10px] uppercase tracking-wider font-semibold">#</th>
                <th className="text-left p-2 text-[10px] uppercase tracking-wider font-semibold">Description</th>
                <th className="text-right p-2 text-[10px] uppercase tracking-wider font-semibold">Qty</th>
                <th className="text-right p-2 text-[10px] uppercase tracking-wider font-semibold">Rate</th>
                <th className="text-right p-2 text-[10px] uppercase tracking-wider font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const itemMeta = [item.size, item.material].filter(Boolean).join(' • ');
                const lineNote = String(item.description || item.notes || '').trim();
                return (
                  <tr key={item.id || `${item.name}-${item.quantity}-${item.rate}-${i}`} className="border-b border-gray-100">
                    <td className="p-2 text-xs text-gray-600">{i + 1}</td>
                    <td className="p-2">
                      <p className="font-semibold text-xs" style={{ color: '#2E2E2E' }}>{item.name}</p>
                      {itemMeta && <p className="text-[11px] text-gray-500 mt-0.5">{itemMeta}</p>}
                      {lineNote && (
                        <p className="text-[11px] text-gray-600 mt-0.5 whitespace-pre-line leading-snug">{lineNote}</p>
                      )}
                    </td>
                    <td className="p-2 text-right text-xs">{item.quantity}</td>
                    <td className="p-2 text-right text-xs">{formatCurrency(item.rate)}</td>
                    <td className="p-2 text-right text-xs font-semibold">{formatCurrency(item.quantity * item.rate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 inv-section grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {invoice.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-gray-700">Notes</p>
                <p className="text-xs text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-xs text-gray-600">Subtotal</span>
              <span className="text-xs font-semibold">{formatCurrency(invoice.subtotal || invoice.totalAmount)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-xs text-gray-600">Tax ({invoice.taxRate || 0}%)</span>
                <span className="text-xs font-semibold">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-xs text-gray-600">Discount</span>
                <span className="text-xs font-semibold text-red-600">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {(invoice.previousBalance || 0) !== 0 && (
              <div className="flex justify-between py-1.5 border-b border-gray-100 bg-yellow-50 px-2 rounded">
                <span className="text-xs font-medium text-yellow-800">Previous Balance</span>
                <span className="text-xs font-bold text-yellow-800">{formatCurrency(invoice.previousBalance)}</span>
              </div>
            )}
            <div className={`inv-total-row flex justify-between py-2 px-2.5 ${template === 'modern' ? 'rounded-full' : 'rounded-md'}`} style={{ backgroundColor: accent }}>
              <span className="text-sm font-bold text-white uppercase">Grand Total</span>
              <span className="inv-total text-lg font-bold text-white">{formatCurrency((invoice.totalAmount || 0) + (invoice.previousBalance || 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-xs text-gray-600">Paid Amount</span>
              <span className="text-xs font-semibold text-green-700">{formatCurrency(invoice.paidAmount || 0)}</span>
            </div>
            <div className="inv-balance-row flex justify-between py-2 border-t-2 border-gray-800 mt-1">
              <span className="text-sm font-bold" style={{ color: '#2E2E2E' }}>Balance Due</span>
              <span className="inv-total text-lg font-bold" style={{ color: balance > 0 ? '#EF4444' : '#10B981' }}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 pb-4 inv-section">
          <div className={`p-3 ${template === 'minimal' ? '' : 'bg-gray-50 rounded-md border border-gray-200'}`}>
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1 text-gray-700">Terms & Conditions</p>
            <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{terms}</p>
          </div>
        </div>

        <div className="px-8 pb-4 inv-section grid grid-cols-2 gap-6">
          {showStamp && (
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="relative h-16 mb-1 flex items-center justify-center">
                {company?.stamp ? (
                  <img src={company.stamp} alt="Company stamp" className="h-16 object-contain opacity-90" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-double flex items-center justify-center opacity-30 rotate-[-8deg]" style={{ borderColor: accent, color: accent }}>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase leading-tight">{company.name || 'AMZ Prints'}</p>
                      <p className="text-[8px] uppercase">Official Stamp</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Company Stamp</p>
            </div>
          )}
          {showSignature && (
            <div className={`text-center pt-4 border-t border-gray-200 ${!showStamp ? 'col-span-2' : ''}`}>
              <div className="h-16 flex items-end justify-center">
                {company?.signature ? (
                  <img src={company.signature} alt="Authorized signature" className="max-h-14 object-contain" />
                ) : (
                  <div className="italic text-base font-serif text-gray-700 pb-0.5 opacity-70" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                    {company.authorizedSignatory || 'Authorized Person'}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-400 pt-1.5 mt-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Authorized Signature</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{company.authorizedSignatory || 'Authorized Person'}</p>
              </div>
            </div>
          )}
        </div>

        {showQR && (
          <div className={`px-8 pb-5 inv-section inv-verify-block border-t ${template === 'minimal' ? 'border-gray-300' : 'border-orange-100'} pt-4 text-center`}>
            <p className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: accent }}>
              Invoice Verification
            </p>
            <div className="inline-flex flex-col items-center gap-2">
              <div className={`bg-white p-2.5 rounded-lg border-2 ${template === 'minimal' ? 'border-gray-300' : 'border-orange-200'}`}>
                <QRCodeSVG value={verifyUrl} size={108} level="M" fgColor="#2E2E2E" />
              </div>
              <p className="inv-verify-code text-xl font-extrabold tracking-[0.14em]" style={{ color: '#2E2E2E' }}>
                {invoice.shareToken}
              </p>
              <p className="text-xs text-gray-600 max-w-sm">
                Scan the QR code or use the verification code above to confirm this invoice online.
              </p>
            </div>
          </div>
        )}

        <div className="p-2.5 text-center border-t border-gray-100 invoice-print-footer" style={{ backgroundColor: template === 'bold' ? accent : '#F5F7FB' }}>
          <p className={`text-[10px] ${template === 'bold' ? 'text-white' : 'text-gray-500'}`}>
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
