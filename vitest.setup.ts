import { config } from '@vue/test-utils';
import { I18n, createI18n } from 'vue-i18n';
import { createVuetify } from 'vuetify';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { TestingPinia, createTestingPinia } from '@pinia/testing';
// MSW will probably be removed soon anyways
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { SetupServer, setupServer } from 'msw/node';
import requestHandlers from './src/specs/request-handlers';
import de_locales from './src/locales/de-DE.json';

const i18n: I18n = createI18n({
  fallbackLocale: 'de',
  legacy: false,
  locale: 'de',
  messages: {
    de: de_locales,
  },
});

// TODO: how to fix i18n warnings for not found messages?
// the following statement throws an error
// config.global.mocks.$t = (key: string) => key

// eslint-disable-next-line @typescript-eslint/typedef
const vuetify = createVuetify({});

const pinia: TestingPinia = createTestingPinia();

/* Setup mock server */
const server: SetupServer = setupServer(...requestHandlers);

/* Start mock server before all tests */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  // @ts-ignore:
  global.ResizeObserver = class ResizeObserver {
    public observe(): void {
      // do nothing
    }

    public unobserve(): void {
      // do nothing
    }

    public disconnect(): void {
      // do nothing
    }
  };
});

/* Close mock server after all tests */
afterAll(() => server.close());

/* Reset request handlers after each test => `important for test isolation` */
afterEach(() => server.resetHandlers());

config.global.plugins = [i18n, pinia, vuetify];
