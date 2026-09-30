import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cvsAPI } from '@/services/api';
import { formatDate } from '@/utils/helpers';
import { FileText, Search, Trash2, Printer, Mail, Phone, MapPin, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const cvMatches = (cv, q) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return [cv.fullName, cv.headline, cv.email, cv.phone, cv.cvId, cv.city]
    .some((v) => String(v || '').toLowerCase().includes(s));
};

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function buildCvHtml(cv) {
  const accent = cv.accentColor || '#F26522';
  const section = (title, inner) => (inner ? `<section class="cv-sec"><h2>${escapeHtml(title)}</h2>${inner}</section>` : '');
  const exp = (cv.experience || []).map((e) => `
    <div class="cv-item">
      <div class="cv-item__head"><strong>${escapeHtml(e.role || '')}</strong><span>${escapeHtml(e.period || '')}</span></div>
      <div class="cv-item__sub">${escapeHtml(e.company || '')}</div>
      ${e.details ? `<p>${escapeHtml(e.details)}</p>` : ''}
    </div>`).join('');
  const edu = (cv.education || []).map((e) => `
    <div class="cv-item">
      <div class="cv-item__head"><strong>${escapeHtml(e.degree || '')}</strong><span>${escapeHtml(e.year || '')}</span></div>
      <div class="cv-item__sub">${escapeHtml(e.school || '')}</div>
    </div>`).join('');
  const skills = (cv.skills || []).length
    ? `<div class="cv-tags">${cv.skills.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</div>` : '';
  const langs = (cv.languages || []).length
    ? `<div class="cv-tags">${cv.languages.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</div>` : '';
  const photo = cv.photo ? `<img class="cv-photo" src="${cv.photo}" alt="photo">` : '';
  const contact = [cv.email, cv.phone, cv.city].filter(Boolean).map((v) => `<span>${escapeHtml(v)}</span>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(cv.fullName || 'CV')}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;margin:0;background:#fff}
    .cv{max-width:800px;margin:0 auto;padding:40px}
    .cv-head{display:flex;gap:20px;align-items:center;border-bottom:4px solid ${accent};padding-bottom:16px;margin-bottom:8px}
    .cv-photo{width:96px;height:96px;border-radius:12px;object-fit:cover;border:3px solid ${accent}}
    .cv-head h1{margin:0;font-size:28px}
    .cv-head .cv-role{color:${accent};font-weight:700;margin:4px 0}
    .cv-contact{display:flex;flex-wrap:wrap;gap:14px;color:#555;font-size:13px;margin-top:6px}
    .cv-sec{margin-top:20px}
    .cv-sec h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${accent};border-bottom:1px solid #eee;padding-bottom:6px;margin:0 0 10px}
    .cv-item{margin-bottom:12px}
    .cv-item__head{display:flex;justify-content:space-between;gap:10px}
    .cv-item__head span{color:#777;font-size:13px}
    .cv-item__sub{color:#555;font-size:14px}
    .cv-item p{margin:4px 0 0;font-size:14px;color:#333}
    .cv-tags{display:flex;flex-wrap:wrap;gap:8px}
    .cv-tags span{background:${accent}1a;color:${accent};padding:5px 12px;border-radius:999px;font-size:13px;font-weight:600}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.cv{padding:20px}}
  </style></head>
  <body><div class="cv">
    <div class="cv-head">${photo}<div>
      <h1>${escapeHtml(cv.fullName || '')}</h1>
      <div class="cv-role">${escapeHtml(cv.headline || '')}</div>
      <div class="cv-contact">${contact}</div>
    </div></div>
    ${cv.summary ? `<section class="cv-sec"><h2>Profile</h2><p>${escapeHtml(cv.summary)}</p></section>` : ''}
    ${section('Experience', exp)}
    ${section('Education', edu)}
    ${section('Skills', skills)}
    ${section('Languages', langs)}
  </div></body></html>`;
}

const CVs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchCvs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cvsAPI.getAll();
      setCvs(res.data || []);
    } catch (err) { console.error(err); toast.error('Failed to load CVs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCvs(); }, [fetchCvs]);

  const filtered = useMemo(() => cvs.filter((c) => cvMatches(c, search)), [cvs, search]);

  const handlePrint = (cv) => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Popup blocked — allow popups to print/download'); return; }
    w.document.write(buildCvHtml(cv));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const handleDelete = async (cv) => {
    if (!window.confirm(`Delete CV ${cv.cvId || cv.fullName}?`)) return;
    try {
      await cvsAPI.delete(cv.id);
      toast.success('CV deleted');
      setSelected(null);
      fetchCvs();
    } catch (err) { console.error(err); toast.error('Failed to delete CV'); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4" data-testid="cvs-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#2E2E2E' }}>
            <FileText className="h-6 w-6" style={{ color: '#F26522' }} /> Free CV Submissions
          </h1>
          <p className="text-sm text-gray-500">CVs created by visitors on the website Free CV builder.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search name, email, CV ID…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="cv-search" />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">
          <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          No CV submissions yet.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cv) => (
            <Card key={cv.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(cv)} data-testid="cv-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {cv.photo
                    ? <img src={cv.photo} alt={cv.fullName} className="h-14 w-14 rounded-lg object-cover border" />
                    : <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><User className="h-6 w-6" /></div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{cv.fullName || 'Unnamed'}</h3>
                      <Badge variant="secondary" className="text-[10px]">{cv.cvId}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{cv.headline || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  {cv.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" /> {cv.email}</div>}
                  {cv.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {cv.phone}</div>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{formatDate(cv.createdAt)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> {cv.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.fullName} <Badge variant="secondary">{selected?.cvId}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div>
              <div className="flex items-start gap-4 pb-4 border-b-4" style={{ borderColor: selected.accentColor || '#F26522' }}>
                {selected.photo
                  ? <img src={selected.photo} alt={selected.fullName} className="h-24 w-24 rounded-xl object-cover border-2" style={{ borderColor: selected.accentColor || '#F26522' }} />
                  : <div className="h-24 w-24 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><User className="h-8 w-8" /></div>}
                <div>
                  <h2 className="text-xl font-bold">{selected.fullName}</h2>
                  <p className="font-semibold" style={{ color: selected.accentColor || '#F26522' }}>{selected.headline}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                    {selected.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selected.email}</span>}
                    {selected.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selected.phone}</span>}
                    {selected.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>}
                  </div>
                </div>
              </div>
              {selected.summary && <div className="py-3"><h3 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: selected.accentColor }}>Profile</h3><p className="text-sm text-gray-700">{selected.summary}</p></div>}
              {selected.experience?.length > 0 && (
                <div className="py-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: selected.accentColor }}>Experience</h3>
                  {selected.experience.map((e, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between"><strong className="text-sm">{e.role}</strong><span className="text-xs text-gray-500">{e.period}</span></div>
                      <div className="text-sm text-gray-600">{e.company}</div>
                      {e.details && <p className="text-sm text-gray-700 mt-0.5">{e.details}</p>}
                    </div>
                  ))}
                </div>
              )}
              {selected.education?.length > 0 && (
                <div className="py-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: selected.accentColor }}>Education</h3>
                  {selected.education.map((e, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between"><strong className="text-sm">{e.degree}</strong><span className="text-xs text-gray-500">{e.year}</span></div>
                      <div className="text-sm text-gray-600">{e.school}</div>
                    </div>
                  ))}
                </div>
              )}
              {selected.skills?.length > 0 && (
                <div className="py-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: selected.accentColor }}>Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((s, i) => (
                      <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${selected.accentColor}1a`, color: selected.accentColor }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t mt-2">
                <Button onClick={() => handlePrint(selected)} style={{ backgroundColor: selected.accentColor || '#F26522' }} data-testid="cv-print">
                  <Printer className="h-4 w-4 mr-1" /> Print / Download PDF
                </Button>
                <Button variant="outline" className="text-red-600" onClick={() => handleDelete(selected)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVs;
