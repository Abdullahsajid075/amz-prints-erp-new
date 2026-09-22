import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Printer, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { GUIDE_EFFECTIVE, GUIDE_SECTIONS, GUIDE_VERSION } from './guidebookContent';
import { buildGuidebookHtml, downloadGuidebookHtml, printGuidebookHtml } from './guidebookHtml';

export default function GuideBook({ settings, onChange, primary }) {
  const [query, setQuery] = useState('');
  const guidebook = settings?.guidebook || {};
  const company = settings?.company || {};

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.filter((s) =>
      s.title.toLowerCase().includes(q)
      || s.audience.toLowerCase().includes(q)
      || s.body.some((p) => p.toLowerCase().includes(q))
    );
  }, [query]);

  const htmlDoc = () => buildGuidebookHtml({
    company,
    guidebook,
    generatedAt: new Date().toLocaleString('en-PK'),
  });

  const onPrint = () => {
    printGuidebookHtml(htmlDoc());
    toast.message('Print dialog opened — choose Save as PDF if you need a PDF file');
  };

  const onDownload = () => {
    const slug = String(company.name || 'amz-prints').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    downloadGuidebookHtml(htmlDoc(), `${slug || 'amz-prints'}-erp-guidebook-v${GUIDE_VERSION}.html`);
    toast.success('Guide book downloaded — open it and print to PDF if required');
  };

  return (
    <div className="space-y-4" data-testid="guidebook-panel">
      <Card className="overflow-hidden border-0 shadow-md">
        <div
          className="text-white p-5 sm:p-6"
          style={{ background: `linear-gradient(135deg, #0747a3 0%, ${primary || '#ff6d00'} 100%)` }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Controlled document</p>
              <h2 className="font-display text-2xl font-bold mt-1">ERP Operator Manual</h2>
              <p className="text-sm text-white/80 mt-1">
                {company.name || 'Amazon Printing Services'} · Version {GUIDE_VERSION} · {GUIDE_EFFECTIVE}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="bg-white text-slate-900 hover:bg-white/90" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />Print / PDF
              </Button>
              <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />Download HTML
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Professional handbook for every module: sales, production, money, warehouse, and controls.
            Save house rules below with <strong>Save All Settings</strong>, then print a fresh copy.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the manual (invoice, POS, outstanding…)"
              className="pl-9"
              data-testid="guidebook-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />Company-specific instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Opening hours / shifts</Label>
            <Textarea
              rows={3}
              value={guidebook.openingHours || ''}
              onChange={(e) => onChange('guidebook', 'openingHours', e.target.value)}
              placeholder="Mon–Sat 10:00–20:00 · Friday prayer break…"
            />
          </div>
          <div>
            <Label>Escalation &amp; approvers</Label>
            <Textarea
              rows={3}
              value={guidebook.escalation || ''}
              onChange={(e) => onChange('guidebook', 'escalation', e.target.value)}
              placeholder="Discount &gt; 10% → Manager · Unblock customer → Admin…"
            />
          </div>
          <div className="md:col-span-2">
            <Label>House rules / local SOP</Label>
            <Textarea
              rows={5}
              value={guidebook.houseRules || ''}
              onChange={(e) => onChange('guidebook', 'houseRules', e.target.value)}
              placeholder="Write shop-floor rules, cash limits, delivery cut-off times, WhatsApp groups…"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Internal support notes</Label>
            <Textarea
              rows={3}
              value={guidebook.supportNotes || ''}
              onChange={(e) => onChange('guidebook', 'supportNotes', e.target.value)}
              placeholder="IT contact, printer names, backup reminder…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-4 h-fit lg:sticky lg:top-4">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Contents</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {GUIDE_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#guide-${s.id}`}
                className="block text-sm px-2 py-1.5 rounded-md hover:bg-slate-100 text-slate-700"
              >
                {s.title}
              </a>
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-8 space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No matching chapters.</p>
          )}
          {filtered.map((s) => (
            <Card key={s.id} id={`guide-${s.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{s.audience}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {s.body.map((p, i) => (
                  <p key={`${s.id}-${i}`} className="text-sm text-slate-700 leading-relaxed">{p}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
