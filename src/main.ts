import { createApp } from 'vue'
import App from './App.vue'
import i18n from './plugins/i18n'
import router from './router'
import vuetify from './plugins/vuetify'
import pinia from './plugins/pinia'

import './assets/main.css'

// prettier-ignore
createApp(App)
  .use(i18n)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .mount('#app')
