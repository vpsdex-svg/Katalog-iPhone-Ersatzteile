import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Reines Static-Build. Die App spricht direkt mit Supabase (supabase-js,
// anon key + Session) — kein Server, kein Proxy, kein Service-Role-Key.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
