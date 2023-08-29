import { createI18n } from 'vue-i18n'
import * as deDE from '../locales/de-DE.json'

function loadLocaleMessages() {
  const messages = {
    "de": deDE
  }

  return messages
}

export default createI18n({
  fallbackLocale: 'de',
  locale: 'de',
  messages: loadLocaleMessages()
})