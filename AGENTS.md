# AGENTS.md

## Project Context

Fixtop – iPhone Ersatzteil-Katalog: React 18 + Vite + Tailwind + shadcn/ui.
Daten und Auth laufen über Supabase. Keine Base44-Abhängigkeit.

## Key Files

- `src/lib/supabaseClient.js`: Supabase Browser-Client (anon-Key aus `.env.local`).
- `src/lib/AuthContext.jsx`: Auth-Provider (Session, Login, Logout).
- `src/lib/catalog-data.js`: Katalog-Datenzugriff (Browser → `/api/catalog`).
- `src/lib/admin-api.js`: Admin-Datenzugriff (Browser → `/api/admin/*`).
- `src/lib/supabase-catalog.js` / `supabase-admin-server.js`: serverseitige
  Supabase-Abfragen für die Vite-Proxys.
- `vite.config.js`: Vite-Konfiguration mit `/api/catalog`- und `/api/admin`-Proxys.
- `.env.local`: lokale Secrets (gitignored): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur serverseitig).

## Working Notes

- `npm run dev` startet den Dev-Server inkl. Proxys. Der Service-Role-Key wird
  ausschließlich serverseitig in den Proxys verwendet und darf nie in
  Frontend-Code oder Commits landen.
- Admin-Endpunkte prüfen das Supabase-Session-Token (`Bearer …`) gegen
  `/auth/v1/user`; ohne gültiges Token → 401.
- Felder in der Admin-API sind auf Whitelists beschränkt (siehe
  `supabase-admin-server.js`).
- Bei Auth-Flows (E-Mail-Bestätigung, Passwort-Reset, Google OAuth) müssen in
  den Supabase-Einstellungen die lokalen Redirect-URLs hinterlegt sein.
- Vor dem Abschließen von Änderungen `npm run build` (und ggf. `npm run lint`)
  ausführen.
