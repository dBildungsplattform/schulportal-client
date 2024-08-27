import { createVuetify, type ThemeDefinition, type VuetifyOptions } from 'vuetify';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { useI18n } from 'vue-i18n';
import i18n from '@/plugins/i18n';
import '@mdi/font/css/materialdesignicons.css';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@/styles/main.scss';
import { VDateInput } from 'vuetify/lib/labs/components.mjs';

// eslint-disable-next-line no-var
declare var cspNonce: string;

const shTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#001e49',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#d4004b',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9825',
  },
};

const vuetifyConfig: VuetifyOptions = {
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    cspNonce,
    defaultTheme: 'shTheme',
    themes: {
      shTheme,
    },
  },
  components: {
    VDateInput,
  },
};

export default createVuetify(vuetifyConfig);
