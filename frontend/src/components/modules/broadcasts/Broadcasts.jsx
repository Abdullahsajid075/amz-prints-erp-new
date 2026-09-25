import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { broadcastsAPI, customersAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { compressImageFile } from '@/utils/productImage';
import { openWhatsAppChat, openBlankWhatsAppTab, normalizeWhatsAppPhone } from '@/services/notifications/whatsappChannel';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { ImagePlus, Search, Send, Download, Copy, History, Users } from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png'];

function downloadDataUrl(dataUrl, filename) {
  if (!dataUrl) return false;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || 'advertisement.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

function dataUrlToBlob(dataUrl) {
  const raw = String(dataUrl || '');
  const comma = raw.indexOf(',');
  if (comma < 0) return null;
  const header = raw.slice(0, comma);
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const bin = atob(raw.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function copyImage(dataUrl) {
  if (!dataUrl || !navigator.clipboard?.write) return false;
  const blob = dataUrlToBlob(dataUrl) || await (await fetch(dataUrl)).blob();
  if (!blob) return false;
  const type = blob.type || 'image/png';
  await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
  return true;
}

const Broadcasts = () => {
  const { user } = useAuth();
  const me = getUserDisplayName(user);
  const [ads, setAds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [activeId, setActiveId] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [custSearch, setCustSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [onlyWhatsApp, setOnlyWhatsApp] = useState(true);
  const [sendingId, setSendingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const [adRes, custRes] = await Promise.all([
        broadcastsAPI.getAll(),
        customersAPI.getAll(),
      ]);
      setAds(Array.isArray(adRes.data) ? adRes.data : []);
      setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load broadcasts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cities = useMemo(() => {
    const set = new Set(customers.map((c) => String(c.city || '').trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [customers]);

  const visibleCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    return customers.filter((c) => {
      if (c.blocked) return false;
      if (String(c.id) === 'cust_walkin') return false;
      if (onlyWhatsApp && c.notifyWhatsApp === false) return false;
      if (cityFilter !== 'all' && String(c.city || '') !== cityFilter) return false;
      if (!q) return true;
      return [c.name, c.phone, c.city, c.customerCode].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [customers, custSearch, cityFilter, onlyWhatsApp]);

  const onImage = async (file) => {
    if (!file) return;
    if (!ALLOWED.includes(String(file.type || '').toLowerCase())) {
      toast.error('Only JPEG, JPG, or PNG images are allowed');
      return;
    }
    try {
      const dataUrl = await compressImageFile(file, { maxEdge: 1200, maxChars: 180000 });
      setImage(dataUrl);
      setImageName(file.name || 'advertisement.jpg');
    } catch (err) {
      toast.error(err.message || 'Could not read image');
    }
  };

  const persistDraft = async () => {
    const text = message.trim();
    if (!text) {
      toast.error('Write the advertisement text first');
      return null;
    }
    setSaving(true);
    try {
      if (activeId) {
        const res = await broadcastsAPI.update(activeId, { title, message: text, image });
        const saved = res.data || { id: activeId, title, message: text, image };
        setAds((prev) => prev.map((a) => (a.id === saved.id ? { ...a, ...saved } : a)));
        return saved;
      }
      const res = await broadcastsAPI.create({
        title: title.trim() || text.slice(0, 48),
        message: text,
        image,
        createdByName: me,
      });
      const saved = res.data;
      setActiveId(saved.id);
      setAds((prev) => [saved, ...prev]);
      return saved;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save advertisement');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openSend = async () => {
    const saved = await persistDraft();
    if (!saved) return;
    setSendOpen(true);
  };

  const reuse = (ad) => {
    setActiveId(ad.id);
    setTitle(ad.title || '');
    setMessage(ad.message || '');
    setImage(ad.image || '');
    setImageName(ad.image ? 'attached-image' : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success('Advertisement loaded — edit or send again');
  };

  const sendOne = async (customer) => {
    const phone = normalizeWhatsAppPhone(customer.phone);
    if (!phone) {
      toast.error(`${customer.name} has no WhatsApp number`);
      return;
    }
    const text = message.trim();
    if (!text) {
      toast.error('Advertisement text is empty');
      return;
    }
    setSendingId(customer.id);
    const pending = openBlankWhatsAppTab();

    let copied = false;
    if (image) {
      try {
        copied = await copyImage(image);
      } catch {
        copied = false;
      }
    }

    let cloud = null;
    try {
      if (activeId) {
        const res = await broadcastsAPI.sendWhatsApp(activeId, {
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
        });
        cloud = res.data || null;
      }
    } catch {
      cloud = null;
    }

    if (cloud && cloud.ok && cloud.imageSent) {
      if (pending && !pending.closed) {
        try { pending.close(); } catch { /* ignore */ }
      }
      toast.success(`Sent to ${customer.name} on WhatsApp, including the image.`);
      await load();
      setSendingId('');
      return;
    }

    const opened = openWhatsAppChat(customer.phone, text, {
      pendingWindow: pending,
      skipCopy: !!image,
    });
    if (!opened.ok) {
      toast.error(opened.reason === 'missing_phone' ? 'No WhatsApp number' : 'Could not open WhatsApp');
      setSendingId('');
      return;
    }

    if (image) {
      if (!copied) {
        try { copied = await copyImage(image); } catch { copied = false; }
      }
      if (!copied) downloadDataUrl(image, imageName || 'advertisement.jpg');
      toast.message(copied
        ? `WhatsApp opened for ${customer.name}. Paste the copied image, then tap Send.`
        : 'WhatsApp opened with the text. Image download started — attach it in the chat, then tap Send.');
    } else {
      toast.success(`WhatsApp opened for ${customer.name}`);
    }

    if (activeId && !(cloud && cloud.send)) {
      try {
        await broadcastsAPI.logSend(activeId, {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          status: copied ? 'opened_image_copied' : 'opened',
        });
      } catch { /* history is best-effort */ }
    }
    await load();
    setSendingId('');
  };

  return (
    <div className="erp-page space-y-4" data-testid="broadcasts-page">
      <PageHeader
        eyebrow="Sales"
        title="Customer Broadcast & Announcements"
        subtitle="Write an offer, attach a JPEG/PNG, preview, then send through WhatsApp."
        testId="broadcasts-header"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="erp-panel p-4 space-y-3" data-testid="ad-composer">
          <h3 className="font-display font-bold text-ink">1. Create advertisement</h3>
          <div>
            <Label>Internal title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ramadan banner offer" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste or write the promotional message customers will see on WhatsApp."
            />
          </div>
          <div>
            <Label>Image (JPEG / JPG / PNG)</Label>
            <label className="mt-1 flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm cursor-pointer hover:bg-slate-50">
              <ImagePlus className="h-4 w-4" />
              <span>{imageName || 'Upload image'}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={(e) => onImage(e.target.files?.[0])}
              />
            </label>
            {image ? (
              <Button type="button" size="sm" variant="ghost" className="mt-1" onClick={() => { setImage(''); setImageName(''); }}>
                Remove image
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={persistDraft} disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</Button>
            <Button onClick={openSend} disabled={saving} data-testid="ad-send-customers">
              <Users className="h-4 w-4 mr-1" /> Send to Customers
            </Button>
          </div>
        </section>

        <section className="erp-panel p-4 space-y-3" data-testid="ad-preview">
          <h3 className="font-display font-bold text-ink">Preview</h3>
          <div className="rounded-2xl border bg-white p-4 shadow-sm min-h-[220px]">
            {image ? (
              <img src={image} alt="Advertisement preview" className="w-full max-h-64 object-contain rounded-lg mb-3 bg-slate-50" />
            ) : (
              <div className="h-32 rounded-lg bg-slate-50 text-slate-400 text-sm flex items-center justify-center mb-3">No image attached</div>
            )}
            <p className="whitespace-pre-wrap text-sm text-ink">{message || 'Your message will appear here.'}</p>
          </div>
          <p className="text-xs text-slate-500">
            WhatsApp click-to-chat fills the text only. The image is downloaded / copied so you can attach it in the chat.
            If WhatsApp Business Cloud API keys are set on the server, image+text can send automatically.
          </p>
        </section>
      </div>

      <section className="erp-panel p-4" data-testid="ad-history">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4" />
          <h3 className="font-display font-bold text-ink">Advertisement history</h3>
        </div>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : !ads.length ? (
          <p className="text-slate-500 text-sm">No advertisements yet.</p>
        ) : (
          <div className="space-y-2">
            {ads.map((ad) => (
              <article key={ad.id} className="rounded-xl border p-3 flex flex-col sm:flex-row gap-3">
                {ad.image ? <img src={ad.image} alt="" className="w-16 h-16 object-cover rounded-md bg-slate-50" /> : <div className="w-16 h-16 rounded-md bg-slate-100" />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold truncate">{ad.title || 'Untitled'}</p>
                    <Badge variant="outline">{ad.sendCount || 0} sent / opened</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{ad.createdAt ? String(ad.createdAt).slice(0, 16).replace('T', ' ') : ''}{ad.createdByName ? ` · ${ad.createdByName}` : ''}</p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{ad.message}</p>
                  {ad.sends?.length ? (
                    <p className="text-xs text-slate-500 mt-1">
                      Last: {ad.sends.slice(0, 3).map((s) => `${s.customerName || s.customerPhone} (${s.status})`).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" onClick={() => reuse(ad)}>Reuse</Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send to customers</DialogTitle>
            <DialogDescription>Existing ERP customers. Each Send opens WhatsApp with this advertisement.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Search name or phone" value={custSearch} onChange={(e) => setCustSearch(e.target.value)} />
            </div>
            <select className="h-10 rounded-md border px-3 text-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyWhatsApp} onChange={(e) => setOnlyWhatsApp(e.target.checked)} />
              WhatsApp opted-in
            </label>
          </div>
          <div className="divide-y rounded-xl border max-h-[50vh] overflow-y-auto">
            {visibleCustomers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone || 'No number'}{c.city ? ` · ${c.city}` : ''}</p>
                </div>
                <Button size="sm" disabled={sendingId === c.id || !c.phone} onClick={() => sendOne(c)} data-testid="ad-send-one">
                  <Send className="h-4 w-4 mr-1" /> {sendingId === c.id ? '…' : 'Send'}
                </Button>
              </div>
            ))}
            {!visibleCustomers.length ? <p className="p-6 text-center text-sm text-slate-500">No customers match.</p> : null}
          </div>
          {image ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => downloadDataUrl(image, imageName || 'advertisement.jpg')}>
                <Download className="h-4 w-4 mr-1" /> Download image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={async () => {
                try {
                  await copyImage(image);
                  toast.success('Image copied');
                } catch {
                  toast.error('Could not copy image');
                }
              }}>
                <Copy className="h-4 w-4 mr-1" /> Copy image
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Broadcasts;
