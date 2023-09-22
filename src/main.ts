import { createApp } from 'vue'
import App from './App.vue'
import i18n from './plugins/i18n'
import router from './router'
import vuetify from './plugins/vuetify'
import pinia from './plugins/pinia'
import VueKeycloak from '@dsb-norge/vue-keycloak-js'
import Keycloak from "keycloak-js"
import { VueKeycloakInstance } from "@dsb-norge/vue-keycloak-js/dist/types"

import './assets/main.css'

const VueKeycloakOptions = {
  config: {
    realm: 'schulportal',
    url: 'http://localhost:8181/',
    clientId: 'schulportal'
  },
  init: {
    onLoad: 'login-required',
    flow: 'standard',
    pkceMethod: 'S256',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    checkLoginIframe: false,
    scope: 'openid email profile roles'
  },
  onReady (keycloak: Keycloak) {
    console.log('Keycloak ready', keycloak)
  }
}

createApp(App)
  .use(i18n)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(VueKeycloak, VueKeycloakOptions)
  .mount('#app')


/* Allow usage of this.$keycloak in components */
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties  {
    $keycloak: VueKeycloakInstance
  }
}