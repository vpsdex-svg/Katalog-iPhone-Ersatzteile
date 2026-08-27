import React, { useEffect, useState } from 'react';
import { fetchCatalogData } from '@/lib/catalog-data';
import { formatNotice } from '@/lib/format-notice';
import ContactDialog from '@/components/contact/ContactDialog';
import { Phone, MessageCircle, Mail, MapPin, Calendar, X, Search, ChevronDown } from 'lucide-react';

function formatPrice(val, currency) {
  const n = Number(val || 0).toFixed(2).replace('.', ',');
  return currency && currency !== 'EUR' ? `${n} ${currency}` : `${n} €`;
}

function isNewPart(p) {
  return !!(p && p.is_new);
}

function PartCard({ p, fallbackImage, onZoom }) {
  const name = p.part_name_custom || p.partName || 'Ersatzteil';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 transition-transform hover:-translate-y-0.5 hover:border-slate-300">
      <img
        src={p.image_url || fallbackImage}
        alt={name}
        referrerPolicy="no-referrer"
        onError={(e) => { if (fallbackImage) e.target.src = fallbackImage; }}
        onClick={() => onZoom(p.image_url || fallbackImage, name)}
        className="w-14 h-14 object-contain bg-white rounded-lg p-1 border border-slate-200 shrink-0 cursor-zoom-in"
      />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{name}</div>
          {isNewPart(p) && <span className="text-[0.65rem] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded shrink-0">NEU</span>}
        </div>
        {p.description && <span className="text-[0.7rem] text-slate-500 line-clamp-2">{p.description}</span>}
        {p.offer_price ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-extrabold text-rose-600 text-base">{formatPrice(p.offer_price, p.currency)}</div>
            <div className="text-xs text-slate-400 line-through">{formatPrice(p.price, p.currency)}</div>
            <span className="text-[0.65rem] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">Angebot</span>
          </div>
        ) : (
          <div className="font-extrabold text-emerald-600 text-base">{formatPrice(p.price, p.currency)}</div>
        )}
      </div>
    </div>
  );
}

export default function Katalog() {
  const [models, setModels] = useState([]);
  const [deviceParts, setDeviceParts] = useState([]);
  const [partsMap, setPartsMap] = useState({});
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [openIds, setOpenIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCatalogData();
        setModels(data.models || []);
        setDeviceParts(data.deviceParts || []);
        const pm = {};
        (data.parts || []).forEach((p) => { pm[p.id] = p.name; });
        setPartsMap(pm);
        setCompany(data.company || null);
        const first = (data.models || [])[0];
        if (first) {
          setSelectedId(first.id);
          setOpenIds(new Set([first.id]));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = models.find((m) => m.id === selectedId);
  const selectedParts = deviceParts.filter((p) => p.device_id === selectedId);

  const partName = (p) => p.part_name_custom || partsMap[p.part_id] || 'Ersatzteil';
  const partsOf = (id) => deviceParts.filter((p) => p.device_id === id);

  const filteredModels = models.filter((m) =>
    String(m.model_name).toLowerCase().includes(query.toLowerCase().trim())
  );

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const companyName = company?.company_name || 'Fixtop';
  const whatsappNum = (company?.whatsapp_number || company?.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Company bar */}
      <div className="bg-slate-900 text-slate-200 px-4 lg:px-7 py-2.5 text-sm">
        <div className="max-w-[1600px] mx-auto flex items-center gap-2.5 flex-wrap">
          <span className="font-extrabold text-white text-[1.05rem] tracking-wide">{companyName}</span>
          {company?.website && (
            <>
              <span className="text-slate-600">•</span>
              <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener" className="hover:text-white hover:underline">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            </>
          )}
          {company?.address && (
            <>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{company.address}</span>
            </>
          )}
          {company?.phone && (
            <>
              <span className="text-slate-600">•</span>
              <a href={`tel:${company.phone}`} className="font-bold text-white whitespace-nowrap inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />{company.phone}
              </a>
            </>
          )}
          {company?.last_updated && (
            <>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 font-semibold ml-auto">
                <Calendar className="w-3.5 h-3.5" />Zuletzt aktualisiert: {new Date(company.last_updated).toLocaleDateString('de-DE')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hinweis-Leiste (z. B. Lieferung) */}
      {company?.notice_message && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-7 py-2.5 text-sm text-amber-900 font-semibold">
          <div className="max-w-[1600px] mx-auto flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="[&_strong]:font-extrabold [&_em]:italic">{formatNotice(company.notice_message)}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-7 py-3.5 sticky top-0 z-40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={companyName}
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.style.display = 'none'; }}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-extrabold text-sm">F</div>
          )}
          <div>
            <h1 className="text-[1.05rem] font-extrabold text-slate-900 leading-tight">Katalog – iPhone Ersatzteile</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Geprüfte Datenbank für Reparaturen & Komponenten</p>
          </div>
        </div>
        <div className="relative w-40 sm:w-72 lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Modell suchen…"
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
          />
        </div>
      </header>

      {/* Sticky contact actions */}
      <div className="sticky top-[61px] z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 lg:px-7 py-2 flex items-center gap-2 justify-end">
        {whatsappNum && (
          <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
            <MessageCircle className="w-4 h-4" />WhatsApp
          </a>
        )}
        {company?.phone && (
          <a href={`tel:${company.phone}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700">
            <Phone className="w-4 h-4" />Anrufen
          </a>
        )}
        <button onClick={() => setContactOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100">
          <Mail className="w-4 h-4" />Nachricht
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-[340px] lg:shrink-0 bg-white border border-slate-200 rounded-2xl p-4 lg:sticky lg:top-[140px] lg:h-[calc(100vh-160px)] lg:flex-col">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              iPhone Modelle ({filteredModels.length})
            </div>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1">
            {filteredModels.map((m) => {
              const active = m.id === selectedId;
              const count = partsOf(m.id).length;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    active ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <img
                    src={m.image_url}
                    alt={m.model_name}
                    referrerPolicy="no-referrer"
                    className="w-[42px] h-[52px] object-contain bg-white rounded-md p-0.5 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-[0.95rem] truncate">{m.model_name}</div>
                    <div className={`text-xs ${active ? 'text-slate-400' : 'text-slate-500'}`}>{count} Ersatzteile</div>
                  </div>
                </button>
              );
            })}
            {filteredModels.length === 0 && (
              <span className="text-sm text-slate-400">Keine Modelle gefunden.</span>
            )}
          </div>
        </aside>

        {/* Desktop showcase */}
        <main className="hidden lg:flex flex-1 flex-col gap-5">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-400">Katalog wird geladen…</div>
          ) : !selected ? (
            <div className="h-96 flex items-center justify-center text-slate-400">Kein Modell ausgewählt.</div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-7 flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={selected.image_url}
                  alt={selected.model_name}
                  referrerPolicy="no-referrer"
                  className="w-[140px] h-[170px] object-contain bg-white rounded-xl p-2 border border-slate-200 shrink-0"
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-1.5">{selected.model_name}</h2>
                  <p className="text-slate-500 text-sm mb-3">Spezifische Ersatzteile direkt aus der Katalog-Datenbank</p>
                  {selected.model_code && <p className="text-xs text-slate-400 font-mono mb-2">Modellcode: {selected.model_code}</p>}
                  <span className="inline-block bg-sky-100 text-sky-800 font-bold text-sm px-3 py-1 rounded-full">
                    {selectedParts.length} Ersatzteile verfügbar
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 px-1">Verfügbare Ersatzteile & Preise</h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {selectedParts.map((p) => (
                  <PartCard
                    key={p.id}
                    p={{ ...p, part_name_custom: partName(p) }}
                    fallbackImage={selected.image_url}
                    onZoom={(src, caption) => setLightbox({ src, caption: `${partName(p)} – ${selected.model_name}` })}
                  />
                ))}
                {selectedParts.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-400">Keine Ersatzteile für dieses Modell.</div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Mobile: accordion – every model is a foldable section */}
        <div className="lg:hidden flex flex-col gap-4 flex-1">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-slate-400">Katalog wird geladen…</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  iPhone Modelle ({filteredModels.length}) – tippe auf ein Modell
                </div>
              </div>
              {filteredModels.map((m) => {
                const parts = partsOf(m.id);
                const open = openIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-colors ${open ? 'border-slate-900' : 'border-slate-200'}`}
                  >
                    <button
                      onClick={() => toggleOpen(m.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <img
                        src={m.image_url}
                        alt={m.model_name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-14 object-contain bg-white rounded-lg p-0.5 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-slate-900 leading-tight">{m.model_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{parts.length} Ersatzteile</div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold rounded-full px-2 py-1 shrink-0 ${
                        open ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {open ? 'Schließen' : 'Ansehen'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {open && (
                      <div className="px-3.5 pb-4 flex flex-col gap-2.5">
                        {parts.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-sm">Keine Ersatzteile für dieses Modell.</div>
                        )}
                        {parts.map((p) => (
                          <PartCard
                            key={p.id}
                            p={{ ...p, part_name_custom: partName(p) }}
                            fallbackImage={m.image_url}
                            onZoom={(src, caption) => setLightbox({ src, caption: `${partName(p)} – ${m.model_name}` })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredModels.length === 0 && (
                <div className="text-center py-10 text-slate-400">Keine Modelle gefunden.</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/30" aria-label="Schließen">
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox.src} alt="" referrerPolicy="no-referrer" className="max-w-[92vw] max-h-[82vh] object-contain bg-white rounded-xl p-3.5 shadow-2xl" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm font-semibold max-w-[90vw] text-center">
            {lightbox.caption}
          </div>
        </div>
      )}

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} company={company} />
    </div>
  );
}
