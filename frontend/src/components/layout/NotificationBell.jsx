import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationCenter } from '@/context/NotificationCenter';

function kindIcon(kind) {
  if (kind === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (kind === 'error') return <XCircle className="h-4 w-4 text-rose-600" />;
  if (kind === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <Info className="h-4 w-4 text-sky-600" />;
}

function kindTone(kind) {
  if (kind === 'success') return 'bg-emerald-50 border-emerald-100';
  if (kind === 'error') return 'bg-rose-50 border-rose-100';
  if (kind === 'warning') return 'bg-amber-50 border-amber-100';
  return 'bg-sky-50 border-sky-100';
}

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return '';
  }
}

export default function NotificationBell() {
  const { items, unreadCount, open, setOpen, dismiss, markRead, markAllRead } = useNotificationCenter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl"
          data-testid="notification-bell"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center"
              data-testid="notification-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-2xl overflow-hidden" data-testid="notification-panel">
        <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <p className="text-[11px] text-slate-500">Dismissing a toast does not resolve the business issue.</p>
          </div>
          {items.length > 0 && (
            <button type="button" className="text-[11px] font-semibold text-slate-500 hover:text-ink" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`px-3 py-3 flex gap-2 ${n.read ? 'bg-white' : 'bg-orange-50/40'}`}
                  data-testid="notification-history-item"
                >
                  <div className={`mt-0.5 h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${kindTone(n.kind)}`}>
                    {kindIcon(n.kind)}
                  </div>
                  <div className="min-w-0 flex-1" onClick={() => markRead(n.id)}>
                    <p className="text-sm text-ink leading-snug">{n.message}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">
                      {n.kind} · {formatWhen(n.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="h-7 w-7 rounded-md text-slate-400 hover:text-ink hover:bg-slate-100 flex items-center justify-center shrink-0"
                    title="Remove from history"
                    aria-label="Dismiss notification"
                    data-testid={`dismiss-notification-${n.id}`}
                    onClick={() => dismiss(n.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
