import { config } from '@vue/test-utils'
import { I18n, createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'

const i18n: I18n = createI18n({})

// TODO: how to fix i18n warnings for not found messages?
// the following statement throws an error
// config.global.mocks.$t = (key: string) => key

// eslint-disable-next-line @typescript-eslint/typedef
const vuetify = createVuetify({})

config.global.plugins = [i18n, vuetify]
