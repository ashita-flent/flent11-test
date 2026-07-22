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
  build: {
    // Do NOT minify CSS. esbuild's CSS minifier drops the unprefixed
    // `backdrop-filter: blur(var(--frost))` (keeping only the -webkit-
    // one, which Chromium ignores), so every window frost / glass blur
    // silently vanished in the production build while working in dev.
    // JS is still minified; unminified CSS only costs a few KB gzip and
    // guarantees prod renders exactly like dev.
    cssMinify: false,
  },
})
