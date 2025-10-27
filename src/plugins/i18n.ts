import { createI18n, type DefaultLocaleMessageSchema } from 'vue-i18n';
import * as deDE from '../locales/de-DE.json';
import vuetifyDeMessages from 'vuetify/lib/locale/de.mjs';

function loadLocaleMessages(): { [x: string]: DefaultLocaleMessageSchema } {
  const messages: { [x: string]: DefaultLocaleMessageSchema } = {
    de: { $vuetify: vuetifyDeMessages, ...deDE },
  };

  return messages;
}

export default createI18n({
  fallbackLocale: 'de',
  legacy: false,
  locale: 'de',
  messages: loadLocaleMessages(),
});
