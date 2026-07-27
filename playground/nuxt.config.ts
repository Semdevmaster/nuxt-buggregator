export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'nuxt-buggregator'],
  css: ['~/assets/css/main.css'],
  ui: {
    fonts: false,
  },
  future: {
    compatibilityVersion: 5,
  },

  // @nuxt/icon (via @nuxt/ui) still imports from `#imports` in server handlers.
  // With compatibilityVersion >= 5 Nitro auto-imports are off by default → wrong/missing `#imports`.
  // Module handlers import `readBody` from `#imports`; without this, h3@2 leaks in.
  experimental: {
    nitroAutoImports: true,
  },

  compatibilityDate: '2026-07-18',

  nitro: {
    preset: 'bun',
  },

  buggregator: {
    enabled: true,
    host: '127.0.0.1',
    port: 8000,
    scheme: 'http',
    project: 'default',
    maxDepth: 5,
  },
})
