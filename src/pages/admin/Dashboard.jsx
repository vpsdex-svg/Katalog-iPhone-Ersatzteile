import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/admin-api';
import { Smartphone, Package, Tag, TrendingUp, Plus, ArrowRight } from 'lucide-react';

function formatPrice(val) {
  return Number(val || 0).toFixed(2).replace('.', ',') + ' €';
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ models: 0, parts: 0, categories: 0, avg: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [devices, deviceParts, partsMaster] = await Promise.all([
          adminApi.models.list(),
          adminApi.deviceParts.list(),
          adminApi.parts.list(),
        ]);
        const withPrice = deviceParts.filter((p) => p.price != null);
        const avg = withPrice.length ? withPrice.reduce((s, p) => s + Number(p.price || 0), 0) / withPrice.length : 0;
        const devMap = Object.fromEntries(devices.map((d) => [d.id, d.model_name]));
        const pmMap = Object.fromEntries(partsMaster.map((p) => [p.id, p.name]));
        const recentRows = deviceParts.slice(0, 8).map((p) => ({
          ...p, deviceName: devMap[p.device_id] || '—', partName: p.part_name_custom || pmMap[p.part_id] || 'Ersatzteil',
        }));
        setStats({ models: devices.length, parts: deviceParts.length, categories: partsMaster.length, avg });
        setRecent(recentRows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Übersicht über Ihren iPhone-Ersatzteil-Katalog (Supabase)</p>
        </div>
        <Link to="/admin/ersatzteile" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700">
          <Plus className="w-4 h-4" />Neues Ersatzteil
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Smartphone} label="iPhone-Modelle" value={stats.models} accent="bg-slate-100 text-slate-700" />
        <StatCard icon={Package} label="Ersatzteile (device_parts)" value={stats.parts} accent="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Tag} label="Teil-Stammdaten" value={stats.categories} accent="bg-sky-100 text-sky-700" />
        <StatCard icon={TrendingUp} label="Ø Preis" value={formatPrice(stats.avg)} accent="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-slate-900">Neueste Ersatzteile</h2>
            <Link to="/admin/ersatzteile" className="text-sm font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
              Alle ansehen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="py-10 text-center text-slate-400">Wird geladen…</div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center text-slate-400">Noch keine Ersatzteile.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" referrerPolicy="no-referrer" className="w-10 h-10 object-contain rounded-lg border border-slate-200 p-1 bg-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="w-4 h-4 text-slate-400" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{p.partName}</div>
                    <div className="text-xs text-slate-500">{p.deviceName}</div>
                  </div>
                  <div className="font-bold text-emerald-600 text-sm">{formatPrice(p.price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-extrabold text-slate-900 mb-4">Schnellaktionen</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/modelle', label: 'Modell hinzufügen', icon: Smartphone },
              { to: '/admin/ersatzteile', label: 'Ersatzteil hinzufügen', icon: Package },
              { to: '/admin/kategorien', label: 'Teil-Stammdaten verwalten', icon: Tag },
              { to: '/admin/firmeneinstellungen', label: 'Firmendaten bearbeiten', icon: TrendingUp },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-600" /></div>
                  <span className="text-sm font-semibold text-slate-700">{a.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
