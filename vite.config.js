import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

// https://vite.dev/config/
export default defineConfig({
  base: '/LogTech/',
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Aris - Copiloto Logístico Inteligente',
        short_name: 'Aris',
        description: 'Asistente de flota, seguridad y telemetría por voz.',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'aris-logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait'
      }
    })
  ],
})
