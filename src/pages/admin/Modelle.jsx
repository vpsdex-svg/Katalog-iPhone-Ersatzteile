import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Smartphone, Upload } from 'lucide-react';

export default function Modelle() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ model_name: '', model_code: '', image_url: '', is_hidden: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await adminApi.models.list();
      setItems(rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ model_name: '', model_code: '', image_url: '', is_hidden: false });
    setOpen(true);
  };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ model_name: item.model_name || '', model_code: item.model_code || '', image_url: item.image_url || '', is_hidden: !!item.is_hidden });
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
      if (editing) await adminApi.models.update(editing.id, form);
      else await adminApi.models.create(form);
      setOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    if (!confirm(`Modell "${item.model_name}" wirklich löschen? Alle zugehörigen Ersatzteile (device_parts) bleiben bestehen, verlieren aber die Gerätezuordnung.`)) return;
    try {
      await adminApi.models.remove(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Modelle</h1>
          <p className="text-sm text-slate-500">
            {items.length} iPhone-Modelle (Marke Apple · Kategorie Smartphone)
          </p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />Neues Modell
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4">
              <img
                src={m.image_url}
                alt={m.model_name}
                referrerPolicy="no-referrer"
                className="w-[60px] h-[74px] object-contain bg-white border border-slate-200 rounded-lg p-1 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 truncate">{m.model_name}</h3>
                  <span className={`w-2 h-2 rounded-full ${!m.is_hidden ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{!m.is_hidden ? 'Sichtbar' : 'Versteckt'}</p>
                {m.model_code && <p className="text-[0.7rem] text-slate-400 font-mono mt-1 truncate">{m.model_code}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(m)} className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />Bearbeiten</button>
                  <button onClick={() => del(m)} className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" />Löschen</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <Smartphone className="w-10 h-10 mx-auto mb-2" />Noch keine Modelle.
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modell bearbeiten' : 'Neues Modell'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Modellname</Label>
              <Input value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} placeholder="z. B. iPhone 15 Pro" required />
            </div>
            <div className="space-y-1.5">
              <Label>Modellcode (optional)</Label>
              <Input value={form.model_code} onChange={(e) => setForm({ ...form, model_code: e.target.value })} placeholder="z. B. A2848" />
            </div>
            <div className="space-y-1.5">
              <Label>Bild (wird in Supabase Storage gespeichert)</Label>
              <div className="flex items-center gap-3">
                {form.image_url && <img src={form.image_url} alt="" referrerPolicy="no-referrer" className="w-12 h-16 object-contain bg-white border border-slate-200 rounded-lg p-1" />}
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Upload className="w-4 h-4" />Bild wählen
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
                </label>
                <span className="text-xs text-slate-400 truncate">{form.image_url ? 'Bild gewählt' : 'Kein Bild'}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.is_hidden} onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })} className="w-4 h-4" />
              Im Katalog verstecken (is_hidden)
            </label>
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
