import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Barcode from '@/components/shared/Barcode';
import { customerPortalUrl } from '@/utils/customerDocuments';
import { customerDisplayCode, isCustomerBlocked } from '@/utils/customerHelpers';
import { formatCurrency } from '@/utils/helpers';
import {
  Phone, Mail, MapPin, BookOpen, IdCard, Camera, QrCode,
  ShieldBan, ShieldCheck, Wallet, Edit, Trash2,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';

export default function CustomerIdCard({
  customer,
  canUnblock,
  imageBusy,
  balanceSending,
  onPhoto,
  onLedger,
  onPrint,
  onQr,
  onBalanceWa,
  onPay,
  onBlock,
  onUnblock,
  onEdit,
  onDelete,
}) {
  const blocked = isCustomerBlocked(customer);
  const due = Number(customer.outstanding) || 0;
  const code = customerDisplayCode(customer);
  const portal = customerPortalUrl(customer.id);

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-shadow"
      style={{ borderColor: blocked ? '#fecaca' : '#e2e8f0' }}
      data-testid={`customer-card-${customer.id}`}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2 text-white"
        style={{ background: blocked
          ? 'linear-gradient(115deg, #7f1d1d 0%, #b91c1c 70%)'
          : 'linear-gradient(115deg, #05357c 0%, #0747a3 58%, #ff6d00 160%)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-90">AMZ Member Card</p>
        <p className="font-mono text-[11px] font-bold">{code}</p>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="relative w-16 h-[4.6rem] rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-md"
            style={{ backgroundColor: blocked ? '#FEE2E2' : '#FFF4EB' }}
            title="Upload customer photo"
            onClick={onPhoto}
          >
            {customer.photo ? (
              <img src={customer.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-xl font-black" style={{ color: '#0747a3' }}>
                {(customer.name || 'C').charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-bold text-base truncate" style={{ color: '#0f172a' }}>{customer.name}</h3>
              {blocked && <Badge className="bg-red-100 text-red-800 text-[10px]">Blocked</Badge>}
            </div>
            {customer.phone ? (
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 truncate">
                <Phone className="h-3 w-3 shrink-0" />{customer.phone}
              </p>
            ) : null}
            {customer.email ? (
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />{customer.email}
              </p>
            ) : null}
            {(customer.city || customer.address) ? (
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{[customer.city, customer.address].filter(Boolean).join(' · ')}</span>
              </p>
            ) : null}
          </div>
          <div className="shrink-0 bg-white rounded-lg p-1 border border-slate-100">
            <QRCodeCanvas
              value={portal}
              size={72}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0747a3"
            />
            <p className="text-[8px] font-bold text-center text-slate-500 tracking-wide mt-0.5">QR</p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-1.5 flex justify-center">
          <Barcode value={code} height={36} className="max-w-full" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Balance</p>
            <p className={`text-sm font-black ${due > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCurrency(due)}</p>
          </div>
          {Number(customer.creditBalance) > 0 && (
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Advance</p>
              <p className="text-sm font-bold text-sky-700">{formatCurrency(customer.creditBalance)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 justify-end flex-wrap border-t border-slate-100 pt-2">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={onLedger} title="Ledger" data-testid={`ledger-${customer.id}`}>
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onPrint} title="Print customer card">
            <IdCard className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={imageBusy} title="Upload photo" onClick={onPhoto}>
            <Camera className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onQr} title="Customer QR">
            <QrCode className="h-4 w-4" />
          </Button>
          {due > 0 && customer.phone ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-700"
              disabled={balanceSending}
              onClick={onBalanceWa}
              title="Balance due — WhatsApp"
              data-testid={`balance-wa-${customer.id}`}
            >
              <WhatsAppIcon className="h-4 w-4" />
            </Button>
          ) : null}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-700" onClick={onPay} title="Record payment" data-testid={`pay-customer-${customer.id}`}>
            <Wallet className="h-4 w-4" />
          </Button>
          {blocked ? (
            canUnblock && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-700" onClick={onUnblock} title="Unblock" data-testid={`unblock-${customer.id}`}>
                <ShieldCheck className="h-4 w-4" />
              </Button>
            )
          ) : (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-700" onClick={onBlock} title="Block" data-testid={`block-${customer.id}`}>
              <ShieldBan className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Edit" data-testid={`edit-customer-${customer.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete} title="Delete" data-testid={`delete-customer-${customer.id}`}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </article>
  );
}
