/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8099,
    proxy: {
      '/api': {
        target: 'http://localhost:9090/',
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    server: {
      deps: {
        inline: ['vuetify'],
      }
    },
    environment: 'jsdom',
    globals: true,
    include: ['**/specs/**/*.spec.ts'],
    setupFiles: 'vitest.setup.ts'
  }
})
