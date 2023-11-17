import { defineStore } from 'pinia'
import { FrontendApiFactory, type FrontendApiInterface } from '../api-client/openapi-generator-cli/generated/api.js'
import ApiService from '@/services/ApiService'
import axiosApiInstance from '@/services/ApiService';

const frontendApi: FrontendApiInterface = FrontendApiFactory(undefined, '/', axiosApiInstance);

export const useAuthStore = defineStore({
  id: 'authStore',
  state: () => ({
    authInitialized: false as boolean,
    isAuthed: false as boolean
  }),
  actions: {
    login(returnUrl?: string) {
      const loginUrl = ApiService.getUri({ url: '/login', params: { redirectUrl: returnUrl } })
      window.location.href = loginUrl
    },
    logout() {
      const logoutUrl = ApiService.getUri({ url: '/logout' })
      window.location.href = logoutUrl
    },
    async initializeAuthStatus() {
      if (this.authInitialized) return
      await frontendApi.frontendControllerInfo();
      this.isAuthed = await ApiService.get('/logininfo', { validateStatus: null })
        .then((res) => res.status >= 200 && res.status < 400)
        .catch(() => false)

      this.authInitialized = true
    }
  }
})
