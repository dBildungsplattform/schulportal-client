import { config } from '@vue/test-utils';
import { I18n, createI18n } from 'vue-i18n';
import { createVuetify } from 'vuetify';
import { TestingPinia, createTestingPinia } from '@pinia/testing';
// MSW will probably be removed soon anyways
import de_locales from './src/locales/de-DE.json';

const i18n: I18n = createI18n({
  fallbackLocale: 'de',
  legacy: false,
  locale: 'de',
  messages: {
    de: de_locales,
  },
});

// eslint-disable-next-line @typescript-eslint/typedef
const vuetify = createVuetify({});

const pinia: TestingPinia = createTestingPinia();

config.global.plugins = [i18n, pinia, vuetify];
