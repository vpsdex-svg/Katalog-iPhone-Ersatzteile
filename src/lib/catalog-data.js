// Browser-Zugriff auf den Katalog: liest direkt aus Supabase über den
// supabase-js-Client (anon key) — kein Server/Proxy nötig.
// Voraussetzung: RLS-Policies erlauben öffentliches Lesen der Tabellen
// categories, devices, device_parts, parts, company_settings.

import { supabase } from '@/lib/supabaseClient';
import { sortIphonesNewest } from '@/lib/supabase-catalog';

const APPLE_BRAND = 16;

async function hasColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function smartphoneCategoryId() {
  const { data } = await supabase.from('categories').select('id,name').order('name');
  const sm = (data || []).find((c) => /^smartphones?$/i.test(String(c.name)));
  return sm ? sm.id : 1;
}

export async function fetchCatalogData() {
  const catId = await smartphoneCategoryId();

  // Alle sichtbaren iPhones der Smartphone-Kategorie (Marke Apple)
  const { data, error } = await supabase
    .from('devices')
    .select('id,model_name,image_url,model_code,is_hidden,brand_id,category_id')
    .eq('brand_id', APPLE_BRAND)
    .eq('category_id', catId)
    .limit(2000);
  if (error) throw error;
  const visible = sortIphonesNewest((data || []).filter((d) => !d.is_hidden));
  const deviceIds = visible.map((d) => d.id);

  // Gerät-Teile mit optionalen Spalten
  let deviceParts = [];
  if (deviceIds.length) {
    const baseSelect = 'id,device_id,part_id,part_name_custom,price,currency,quality_grade,image_url,created_at';
    let select = baseSelect;
    if (await hasColumn('device_parts', 'offer_price')) select += ',offer_price';
    if (await hasColumn('device_parts', 'is_new')) select += ',is_new';
    const { data: dp } = await supabase
      .from('device_parts')
      .select(select)
      .in('device_id', deviceIds)
      .limit(30000);
    deviceParts = dp || [];
  }

  // Stammdaten der Teile
  const partIds = [...new Set((deviceParts || []).map((d) => d.part_id).filter(Boolean))];
  let parts = [];
  if (partIds.length) {
    const { data: p } = await supabase.from('parts').select('*').in('id', partIds).limit(2000);
    parts = p || [];
  }

  // Firmendaten
  const { data: companies } = await supabase.from('company_settings').select('*').limit(1);

  return {
    models: visible,
    deviceParts: deviceParts || [],
    parts: parts || [],
    company: (companies && companies[0]) || null,
  };
}
