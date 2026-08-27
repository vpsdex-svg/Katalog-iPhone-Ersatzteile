-- ============================================================================
-- Fixtop Katalog — Strikte RLS-Policies
-- Nur Admins dürfen schreiben; jeder darf den Katalog lesen.
-- Ausführen im Supabase SQL Editor (als postgres). Kann gefahrlos
-- mehrfach ausgeführt werden (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Admin-Verwaltung
-- ---------------------------------------------------------------------------

-- Tabelle mit den Admin-User-IDs (verknüpft mit auth.users)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- is_admin(): prüft, ob der aktuelle Nutzer Admin ist.
-- SECURITY DEFINER, damit die Funktion selbst RLS umgehen kann (kein Zirkel).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Nur Admins dürfen die Admin-Liste einsehen
create policy "admin_users_admin_only" on public.admin_users
  for select to authenticated using (is_admin());

-- ---------------------------------------------------------------------------
-- 2) Öffentliches Lesen (Katalog) — gilt für alle Rollen
-- ---------------------------------------------------------------------------
create policy "public_read_devices" on public.devices
  for select using (true);
create policy "public_read_device_parts" on public.device_parts
  for select using (true);
create policy "public_read_parts" on public.parts
  for select using (true);
create policy "public_read_categories" on public.categories
  for select using (true);
create policy "public_read_company" on public.company_settings
  for select using (true);

-- ---------------------------------------------------------------------------
-- 3) Schreiben NUR für Admins (ersetzt die alten auth_write_*-Policies)
-- ---------------------------------------------------------------------------
drop policy if exists "auth_write_devices" on public.devices;
create policy "admin_write_devices" on public.devices
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "auth_write_device_parts" on public.device_parts;
create policy "admin_write_device_parts" on public.device_parts
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "auth_write_parts" on public.parts;
create policy "admin_write_parts" on public.parts
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "auth_write_categories" on public.categories;
create policy "admin_write_categories" on public.categories
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "auth_write_company" on public.company_settings;
create policy "admin_write_company" on public.company_settings
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 4) Storage (device-images): öffentlich lesen, schreiben nur Admins
-- ---------------------------------------------------------------------------
create policy "public_read_device_images" on storage.objects
  for select using (bucket_id = 'device-images');

drop policy if exists "auth_upload_device_images" on storage.objects;
create policy "admin_upload_device_images" on storage.objects
  for insert to authenticated with check (bucket_id = 'device-images' and is_admin());

create policy "admin_update_device_images" on storage.objects
  for update to authenticated using (bucket_id = 'device-images' and is_admin());

create policy "admin_delete_device_images" on storage.objects
  for delete to authenticated using (bucket_id = 'device-images' and is_admin());

-- ============================================================================
-- NACHDEM DU DIESES SKRIPT AUSGEFÜHRT HAST: EIGENEN ACCOUNT ZUM ADMIN MACHEN
-- ============================================================================
-- 1) User-ID suchen (E-Mail in der Liste finden):
--      select id, email from auth.users order by created_at;
--
-- 2) Admin eintragen (DEINE E-MAIL einsetzen):
--      insert into public.admin_users (user_id)
--      select id from auth.users where email = 'deine-email@example.com';
--
-- ---------------------------------------------------------------------------
-- Verifikation:
-- ---------------------------------------------------------------------------
-- Alle Policies anzeigen:
--      select tablename, policyname, cmd, roles, qual, with_check
--      from pg_policies
--      where schemaname = 'public'
--      order by tablename, cmd;
--
-- Admin-Liste:
--      select * from public.admin_users;
