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
