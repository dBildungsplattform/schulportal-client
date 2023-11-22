import { defineStore, type Store, type StoreDefinition } from 'pinia'
import ApiService from '@/services/ApiService'
import type { AxiosResponse } from 'axios'

type AuthState = {
  authInitialized: boolean
  isAuthed: boolean
}

type AuthActions = {
  login: (returnUrl: string) => void
  logout: () => void
  initializeAuthStatus: () => Promise<void>
}

type AuthGetters = {}

export type AuthStore = Store<'authStore', AuthState, AuthGetters, AuthActions>

export const useAuthStore: StoreDefinition<'authStore', AuthState, AuthGetters, AuthActions> =
  defineStore({
    id: 'authStore',
    state: (): AuthState => ({
      authInitialized: false as boolean,
      isAuthed: false as boolean
    }),
    actions: {
      login(returnUrl?: string) {
        const loginUrl: string = ApiService.getUri({
          url: '/login',
          params: { redirectUrl: returnUrl }
        })
        window.location.href = loginUrl
      },
      logout() {
        const logoutUrl: string = ApiService.getUri({ url: '/logout' })
        window.location.href = logoutUrl
      },
      async initializeAuthStatus() {
        if (this.authInitialized) return

        this.isAuthed = await ApiService.get('/logininfo', { validateStatus: null })
          .then((res: AxiosResponse) => res.status >= 200 && res.status < 400)
          .catch(() => false)

        this.authInitialized = true
      }
    }
  })
