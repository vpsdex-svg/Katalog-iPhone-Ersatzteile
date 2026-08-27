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

Die App liest und schreibt direkt aus dem Browser. Dafür müssen die
RLS-Policies öffentliches Lesen des Katalogs und Schreiben für angemeldete
Nutzer erlauben. In Supabase → SQL Editor ausführen:

```sql
-- Öffentliches Lesen (Katalog)
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

-- Schreiben für angemeldete Nutzer (Admin-Bereich)
create policy "auth_write_devices" on public.devices
  for all to authenticated using (true) with check (true);
create policy "auth_write_device_parts" on public.device_parts
  for all to authenticated using (true) with check (true);
create policy "auth_write_parts" on public.parts
  for all to authenticated using (true) with check (true);
create policy "auth_write_categories" on public.categories
  for all to authenticated using (true) with check (true);
create policy "auth_write_company" on public.company_settings
  for all to authenticated using (true) with check (true);

-- Storage: öffentlich lesen, Upload nur für angemeldete Nutzer
create policy "public_read_device_images" on storage.objects
  for select using (bucket_id = 'device-images');
create policy "auth_upload_device_images" on storage.objects
  for insert to authenticated with check (bucket_id = 'device-images');
```

Falls Tabellen noch kein RLS haben, vorher aktivieren:
`alter table public.<tabelle> enable row level security;`

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
