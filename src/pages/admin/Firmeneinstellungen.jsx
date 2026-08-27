import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Building2, Check, Upload, Bold, Italic, Palette } from 'lucide-react';
import { insertNoticeSnippet } from '@/lib/format-notice';

export default function Firmeneinstellungen() {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rec = await adminApi.company.get();
        setRecord(rec);
        setForm(rec ? { ...rec } : {
          company_name: 'Fixtop', address: '', phone: '', email: '', whatsapp_number: '', website: '', last_updated: new Date().toISOString().slice(0, 10), logo_url: '', notice_message: '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickLogo = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { url } = await adminApi.upload(f);
      setForm((prev) => ({ ...prev, logo_url: url }));
    } catch (err) {
      alert(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const savedRec = await adminApi.company.save(form, record && record.id);
      setRecord(savedRec);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="py-20 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Firmeneinstellungen</h1>
        <p className="text-sm text-slate-500">Diese Daten erscheinen auf der öffentlichen Katalog-Seite</p>
      </div>

      <form onSubmit={save} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div>
          <div>
            <div className="font-bold text-slate-900">Firmenprofil</div>
            <div className="text-xs text-slate-500">Sichtbar für Kunden im öffentlichen Katalog</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Firmenname</Label>
            <Input value={form.company_name || ''} onChange={set('company_name')} required />
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address || ''} onChange={set('address')} placeholder="Straße, Ort" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={form.phone || ''} onChange={set('phone')} required placeholder="015906329209" />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp-Nummer</Label>
            <Input value={form.whatsapp_number || ''} onChange={set('whatsapp_number')} placeholder="4915906329209" />
          </div>
          <div className="space-y-1.5">
            <Label>E-Mail</Label>
            <Input type="email" value={form.email || ''} onChange={set('email')} placeholder="info@firma.de" />
          </div>
          <div className="space-y-1.5">
            <Label>Webseite</Label>
            <Input value={form.website || ''} onChange={set('website')} placeholder="app.fixtop.de" />
          </div>
          <div className="space-y-1.5">
            <Label>Letzte Aktualisierung</Label>
            <Input type="date" value={(form.last_updated || '').slice(0, 10)} onChange={set('last_updated')} />
            <p className="text-xs text-slate-400">Wird automatisch auf heute gesetzt, sobald Sie Modelle oder Ersatzteile ändern.</p>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Hinweis im Katalog (optional)</Label>
            <textarea
              value={form.notice_message || ''}
              onChange={set('notice_message')}
              rows={3}
              placeholder="z. B. 🚚 [Lieferung]{#e11d48} zum Festpreis – **nur 10 €** deutschlandweit"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-slate-900"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Einfügen:</span>
              <button type="button" onClick={() => setForm({ ...form, notice_message: insertNoticeSnippet(form.notice_message || '', '**Fett**') })} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Bold className="w-3 h-3" />Fett</button>
              <button type="button" onClick={() => setForm({ ...form, notice_message: insertNoticeSnippet(form.notice_message || '', '*Kursiv*') })} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Italic className="w-3 h-3" />Kursiv</button>
              <button type="button" onClick={() => setForm({ ...form, notice_message: insertNoticeSnippet(form.notice_message || '', '[Text]{#e11d48}') })} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Palette className="w-3 h-3" />Farbe</button>
              <span className="mx-1 text-slate-200">|</span>
              {['🚚', '⚡', '🔥', '💰', '⭐', '📦', '✅', '🛠️'].map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm({ ...form, notice_message: insertNoticeSnippet(form.notice_message || '', emoji) })} className="px-1.5 py-1 rounded-md border border-slate-200 text-sm hover:bg-slate-50">{emoji}</button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Formatierung: <code className="bg-slate-100 px-1 rounded">**fett**</code> · <code className="bg-slate-100 px-1 rounded">*kursiv*</code> · <code className="bg-slate-100 px-1 rounded">[Text]{'{#ff0000}'}</code> · Emojis direkt einfügen. Wird als farbige Hinweis-Leiste oben auf der Katalog-Seite angezeigt.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url && <img src={form.logo_url} alt="" referrerPolicy="no-referrer" className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1" />}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Upload className="w-4 h-4" />Logo wählen
                <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Speichern
          </Button>
          {saved && (
            <span className="text-sm font-semibold text-emerald-600 inline-flex items-center gap-1">
              <Check className="w-4 h-4" />Gespeichert
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
