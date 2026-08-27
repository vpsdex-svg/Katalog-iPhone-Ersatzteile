// Gemeinsame Katalog-Abfrage gegen Supabase REST — funktioniert in Node
// und im Browser (nutzt nur fetch + URLSearchParams).
//
// `url` und `key` werden übergeben:
//  - Im lokalen Dev-Proxy (vite.config.js) wird serverseitig der
//    Service-Role-Key verwendet — er verlässt den Server nie.
//  - In den Base44-Funktionen kommt der Secrets-Wert aus base44:runtime.

const APPLE_BRAND = 16;

// Gecachte Prüfung, ob device_parts bereits die Spalten offer_price
// bzw. is_new hat (per ALTER TABLE hinzugefügt).
let offerPriceSupported = null;
let isNewCapable = null;
async function hasColumn(url, key, column) {
  try {
    const res = await fetch(`${url}/rest/v1/device_parts?select=${column}&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
async function isOfferPriceSupported(url, key) {
  if (offerPriceSupported === null) offerPriceSupported = await hasColumn(url, key, 'offer_price');
  return offerPriceSupported;
}
async function isNewSupported(url, key) {
  if (isNewCapable === null) isNewCapable = await hasColumn(url, key, 'is_new');
  return isNewCapable;
}

async function sbList(url, key, table, opts = {}) {
  const p = new URLSearchParams();
  p.set("select", opts.select || "*");
  if (opts.order) p.set("order", opts.order);
  if (opts.limit) p.set("limit", String(opts.limit));
  const res = await fetch(`${url}/rest/v1/${table}?${p.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`list ${table} ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function sbFilter(url, key, table, filters, opts = {}) {
  const p = new URLSearchParams();
  p.set("select", opts.select || "*");
  for (const [k, v] of Object.entries(filters || {})) {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  }
  if (opts.order) p.set("order", opts.order);
  if (opts.limit) p.set("limit", String(opts.limit));
  const res = await fetch(`${url}/rest/v1/${table}?${p.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`filter ${table} ${res.status}: ${await res.text()}`);
  return await res.json();
}

export function sortIphonesNewest(arr, nameKey = "model_name") {
  const key = (name) => {
    const n = String(name || "").toLowerCase().trim();
    let gen = -1, sub = 0;
    const m = n.match(/iphone\s+(\d+)/);
    if (m) gen = parseInt(m[1], 10);
    else if (/\biphone\s*x[sr]?\b/.test(n)) gen = 10;
    else if (/\bse\b/.test(n)) {
      gen = -100;
      const sm = n.match(/se\s*(\d+)/);
      sub = sm ? parseInt(sm[1], 10) : 0;
    }
    let v = 1;
    if (/pro max/.test(n)) v = 5;
    else if (/pro/.test(n)) v = 4;
    else if (/plus/.test(n)) v = 3;
    else if (/mini/.test(n)) v = 0;
    return { gen, sub, v };
  };
  return [...(arr || [])].sort((a, b) => {
    const ka = key((a && (a[nameKey] || a.model_name)) || "");
    const kb = key((b && (b[nameKey] || b.model_name)) || "");
    if (kb.gen !== ka.gen) return kb.gen - ka.gen;
    if (kb.sub !== ka.sub) return kb.sub - ka.sub;
    return kb.v - ka.v;
  });
}

export async function fetchCatalogFromSupabase(url, key) {
  const base = (url || "").replace(/\/$/, "");

  const cats = await sbList(base, key, "categories", { order: "name.asc", limit: 100 });
  const sm = (cats || []).find((c) => /^smartphones?$/i.test(String(c.name)));
  const catId = sm ? sm.id : 1;

  const devices = await sbFilter(base, key, "devices",
    { brand_id: `eq.${APPLE_BRAND}`, category_id: `eq.${catId}` },
    { select: "id,model_name,image_url,model_code,is_hidden,brand_id,category_id", order: "model_name.asc", limit: 2000 }
  );
  const visible = sortIphonesNewest((devices || []).filter((d) => !d.is_hidden));
  const deviceIds = visible.map((d) => d.id);

  let deviceParts = [];
  if (deviceIds.length) {
    const baseSelect = "id,device_id,part_id,part_name_custom,price,currency,quality_grade,image_url,created_at";
    let select = baseSelect;
    if (await isOfferPriceSupported(base, key)) select += ",offer_price";
    if (await isNewSupported(base, key)) select += ",is_new";
    deviceParts = await sbFilter(base, key, "device_parts",
      { device_id: `in.(${deviceIds.join(",")})` },
      { select, limit: 30000 }
    );
  }

  const partIds = [...new Set((deviceParts || []).map((dp) => dp.part_id).filter(Boolean))];
  let parts = [];
  if (partIds.length) {
    parts = await sbFilter(base, key, "parts", { id: `in.(${partIds.join(",")})` }, { limit: 2000 });
  }

  const companies = await sbList(base, key, "company_settings", { limit: 1 });
  return {
    models: visible,
    deviceParts: deviceParts || [],
    parts: parts || [],
    company: (companies && companies[0]) || null,
  };
}
