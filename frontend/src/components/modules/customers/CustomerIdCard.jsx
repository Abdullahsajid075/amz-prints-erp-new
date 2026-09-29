import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import Barcode from '@/components/shared/Barcode';
import { customerPortalUrl } from '@/utils/customerDocuments';
import { customerDisplayCode } from '@/utils/customerHelpers';
import { formatCurrency } from '@/utils/helpers';
import { Printer, Download } from 'lucide-react';

/** Website-matching customer card — used in view/download only. */
export default function CustomerIdCard({
  customer,
  company,
  onPrint,
  onDownload,
}) {
  const due = Number(customer.outstanding) || 0;
  const code = customerDisplayCode(customer);
  const portal = customerPortalUrl(customer.id);
  const logo = company?.logo || '';
  const brand = company?.name || 'AMZ Prints';

  return (
    <article
      className="overflow-hidden rounded-[14px] bg-white"
      data-testid={`customer-card-${customer.id}`}
      style={{
        border: '1px solid rgba(24,32,43,0.10)',
        boxShadow: '0 16px 40px rgba(24,32,43,0.08)',
        background:
          'radial-gradient(420px 180px at 0% 0%, rgba(255,109,0,0.10), transparent 55%), radial-gradient(380px 160px at 100% 0%, rgba(7,71,163,0.08), transparent 50%), #fff',
      }}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 text-white"
        style={{ background: '#0747a3' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {logo ? (
            <img src={logo} alt="" className="h-9 max-w-[72px] object-contain bg-white rounded-md p-0.5" />
          ) : null}
          <div className="min-w-0">
            <p className="font-display font-bold text-[15px] leading-tight truncate">{brand}</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/80">Customer card</p>
          </div>
        </div>
        <p className="font-mono text-xs font-bold shrink-0" style={{ color: '#ff6d00' }}>{code}</p>
      </div>
      <div className="h-[3px]" style={{ backgroundColor: '#ff6d00' }} />

      <div className="p-4 grid grid-cols-[72px_1fr_88px] gap-3 items-center">
        <div className="w-[72px] h-[86px] rounded-[10px] overflow-hidden border bg-[#F4F6F9] flex items-center justify-center">
          {customer.photo ? (
            <img src={customer.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-2xl font-bold" style={{ color: '#0747a3' }}>
              {(customer.name || 'C').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#5B6B82] font-semibold">Name</p>
          <h3 className="font-display font-bold text-lg leading-tight truncate" style={{ color: '#0747a3' }}>{customer.name}</h3>
          <p className="text-[10px] uppercase tracking-wider text-[#5B6B82] font-semibold mt-2">Phone</p>
          <p className="text-sm font-semibold text-[#1C2430]">{customer.phone || '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#5B6B82] font-semibold mt-2">City</p>
          <p className="text-sm font-semibold text-[#1C2430] truncate">{customer.city || customer.address || '—'}</p>
        </div>
        <div className="flex flex-col items-center">
          <QRCodeCanvas value={portal} size={80} level="M" includeMargin={false} fgColor="#0747a3" bgColor="#ffffff" />
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: '#0747a3' }}>Portal QR</p>
        </div>
      </div>
      <div className="px-4 pb-2">
        <Barcode value={code} height={40} className="w-full" />
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between text-xs border-t" style={{ backgroundColor: '#F4F6F9', borderColor: 'rgba(24,32,43,0.08)' }}>
        <span className="text-[#5B6B82]">Balance due</span>
        <span className="font-display font-bold text-sm" style={{ color: due > 0 ? '#ff6d00' : '#0747a3' }}>{formatCurrency(due)}</span>
      </div>
      {(onPrint || onDownload) && (
        <div className="px-4 py-3 flex gap-2 justify-end">
          {onDownload ? (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />Download
            </Button>
          ) : null}
          {onPrint ? (
            <Button type="button" size="sm" className="text-white rounded-xl" style={{ backgroundColor: '#ff6d00' }} onClick={onPrint}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
