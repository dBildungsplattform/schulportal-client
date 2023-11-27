import { createI18n, type DefaultLocaleMessageSchema } from 'vue-i18n'
import * as deDE from '../locales/de-DE.json'

function loadLocaleMessages(): { [x: string]: DefaultLocaleMessageSchema } {
  const messages: { [x: string]: DefaultLocaleMessageSchema } = {
    de: deDE
  }

  return messages
}

export default createI18n({
  fallbackLocale: 'de',
  legacy: false,
  locale: 'de',
  messages: loadLocaleMessages()
})
