# AGENTS.md

## Project Context

Fixtop – iPhone Ersatzteil-Katalog: React 18 + Vite + Tailwind + shadcn/ui.
Daten und Auth laufen direkt über Supabase (supabase-js im Browser).
Keine Base44-Abhängigkeit, kein Server/Proxy.

## Key Files

- `src/lib/supabaseClient.js`: Supabase-Browser-Client (anon key aus `.env.local`).
- `src/lib/AuthContext.jsx`: Auth-Provider (Session, Login, Logout).
- `src/lib/catalog-data.js`: öffentlicher Katalog-Zugriff (direkt via Supabase,
  anon key + RLS).
- `src/lib/admin-api.js`: Admin-Zugriff (direkt via Supabase, eingeloggte
  Session + RLS).
- `src/lib/supabase-catalog.js`: gemeinsame Helfer (z. B. `sortIphonesNewest`).
- `vite.config.js`: reines Static-Build — keine Proxys, keine Secrets.
- `.env.local` (gitignored): nur `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`.

## Working Notes

- Der anon key ist in Supabase bewusst öffentlich (steht in jedem Build).
  Der Datenschutz kommt ausschließlich aus den RLS-Policies (öffentliches
  Lesen des Katalogs, Schreiben nur für `authenticated`).
- Es gibt keinen Service-Role-Key im Projekt — weder im Frontend noch im Build.
- Admin-Schreibzugriffe laufen mit der Session des eingeloggten Nutzers; die
  RLS-Policies entscheiden, was erlaubt ist.
- `.env.local` niemals committen; keine Secrets in Code oder Commits ablegen.
- Bei Auth-Flows (E-Mail-Bestätigung, Passwort-Reset, Google OAuth) müssen in
  den Supabase-Einstellungen die lokalen Redirect-URLs hinterlegt sein.
- Vor dem Abschließen von Änderungen `npm run build` (und ggf. `npm run lint`)
  ausführen.

## Base44-Entwicklungsumgebung (Sandbox)

- Start: `docker compose -f docker-compose.base44.yml up -d`, dann
  `curl http://localhost:3000/`.
- Ein einziger Service `web`: `node:22-bookworm-slim` mit Bind-Mount des Repos,
  `npm ci` beim Start (Dependencies liegen im Volume `fixtop_node_modules`),
  danach `vite --host 0.0.0.0 --port 3000` — also Live-Reload wie lokal.
- Kein Backend, keine lokale Datenbank: alle Daten kommen aus dem gehosteten
  Supabase-Projekt (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- `.env.base44-defaults` (committet) enthält nur Platzhalter, damit die App
  ohne Credentials startet; `/run/base44/app.env` (von der Plattform verwaltet)
  liefert die echten Werte und steht als letzter `env_file` — es gewinnt immer.
  Ohne echte Credentials lädt der Katalog leer und Login ist nicht möglich.
- Der anon key ist bewusst öffentlich; Admin-Rechte kommen allein aus den
  RLS-Policies (`supabase-rls-strict.sql`).
- Vorschau-Host: Vite ≥ 6.1 erlaubt ihn über
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (durchgereicht in der Compose-
  `environment:`-Sektion); `vite.config.js` bleibt unverändert.
  `BASE44_PREVIEW_MODE` wird nur durchgereicht, kein Code hängt davon ab.
- Lint/Tests laufen im Container, nicht auf dem Host:
  `docker compose -f docker-compose.base44.yml exec -T web npm run lint`.
- Bekannt (vorbestehend): `src/index.css` importiert die Google-Font nach den
  `@tailwind`-Anweisungen → PostCSS-Warnung. Die Schrift wird zusätzlich in
  `index.html` per `<link>` geladen, daher rein kosmetisch.
- Verifikation: `/` muss „IPHONE MODELLE (…)" mit Modellkarten zeigen,
  `/login` das Anmeldeformular.
