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
    include: ['src/**/*.spec.ts'],
    setupFiles: 'vitest.setup.ts',
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**'],
      exclude: [
        'src/api-client/**',
        'src/plugins/**',
        'src/services/**',
        'src/router/**',
        'src/App.vue',
        'src/main.ts'
      ],
      thresholds: {
        'src/stores/**.ts': {
          statements: 100,
          functions: 100,
          branches: 100,
          lines: 100
        },
        'src/components/**.vue': {
          statements: 80,
          functions: 80,
          branches: 80,
          lines: 80
        },
        'src/views/**.vue': {
          statements: 80,
          functions: 80,
          branches: 80,
          lines: 80
        }
      }
    }
  }
})
