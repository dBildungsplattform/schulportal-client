/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import basicSsl from '@vitejs/plugin-basic-ssl'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [VueI18nPlugin({}), vue(), vuetify(), basicSsl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8099,
    proxy: {
      '/api': {
        target: 'http://localhost:9091/',
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    }
  },
  test: {
    server: {
      deps: {
        inline: ['vuetify']
      }
    },
    environment: 'jsdom',
    globals: true,
    include: ['**/*.spec.ts'],
    setupFiles: 'vitest.setup.ts',
    coverage: {
      reporter: ['text', 'lcov', 'html']
    }
  },
  preview: {
    port: 8099,
    proxy: {
      '/api': {
        target: 'http://localhost:9091/',
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    },
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; frame-src 'self';"
    }
  }
})
