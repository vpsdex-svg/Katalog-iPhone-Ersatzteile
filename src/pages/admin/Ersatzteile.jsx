import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Package, Search, Upload } from 'lucide-react';

function formatPrice(val, currency) {
  const n = Number(val || 0).toFixed(2).replace('.', ',');
  return currency && currency !== 'EUR' ? `${n} ${currency}` : `${n} €`;
}

function isNewPart(p) {
  return !!(p && p.is_new);
}

export default function Ersatzteile() {
  const [items, setItems] = useState([]);
  const [devices, setDevices] = useState([]);
  const [partsMaster, setPartsMaster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDevice, setFilterDevice] = useState('');
  const [filterType, setFilterType] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ device_id: '', part_id: '', part_name_custom: '', price: '', currency: 'EUR', quality_grade: '', image_url: '', offer_price: '' });
  const [saving, setSaving] = useState(false);
  const [offerSupported, setOfferSupported] = useState(false);
  const [newSupported, setNewSupported] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dp, dev, pm, caps] = await Promise.all([
        adminApi.deviceParts.list(),
        adminApi.models.list(),
        adminApi.parts.list(),
        adminApi.capabilities().catch(() => ({})),
      ]);
      setItems(dp || []);
      setDevices(dev || []);
      setPartsMaster(pm || []);
      setOfferSupported(!!caps?.offerPrice);
      setNewSupported(!!caps?.isNew);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const deviceMap = useMemo(() => Object.fromEntries(devices.map((d) => [d.id, d.model_name])), [devices]);
  const partMap = useMemo(() => Object.fromEntries(partsMaster.map((p) => [p.id, p.name])), [partsMaster]);
  const typeOptions = useMemo(() => [...new Set(partsMaster.map((p) => p.category).filter(Boolean))].sort(), [partsMaster]);

  const partName = (p) => p.part_name_custom || partMap[p.part_id] || 'Ersatzteil';
  const partType = (p) => {
    const master = partsMaster.find((m) => m.id === p.part_id);
    return master ? master.category : '';
  };

  const filtered = items.filter((p) => {
    if (filterDevice && p.device_id !== Number(filterDevice)) return false;
    if (filterType && partType(p) !== filterType) return false;
    if (query && !partName(p).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const openNew = () => {
    setEditing(null);
    setForm({ device_id: filterDevice || (devices[0] && String(devices[0].id)) || '', part_id: partsMaster[0] ? String(partsMaster[0].id) : '', part_name_custom: '', price: '', currency: 'EUR', quality_grade: '', image_url: '', offer_price: '', is_new: false });
    setOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ device_id: item.device_id || '', part_id: item.part_id || '', part_name_custom: item.part_name_custom || '', price: item.price !== null && item.price !== undefined ? String(item.price) : '', currency: item.currency || 'EUR', quality_grade: item.quality_grade || '', image_url: item.image_url || '', offer_price: item.offer_price !== null && item.offer_price !== undefined ? String(item.offer_price) : '', is_new: !!item.is_new });
    setOpen(true);
  };

  const pickImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { url } = await adminApi.upload(f);
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch (err) {
      alert(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: form.price === '' ? null : form.price, offer_price: form.offer_price === '' ? null : form.offer_price };
      if (!offerSupported) delete payload.offer_price;
      if (editing) await adminApi.deviceParts.update(editing.id, payload);
      else await adminApi.deviceParts.create(payload);
      setOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    if (!confirm(`Ersatzteil "${partName(item)}" (${deviceMap[item.device_id] || '—'}) wirklich löschen?`)) return;
    try {
      await adminApi.deviceParts.remove(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ersatzteile</h1>
          <p className="text-sm text-slate-500">{filtered.length} von {items.length} preisbewerteten Teilen</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />Neues Ersatzteil
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Teilname suchen…" className="pl-9" />
        </div>
        <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Alle Modelle</option>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.model_name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Alle Typen</option>
          {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Teil</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Modell</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Typ</th>
                  <th className="text-left px-4 py-3 font-semibold">Qualität</th>
                  <th className="text-left px-4 py-3 font-semibold">Preis</th>
                  <th className="text-right px-4 py-3 font-semibold">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" referrerPolicy="no-referrer" className="w-9 h-9 object-contain rounded border border-slate-200 p-0.5 bg-white" />
                        ) : (
                          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center"><Package className="w-4 h-4 text-slate-400" /></div>
                        )}
                        <span className="font-semibold text-slate-900">{partName(p)}</span>
                        {isNewPart(p) && <span className="text-[0.65rem] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded ml-1.5 shrink-0">NEU</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      {deviceMap[p.device_id] || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{partType(p) || '—'}</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{p.quality_grade || '—'}</span></td>
                    <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">
                      {p.offer_price ? (
                        <>
                          <span className="text-rose-600">{formatPrice(p.offer_price, p.currency)}</span>
                          <span className="text-xs text-slate-400 line-through font-normal ml-1.5">{formatPrice(p.price, p.currency)}</span>
                        </>
                      ) : (
                        formatPrice(p.price, p.currency)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {newSupported && (
                          <button
                            onClick={async () => {
                              try {
                                await adminApi.deviceParts.update(p.id, { is_new: !isNewPart(p) });
                                load();
                              } catch (err) { alert(err.message); }
                            }}
                            title={isNewPart(p) ? 'NEU entfernen' : 'Als NEU markieren'}
                            className={`p-1.5 rounded-lg border text-[0.6rem] font-bold transition-colors ${
                              isNewPart(p) ? 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200' : 'text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            NEU
                          </button>
                        )}
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => del(p)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Keine Ersatzteile gefunden.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Ersatzteil bearbeiten' : 'Neues Ersatzteil'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Modell</Label>
                <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— wählen —</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.model_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Teil (Stammdaten)</Label>
                <select value={form.part_id} onChange={(e) => setForm({ ...form, part_id: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">— wählen —</option>
                  {partsMaster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Teilname überschreiben (optional)</Label>
              <Input value={form.part_name_custom} onChange={(e) => setForm({ ...form, part_name_custom: e.target.value })} placeholder="Leer = Name aus Stammdaten" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preis</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="z. B. 49.90" />
              </div>
              <div className="space-y-1.5">
                <Label>Währung</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="EUR" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Qualitätsstufe (optional)</Label>
              <Input value={form.quality_grade} onChange={(e) => setForm({ ...form, quality_grade: e.target.value })} placeholder="z. B. OEM, Premium, Incell" />
            </div>
            {offerSupported && (
              <div className="space-y-1.5">
                <Label>Angebotspreis (optional)</Label>
                <Input type="number" step="0.01" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} placeholder="z. B. 39.90 — wird im Katalog als Angebot angezeigt" />
              </div>
            )}
            {newSupported && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!form.is_new}
                  onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
                  className="w-4 h-4 accent-sky-600"
                />
                <span className="text-sm font-semibold text-slate-700">Als NEU markieren</span>
                <span className="text-xs text-slate-400">(zeigt die blaue NEU-Schleife im Katalog)</span>
              </label>
            )}
            <div className="space-y-1.5">
              <Label>Bild (wird in Supabase Storage gespeichert)</Label>
              <div className="flex items-center gap-3">
                {form.image_url && <img src={form.image_url} alt="" referrerPolicy="no-referrer" className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1" />}
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Upload className="w-4 h-4" />Bild wählen
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
                </label>
                <span className="text-xs text-slate-400 truncate">{form.image_url ? 'Bild gewählt' : 'Kein Bild'}</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
