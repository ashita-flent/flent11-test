import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The "final" site — the polished, blurred-glass build.
 * Runs as its own server (port 5174) with `final/` as its root, fully
 * separate from the wireframe playground (root `index.html`, port 5173).
 * Sections are added here one at a time.
 */
export default defineConfig({
  root: 'final',
  plugins: [react()],
  server: { port: 5174 },
})
