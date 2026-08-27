// Admin-Datenzugriff — direkt über den supabase-js-Client im Browser.
// Der eingeloggte Nutzer schreibt mit seiner Session (RLS-Policies für
// die Rolle 'authenticated' erlauben CRUD). Kein Server/Proxy nötig.
import { supabase } from '@/lib/supabaseClient';
import { sortIphonesNewest } from '@/lib/supabase-catalog';

const APPLE_BRAND = 16;
const STORAGE_BUCKET = 'device-images';

const DEVICE_FIELDS = ['model_name', 'model_code', 'image_url', 'is_hidden'];
const DEVICE_PART_FIELDS = ['device_id', 'part_id', 'part_name_custom', 'price', 'currency', 'quality_grade', 'image_url', 'offer_price', 'is_new'];
const PART_FIELDS = ['name', 'category'];
const COMPANY_FIELDS = ['company_name', 'address', 'phone', 'email', 'whatsapp_number', 'website', 'last_updated', 'logo_url', 'notice_message'];

function pick(row, fields) {
  const out = {};
  fields.forEach((f) => {
    if (row[f] !== undefined) out[f] = row[f];
  });
  return out;
}

function buildDevicePartRow(data) {
  return {
    device_id: data.device_id === '' || data.device_id === undefined ? null : Number(data.device_id),
    part_id: data.part_id === '' || data.part_id === undefined ? null : Number(data.part_id),
    part_name_custom: data.part_name_custom || null,
    price: data.price === '' || data.price === undefined || data.price === null ? null : Number(data.price),
    currency: data.currency || 'EUR',
    quality_grade: data.quality_grade || null,
    image_url: data.image_url || null,
    offer_price: data.offer_price === '' || data.offer_price === undefined || data.offer_price === null ? null : Number(data.offer_price),
    is_new: data.is_new === true || data.is_new === 'true',
  };
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';
}

async function hasColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function smartphoneCategoryId() {
  const { data } = await supabase.from('categories').select('id,name').order('name');
  const sm = (data || []).find((c) => /^smartphones?$/i.test(String(c.name)));
  return sm ? sm.id : 1;
}

async function touchCompanyUpdated() {
  try {
    const { data } = await supabase.from('company_settings').select('id').limit(1);
    const rec = data && data[0];
    if (!rec) return;
    await supabase.from('company_settings').update({ last_updated: new Date().toISOString().slice(0, 10) }).eq('id', rec.id);
  } catch { /* nicht kritisch */ }
}

export const adminApi = {
  capabilities: async () => ({
    offerPrice: await hasColumn('device_parts', 'offer_price'),
    isNew: await hasColumn('device_parts', 'is_new'),
  }),

  models: {
    list: async () => {
      const catId = await smartphoneCategoryId();
      const { data, error } = await supabase
        .from('devices')
        .select('id,model_name,image_url,model_code,is_hidden,brand_id,category_id,created_at')
        .eq('brand_id', APPLE_BRAND)
        .eq('category_id', catId)
        .limit(2000);
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (body) => {
      const catId = await smartphoneCategoryId();
      const row = {
        ...pick(body, DEVICE_FIELDS),
        is_hidden: body.is_hidden === true,
        brand_id: APPLE_BRAND,
        category_id: catId,
      };
      if (!row.model_name) throw new Error('model_name fehlt');
      const { data, error } = await supabase.from('devices').insert(row).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    update: async (id, body) => {
      const row = pick(body, DEVICE_FIELDS);
      if (row.is_hidden !== undefined) row.is_hidden = row.is_hidden === true;
      const { data, error } = await supabase.from('devices').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    remove: async (id) => {
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return { success: true };
    },
  },

  parts: {
    list: async () => {
      const { data, error } = await supabase.from('parts').select('*').order('name').limit(500);
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (body) => {
      const row = { name: body.name, category: body.category || null };
      if (!row.name) throw new Error('name fehlt');
      const { data, error } = await supabase.from('parts').insert(row).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    update: async (id, body) => {
      const row = pick(body, PART_FIELDS);
      if (row.category === '') row.category = null;
      const { data, error } = await supabase.from('parts').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    remove: async (id) => {
      const { error } = await supabase.from('parts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return { success: true };
    },
  },

  deviceParts: {
    list: async () => {
      const baseSelect = 'id,device_id,part_id,part_name_custom,price,currency,quality_grade,image_url,created_at';
      let select = baseSelect;
      if (await hasColumn('device_parts', 'offer_price')) select += ',offer_price';
      if (await hasColumn('device_parts', 'is_new')) select += ',is_new';
      const { data, error } = await supabase
        .from('device_parts')
        .select(select)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (body) => {
      const row = buildDevicePartRow(body);
      if (!(await hasColumn('device_parts', 'offer_price'))) delete row.offer_price;
      if (!(await hasColumn('device_parts', 'is_new'))) delete row.is_new;
      const { data, error } = await supabase.from('device_parts').insert(row).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    update: async (id, body) => {
      const full = buildDevicePartRow(body);
      const row = {};
      DEVICE_PART_FIELDS.forEach((f) => { if (body[f] !== undefined) row[f] = full[f]; });
      if (!(await hasColumn('device_parts', 'offer_price'))) delete row.offer_price;
      if (!(await hasColumn('device_parts', 'is_new'))) delete row.is_new;
      const { data, error } = await supabase.from('device_parts').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return data;
    },
    remove: async (id) => {
      const { error } = await supabase.from('device_parts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      void touchCompanyUpdated();
      return { success: true };
    },
  },

  company: {
    get: async () => {
      const { data, error } = await supabase.from('company_settings').select('*').limit(1);
      if (error) throw new Error(error.message);
      return data && data[0] ? data[0] : null;
    },
    save: async (form, id) => {
      const row = pick(form, COMPANY_FIELDS);
      if (id) {
        const { data, error } = await supabase.from('company_settings').update(row).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
      const { data, error } = await supabase.from('company_settings').insert(row).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
  },

  upload: async (file) => {
    const extMatch = String(file.name || '').match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const path = `admin/${Date.now()}-${slugify(file.name)}.${ext}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  },
};
