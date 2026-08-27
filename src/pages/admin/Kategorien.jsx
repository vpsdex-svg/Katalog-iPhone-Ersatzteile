import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';

export default function Kategorien() {
  const [items, setItems] = useState([]);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [master, dp] = await Promise.all([
        adminApi.parts.list(),
        adminApi.deviceParts.list(),
      ]);
      setItems(master || []);
      const u = {};
      (dp || []).forEach((row) => { if (row.part_id) u[row.part_id] = (u[row.part_id] || 0) + 1; });
      setUsage(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const categoryGroups = useMemo(() => {
    const g = {};
    items.forEach((p) => { const c = p.category || 'Ohne Kategorie'; (g[c] = g[c] || []).push(p); });
    return g;
  }, [items]);

  const openNew = () => { setEditing(null); setForm({ name: '', category: '' }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || '', category: item.category || '' }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category || null };
      if (editing) await adminApi.parts.update(editing.id, payload);
      else await adminApi.parts.create(payload);
      setOpen(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    if ((usage[item.id] || 0) > 0 && !confirm(`"${item.name}" wird bei ${usage[item.id]} Ersatzteilen verwendet. Trotzdem löschen?`)) return;
    if ((usage[item.id] || 0) === 0 && !confirm(`Teiltyp "${item.name}" wirklich löschen?`)) return;
    try {
      await adminApi.parts.remove(item.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Teil-Stammdaten</h1>
          <p className="text-sm text-slate-500">{items.length} Ersatzteil-Typen (z. B. Display, Akku) für die Zuordnung zu Geräten</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-700">
          <Plus className="w-4 h-4 mr-2" />Neuer Teiltyp
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([cat, rows]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-emerald-700" />
                <h2 className="font-bold text-slate-700">{cat}</h2>
                <span className="text-xs text-slate-400">· {rows.length} Typen</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rows.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => del(c)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 mt-3">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{c.category || '—'}</p>
                    <div className="mt-3 text-sm text-slate-600">
                      <span className="font-bold text-emerald-600">{usage[c.id] || 0}</span> Ersatzteile
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Tag className="w-10 h-10 mx-auto mb-2" />Noch keine Teil-Stammdaten.
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Teiltyp bearbeiten' : 'Neuer Teiltyp'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="z. B. Display" />
            </div>
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="z. B. display, battery" />
              <p className="text-xs text-slate-400">Gruppierung für die Filterung in der Ersatzteile-Verwaltung.</p>
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
