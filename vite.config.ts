/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import basicSsl from '@vitejs/plugin-basic-ssl';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';

export default defineConfig({
  build: {
    // Disable inlining of assets
    assetsInlineLimit: 0,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
      sass: {
        api: 'modern-compiler',
      },
    },
  },
  define: {
    /* disable hydration mismatch details in production build */
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  plugins: [
    VueI18nPlugin({
      /* we have to enable jit compilation to use i18n interpolation without violating the CSP
         https://github.com/intlify/vue-i18n-next/issues/1059#issuecomment-1646097462 */
      jitCompilation: true,
    }),
    vue(),
    vuetify({
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    basicSsl(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8099,
    proxy: {
      '/api': {
        target: 'http://localhost:9090/',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      },
    },
  },
  test: {
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: 'vitest.setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        'src/api-client/**',
        'src/plugins/**',
        'src/services/**',
        'src/specs/**',
        'src/router/**',
        'src/**/**.spec.ts',
        'src/App.vue',
        'src/main.ts',
      ],
      thresholds: {
        'src/**/**.*': {
          statements: 100,
          functions: 100,
          branches: 100,
          lines: 100,
        },
        'src/components/**/**.vue': {
          statements: 80,
          functions: 80,
          branches: 80,
          lines: 80,
        },
        // TODO: reset thresholds to 80 and write tests for layouts
        // TODO: before we can increase the coverage threshold for layouts, we have to fix the broken layout that result from fixing the tests
        // for more info, see layout specs
        'src/layouts/**/**.vue': {
          statements: 0,
          functions: 0,
          branches: 80,
          lines: 0,
        },
        // TODO: reset thresholds to 80 and write tests for utils
        // should we go for 100 here?
        'src/utils/**/**.ts': {
          statements: 80,
          functions: 80,
          branches: 80,
          lines: 80,
        },
        'src/views/**/**.vue': {
          statements: 80,
          functions: 80,
          branches: 80,
          lines: 80,
        },
      },
    },
  },
  preview: {
    port: 8099,
    proxy: {
      '/api': {
        target: 'http://localhost:9090/',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      },
    },
    headers: {
      // Only for local development productive CSP is defined in nginx-vue.conf. Nonce is static, not safe for production.
      // This does not apply for 'npm run dev', but only to 'npm run preview'. CSP can not be applied for 'npm run dev', because it is missing the build step and thus has many inline JS/CSS
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; style-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; font-src 'self'; img-src 'self' data:; frame-src 'self'; base-uri 'self'; object-src 'none';",
    },
  },
});
