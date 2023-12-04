/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [vue(), vuetify(), basicSsl()],
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
  }
})
