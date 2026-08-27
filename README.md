# Fixtop – iPhone Ersatzteil-Katalog

Öffentlicher Ersatzteil-Katalog (React + Vite + Tailwind) mit Admin-Bereich.
Daten und Authentifizierung laufen über Supabase — keine Base44-Abhängigkeit.

## Voraussetzungen

1. Node.js 18+ und npm (nur für Entwicklung/Build).
2. Supabase-Projekt mit den Tabellen `categories`, `devices`, `device_parts`,
   `parts`, `company_settings` sowie einem Storage-Bucket (Standard: `device-images`).

## Einrichtung

1. Abhängigkeiten installieren: `npm install`.
2. `.env.local` anlegen (Werte von deinem Supabase-Projekt):

```bash
VITE_SUPABASE_URL=https://api.fixtop.de
VITE_SUPABASE_ANON_KEY=dein_anon_public_key
```

`.env.local` ist in `.gitignore` ausgeschlossen. **Es wird kein Service-Role-Key
benötigt** — die App spricht direkt aus dem Browser mit Supabase.

3. RLS-Policies in Supabase anlegen (siehe Abschnitt „Supabase einrichten“),
   sonst bleibt der Katalog leer.

## Lokal starten

```bash
npm run dev
```

Öffne die von Vite gedruckte URL (Standard: http://localhost:5173).
Die App ist ein reines Static-Build — kein Server, kein Proxy.

## Auth (Supabase)

- Registrierung, Login (E-Mail/Passwort + Google), Passwort-Reset laufen über
  `supabase.auth` (`src/lib/supabaseClient.js`, `src/lib/AuthContext.jsx`).
- In den Supabase-Auth-Einstellungen müssen Site URL und Redirect URLs
  `http://localhost:5173` enthalten (für Bestätigungs-/Reset-Mails und OAuth).

## Skripte

| Befehl          | Zweck                          |
| --------------- | ------------------------------ |
| `npm run dev`   | Dev-Server                      |
| `npm run build` | Produktions-Build in `dist/`   |
| `npm run preview` | Vorschau des Builds          |
| `npm run lint`  | ESLint                         |
| `npm run typecheck` | TypeScript-Prüfung         |

## Supabase einrichten (RLS-Policies)

Die App liest den Katalog öffentlich (anon key) und schreibt über den
eingeloggten Nutzer (Supabase-Session). Die Policies sind **strikt**:
Jeder darf lesen, aber **schreiben dürfen nur Admins** (Eintrag in der
Tabelle `admin_users`). Das komplette, idempotente Skript liegt in
[`supabase-rls-strict.sql`](supabase-rls-strict.sql) — im Supabase
SQL Editor ausführen:

```sql
-- Kurzfassung (vollständiges Skript: supabase-rls-strict.sql)

-- 1) Admin-Tabelle + is_admin()-Funktion
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- 2) Öffentliches Lesen (Katalog)
create policy "public_read_devices" on public.devices for select using (true);
create policy "public_read_device_parts" on public.device_parts for select using (true);
create policy "public_read_parts" on public.parts for select using (true);
create policy "public_read_categories" on public.categories for select using (true);
create policy "public_read_company" on public.company_settings for select using (true);

-- 3) Schreiben NUR für Admins
drop policy if exists "auth_write_devices" on public.devices;
create policy "admin_write_devices" on public.devices
  for all to authenticated using (is_admin()) with check (is_admin());
-- … entsprechend für device_parts, parts, categories, company_settings

-- 4) Storage: lesen öffentlich, schreiben nur Admins
create policy "public_read_device_images" on storage.objects
  for select using (bucket_id = 'device-images');
drop policy if exists "auth_upload_device_images" on storage.objects;
create policy "admin_upload_device_images" on storage.objects
  for insert to authenticated with check (bucket_id = 'device-images' and is_admin());
```

**Nach dem Ausführen einmalig den eigenen Account zum Admin machen**
(danach kann kein anderer eingeloggter Nutzer mehr schreiben):

```sql
-- User-ID finden:
select id, email from auth.users order by created_at;

-- Admin eintragen (E-Mail einsetzen):
insert into public.admin_users (user_id)
select id from auth.users where email = 'deine-email@example.com';
```

**Verifikation** — alle aktiven Policies anzeigen:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

Hinweis: Der anon key ist öffentlich (steht im Build) — das ist normal.
Die Sicherheit kommt ausschließlich aus den RLS-Policies oben.

## Produktion / Deployment

Reines Static Hosting — kein Server nötig:

```bash
npm run build   # erzeugt dist/
```

`dist/` auf jede Static-Hosting-Plattform hochladen: Netlify, Vercel,
Cloudflare Pages, GitHub Pages, S3/CloudFront, eigener Nginx …
Für Client-Routing (React Router) einen SPA-Fallback auf `index.html`
einrichten (bei Netlify z. B. eine `_redirects`-Datei mit `/* /index.html 200`).

Die Auth-Redirect-URLs in Supabase müssen die Domain der App enthalten
(z. B. `https://meine-app.de` statt nur `http://localhost:5173`).
