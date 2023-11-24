import { defineStore } from 'pinia'
import ApiService from '@/services/ApiService'

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

      this.isAuthed = await ApiService.get('/logininfo', { validateStatus: null })
        .then((res) => res.status >= 200 && res.status < 400)
        .catch(() => false)

      this.authInitialized = true
    }
  }
})
