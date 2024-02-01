import { createVuetify, type ThemeDefinition, type VuetifyOptions } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@/styles/main.scss'

// eslint-disable-next-line no-var
declare var cspNonce: string

const shTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6200EE',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
  }
}

const vuetifyConfig: VuetifyOptions = {
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    cspNonce,
    defaultTheme: 'shTheme',
    themes: {
      shTheme
    }
  }
}

export default createVuetify(vuetifyConfig)
