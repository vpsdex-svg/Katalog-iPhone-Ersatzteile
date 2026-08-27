import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard, Smartphone, Package, Tag, Building2,
  ExternalLink, LogOut, Menu
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/modelle', label: 'Modelle', icon: Smartphone },
  { to: '/admin/ersatzteile', label: 'Ersatzteile', icon: Package },
  { to: '/admin/kategorien', label: 'Kategorien', icon: Tag },
  { to: '/admin/firmeneinstellungen', label: 'Firmeneinstellungen', icon: Building2 },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const SidebarInner = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-extrabold text-slate-900 leading-tight">Fixtop CMS</div>
          <div className="text-[11px] text-slate-500">Ersatzteil-Katalog</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <a
          href="/katalog"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
          Katalog ansehen
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Abmelden
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <SidebarInner />
          </aside>
        </div>
      )}

      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} aria-label="Menü">
          <Menu className="w-6 h-6 text-slate-700" />
        </button>
        <div className="font-extrabold text-slate-900">Fixtop CMS</div>
        <Link to="/katalog" target="_blank" className="text-slate-500">
          <ExternalLink className="w-5 h-5" />
        </Link>
      </header>

      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
