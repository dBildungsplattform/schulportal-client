/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import basicSsl from '@vitejs/plugin-basic-ssl'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    VueI18nPlugin({
      /* we have to enable jit compilation to use i18n interpolation without violating the CSP
         https://github.com/intlify/vue-i18n-next/issues/1059#issuecomment-1646097462 */
      jitCompilation: true
    }),
    vue(),
    vuetify({
      styles: {
        configFile: 'src/styles/settings.scss'
      }
    }),
    basicSsl()
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
        target: 'http://localhost:9091/',
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    },
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
      // Only for local development productive CSP is defined in nginx-vue.conf. Nonce is static, not safe for production.
      // This does not apply for 'npm run dev', but only to 'npm run preview'. CSP can not be applied for 'npm run dev', because it is missing the build step and thus has many inline JS/CSS
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; style-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; font-src 'self'; img-src 'self'; frame-src 'self';"
    }
  }
})
