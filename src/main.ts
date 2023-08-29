import { createApp } from 'vue'
import App from './App.vue'
import i18n from './plugins/i18n'
import router from './router'
import vuetify from './plugins/vuetify'

import './assets/main.css'

createApp(App)
  .use(i18n)
  .use(router)
  .use(vuetify)
  .mount('#app')
