// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/schulportal-client/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/schulportal-client/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vuetify from "file:///C:/schulportal-client/node_modules/vite-plugin-vuetify/dist/index.mjs";
import basicSsl from "file:///C:/schulportal-client/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
import VueI18nPlugin from "file:///C:/schulportal-client/node_modules/@intlify/unplugin-vue-i18n/lib/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/schulportal-client/vite.config.ts";
var vite_config_default = defineConfig({
  build: {
    // Disable inlining of assets
    assetsInlineLimit: 0
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      },
      sass: {
        api: "modern-compiler"
      }
    }
  },
  define: {
    /* disable hydration mismatch details in production build */
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false"
  },
  plugins: [
    VueI18nPlugin({
      /* we have to enable jit compilation to use i18n interpolation without violating the CSP
         https://github.com/intlify/vue-i18n-next/issues/1059#issuecomment-1646097462 */
      jitCompilation: true
    }),
    vue(),
    vuetify({
      styles: {
        configFile: "src/styles/settings.scss"
      }
    }),
    basicSsl()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    port: 8099,
    proxy: {
      "/api": {
        target: "http://localhost:9090/",
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    }
  },
  test: {
    server: {
      deps: {
        inline: ["vuetify"]
      }
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.spec.ts"],
    setupFiles: "vitest.setup.ts",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      exclude: [
        "src/api-client/**",
        "src/plugins/**",
        "src/services/**",
        "src/specs/**",
        "src/router/**",
        "src/**/**.spec.ts",
        "src/App.vue",
        "src/main.ts"
      ],
      thresholds: {
        // TODO: reset thresholds to 100,
        // so our base coverage will be at 100% and exceptions are defined below
        "src/**/**.*": {
          statements: 70,
          functions: 70,
          branches: 70,
          lines: 70
        },
        // TODO: reset components threshold to 80 when thresholds can be reached
        "src/components/**/**.vue": {
          statements: 75,
          functions: 75,
          branches: 75,
          lines: 75
        },
        // TODO: reset thresholds to 80 and write tests for layouts
        // TODO: before we can increase the coverage threshold for layouts, we have to fix the broken layout that result from fixing the tests
        // for more info, see layout specs
        "src/layouts/**/**.vue": {
          statements: 0,
          functions: 0,
          branches: 80,
          lines: 0
        },
        // TODO: delete stores dir block from thresholds when first block is at 100
        "src/stores/**/**.ts": {
          statements: 100,
          functions: 100,
          // TODO: reset branches threshold to 100 when store error handler is implemented
          branches: 80,
          lines: 100
        },
        // TODO: reset thresholds to 80 and write tests for utils
        "src/utils/**/**.ts": {
          statements: 70,
          functions: 70,
          branches: 70,
          lines: 70
        },
        "src/views/**/**.vue": {
          // TODO: reset thresholds to 80 and write tests for views
          statements: 70,
          functions: 70,
          branches: 70,
          lines: 70
        }
      }
    }
  },
  preview: {
    port: 8099,
    proxy: {
      "/api": {
        target: "http://localhost:9090/",
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    },
    headers: {
      // Only for local development productive CSP is defined in nginx-vue.conf. Nonce is static, not safe for production.
      // This does not apply for 'npm run dev', but only to 'npm run preview'. CSP can not be applied for 'npm run dev', because it is missing the build step and thus has many inline JS/CSS
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; style-src 'self' 'nonce-CSPN0NCEPLAC3H0LDER'; font-src 'self'; img-src 'self' data:; frame-src 'self'; base-uri 'self'; object-src 'none';"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxzY2h1bHBvcnRhbC1jbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHNjaHVscG9ydGFsLWNsaWVudFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovc2NodWxwb3J0YWwtY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgdnVldGlmeSBmcm9tICd2aXRlLXBsdWdpbi12dWV0aWZ5JztcbmltcG9ydCBiYXNpY1NzbCBmcm9tICdAdml0ZWpzL3BsdWdpbi1iYXNpYy1zc2wnO1xuaW1wb3J0IFZ1ZUkxOG5QbHVnaW4gZnJvbSAnQGludGxpZnkvdW5wbHVnaW4tdnVlLWkxOG4vdml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgLy8gRGlzYWJsZSBpbmxpbmluZyBvZiBhc3NldHNcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogMCxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Nzczoge1xuICAgICAgICBhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxuICAgICAgfSxcbiAgICAgIHNhc3M6IHtcbiAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgLyogZGlzYWJsZSBoeWRyYXRpb24gbWlzbWF0Y2ggZGV0YWlscyBpbiBwcm9kdWN0aW9uIGJ1aWxkICovXG4gICAgX19WVUVfUFJPRF9IWURSQVRJT05fTUlTTUFUQ0hfREVUQUlMU19fOiAnZmFsc2UnLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgVnVlSTE4blBsdWdpbih7XG4gICAgICAvKiB3ZSBoYXZlIHRvIGVuYWJsZSBqaXQgY29tcGlsYXRpb24gdG8gdXNlIGkxOG4gaW50ZXJwb2xhdGlvbiB3aXRob3V0IHZpb2xhdGluZyB0aGUgQ1NQXG4gICAgICAgICBodHRwczovL2dpdGh1Yi5jb20vaW50bGlmeS92dWUtaTE4bi1uZXh0L2lzc3Vlcy8xMDU5I2lzc3VlY29tbWVudC0xNjQ2MDk3NDYyICovXG4gICAgICBqaXRDb21waWxhdGlvbjogdHJ1ZSxcbiAgICB9KSxcbiAgICB2dWUoKSxcbiAgICB2dWV0aWZ5KHtcbiAgICAgIHN0eWxlczoge1xuICAgICAgICBjb25maWdGaWxlOiAnc3JjL3N0eWxlcy9zZXR0aW5ncy5zY3NzJyxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgYmFzaWNTc2woKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA4MDk5LFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo5MDkwLycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgeGZ3ZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIHNlcnZlcjoge1xuICAgICAgZGVwczoge1xuICAgICAgICBpbmxpbmU6IFsndnVldGlmeSddLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgaW5jbHVkZTogWydzcmMvKiovKi5zcGVjLnRzJ10sXG4gICAgc2V0dXBGaWxlczogJ3ZpdGVzdC5zZXR1cC50cycsXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAnaXN0YW5idWwnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdsY292J10sXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKiddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnc3JjL2FwaS1jbGllbnQvKionLFxuICAgICAgICAnc3JjL3BsdWdpbnMvKionLFxuICAgICAgICAnc3JjL3NlcnZpY2VzLyoqJyxcbiAgICAgICAgJ3NyYy9zcGVjcy8qKicsXG4gICAgICAgICdzcmMvcm91dGVyLyoqJyxcbiAgICAgICAgJ3NyYy8qKi8qKi5zcGVjLnRzJyxcbiAgICAgICAgJ3NyYy9BcHAudnVlJyxcbiAgICAgICAgJ3NyYy9tYWluLnRzJyxcbiAgICAgIF0sXG4gICAgICB0aHJlc2hvbGRzOiB7XG4gICAgICAgIC8vIFRPRE86IHJlc2V0IHRocmVzaG9sZHMgdG8gMTAwLFxuICAgICAgICAvLyBzbyBvdXIgYmFzZSBjb3ZlcmFnZSB3aWxsIGJlIGF0IDEwMCUgYW5kIGV4Y2VwdGlvbnMgYXJlIGRlZmluZWQgYmVsb3dcbiAgICAgICAgJ3NyYy8qKi8qKi4qJzoge1xuICAgICAgICAgIHN0YXRlbWVudHM6IDcwLFxuICAgICAgICAgIGZ1bmN0aW9uczogNzAsXG4gICAgICAgICAgYnJhbmNoZXM6IDcwLFxuICAgICAgICAgIGxpbmVzOiA3MCxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVE9ETzogcmVzZXQgY29tcG9uZW50cyB0aHJlc2hvbGQgdG8gODAgd2hlbiB0aHJlc2hvbGRzIGNhbiBiZSByZWFjaGVkXG4gICAgICAgICdzcmMvY29tcG9uZW50cy8qKi8qKi52dWUnOiB7XG4gICAgICAgICAgc3RhdGVtZW50czogNzUsXG4gICAgICAgICAgZnVuY3Rpb25zOiA3NSxcbiAgICAgICAgICBicmFuY2hlczogNzUsXG4gICAgICAgICAgbGluZXM6IDc1LFxuICAgICAgICB9LFxuICAgICAgICAvLyBUT0RPOiByZXNldCB0aHJlc2hvbGRzIHRvIDgwIGFuZCB3cml0ZSB0ZXN0cyBmb3IgbGF5b3V0c1xuICAgICAgICAvLyBUT0RPOiBiZWZvcmUgd2UgY2FuIGluY3JlYXNlIHRoZSBjb3ZlcmFnZSB0aHJlc2hvbGQgZm9yIGxheW91dHMsIHdlIGhhdmUgdG8gZml4IHRoZSBicm9rZW4gbGF5b3V0IHRoYXQgcmVzdWx0IGZyb20gZml4aW5nIHRoZSB0ZXN0c1xuICAgICAgICAvLyBmb3IgbW9yZSBpbmZvLCBzZWUgbGF5b3V0IHNwZWNzXG4gICAgICAgICdzcmMvbGF5b3V0cy8qKi8qKi52dWUnOiB7XG4gICAgICAgICAgc3RhdGVtZW50czogMCxcbiAgICAgICAgICBmdW5jdGlvbnM6IDAsXG4gICAgICAgICAgYnJhbmNoZXM6IDgwLFxuICAgICAgICAgIGxpbmVzOiAwLFxuICAgICAgICB9LFxuICAgICAgICAvLyBUT0RPOiBkZWxldGUgc3RvcmVzIGRpciBibG9jayBmcm9tIHRocmVzaG9sZHMgd2hlbiBmaXJzdCBibG9jayBpcyBhdCAxMDBcbiAgICAgICAgJ3NyYy9zdG9yZXMvKiovKioudHMnOiB7XG4gICAgICAgICAgc3RhdGVtZW50czogMTAwLFxuICAgICAgICAgIGZ1bmN0aW9uczogMTAwLFxuICAgICAgICAgIC8vIFRPRE86IHJlc2V0IGJyYW5jaGVzIHRocmVzaG9sZCB0byAxMDAgd2hlbiBzdG9yZSBlcnJvciBoYW5kbGVyIGlzIGltcGxlbWVudGVkXG4gICAgICAgICAgYnJhbmNoZXM6IDgwLFxuICAgICAgICAgIGxpbmVzOiAxMDAsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRPRE86IHJlc2V0IHRocmVzaG9sZHMgdG8gODAgYW5kIHdyaXRlIHRlc3RzIGZvciB1dGlsc1xuICAgICAgICAnc3JjL3V0aWxzLyoqLyoqLnRzJzoge1xuICAgICAgICAgIHN0YXRlbWVudHM6IDcwLFxuICAgICAgICAgIGZ1bmN0aW9uczogNzAsXG4gICAgICAgICAgYnJhbmNoZXM6IDcwLFxuICAgICAgICAgIGxpbmVzOiA3MCxcbiAgICAgICAgfSxcbiAgICAgICAgJ3NyYy92aWV3cy8qKi8qKi52dWUnOiB7XG4gICAgICAgICAgLy8gVE9ETzogcmVzZXQgdGhyZXNob2xkcyB0byA4MCBhbmQgd3JpdGUgdGVzdHMgZm9yIHZpZXdzXG4gICAgICAgICAgc3RhdGVtZW50czogNzAsXG4gICAgICAgICAgZnVuY3Rpb25zOiA3MCxcbiAgICAgICAgICBicmFuY2hlczogNzAsXG4gICAgICAgICAgbGluZXM6IDcwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogODA5OSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6OTA5MC8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHhmd2Q6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgaGVhZGVyczoge1xuICAgICAgLy8gT25seSBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQgcHJvZHVjdGl2ZSBDU1AgaXMgZGVmaW5lZCBpbiBuZ2lueC12dWUuY29uZi4gTm9uY2UgaXMgc3RhdGljLCBub3Qgc2FmZSBmb3IgcHJvZHVjdGlvbi5cbiAgICAgIC8vIFRoaXMgZG9lcyBub3QgYXBwbHkgZm9yICducG0gcnVuIGRldicsIGJ1dCBvbmx5IHRvICducG0gcnVuIHByZXZpZXcnLiBDU1AgY2FuIG5vdCBiZSBhcHBsaWVkIGZvciAnbnBtIHJ1biBkZXYnLCBiZWNhdXNlIGl0IGlzIG1pc3NpbmcgdGhlIGJ1aWxkIHN0ZXAgYW5kIHRodXMgaGFzIG1hbnkgaW5saW5lIEpTL0NTU1xuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzpcbiAgICAgICAgXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICdub25jZS1DU1BOME5DRVBMQUMzSDBMREVSJzsgc3R5bGUtc3JjICdzZWxmJyAnbm9uY2UtQ1NQTjBOQ0VQTEFDM0gwTERFUic7IGZvbnQtc3JjICdzZWxmJzsgaW1nLXNyYyAnc2VsZicgZGF0YTo7IGZyYW1lLXNyYyAnc2VsZic7IGJhc2UtdXJpICdzZWxmJzsgb2JqZWN0LXNyYyAnbm9uZSc7XCIsXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZUFBZSxXQUFXO0FBQ25DLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGFBQWE7QUFDcEIsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sbUJBQW1CO0FBTjJILElBQU0sMkNBQTJDO0FBUXRNLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQTtBQUFBLElBRUwsbUJBQW1CO0FBQUEsRUFDckI7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILHFCQUFxQjtBQUFBLE1BQ25CLE1BQU07QUFBQSxRQUNKLEtBQUs7QUFBQSxNQUNQO0FBQUEsTUFDQSxNQUFNO0FBQUEsUUFDSixLQUFLO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLHlDQUF5QztBQUFBLEVBQzNDO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxjQUFjO0FBQUE7QUFBQTtBQUFBLE1BR1osZ0JBQWdCO0FBQUEsSUFDbEIsQ0FBQztBQUFBLElBQ0QsSUFBSTtBQUFBLElBQ0osUUFBUTtBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ04sWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxFQUNYO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLFFBQ0osUUFBUSxDQUFDLFNBQVM7QUFBQSxNQUNwQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFNBQVMsQ0FBQyxrQkFBa0I7QUFBQSxJQUM1QixZQUFZO0FBQUEsSUFDWixVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxNQUFNO0FBQUEsTUFDekIsU0FBUyxDQUFDLFFBQVE7QUFBQSxNQUNsQixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxZQUFZO0FBQUE7QUFBQTtBQUFBLFFBR1YsZUFBZTtBQUFBLFVBQ2IsWUFBWTtBQUFBLFVBQ1osV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFFBQ1Q7QUFBQTtBQUFBLFFBRUEsNEJBQTRCO0FBQUEsVUFDMUIsWUFBWTtBQUFBLFVBQ1osV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFFBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUlBLHlCQUF5QjtBQUFBLFVBQ3ZCLFlBQVk7QUFBQSxVQUNaLFdBQVc7QUFBQSxVQUNYLFVBQVU7QUFBQSxVQUNWLE9BQU87QUFBQSxRQUNUO0FBQUE7QUFBQSxRQUVBLHVCQUF1QjtBQUFBLFVBQ3JCLFlBQVk7QUFBQSxVQUNaLFdBQVc7QUFBQTtBQUFBLFVBRVgsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFFBQ1Q7QUFBQTtBQUFBLFFBRUEsc0JBQXNCO0FBQUEsVUFDcEIsWUFBWTtBQUFBLFVBQ1osV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBLHVCQUF1QjtBQUFBO0FBQUEsVUFFckIsWUFBWTtBQUFBLFVBQ1osV0FBVztBQUFBLFVBQ1gsVUFBVTtBQUFBLFVBQ1YsT0FBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBO0FBQUE7QUFBQSxNQUdQLDJCQUNFO0FBQUEsSUFDSjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
