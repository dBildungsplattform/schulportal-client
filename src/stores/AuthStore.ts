import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { FrontendApiFactory, type FrontendApiInterface } from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

type AuthState = {
  authInitialized: boolean
  isAuthed: boolean
}

type AuthActions = {
  initializeAuthStatus: () => Promise<void>
}

type AuthGetters = {}

export type AuthStore = Store<'authStore', AuthState, AuthGetters, AuthActions>

const frontendApi: FrontendApiInterface = FrontendApiFactory(undefined, '', axiosApiInstance)

export const useAuthStore: StoreDefinition<'authStore', AuthState, AuthGetters, AuthActions> =
  defineStore({
    id: 'authStore',
    state: (): AuthState => ({
      authInitialized: false as boolean,
      isAuthed: false as boolean
    }),
    actions: {
      async initializeAuthStatus() {
        if (this.authInitialized) return

        try {
          const { status: loginStatus }: { status: number } =
            await frontendApi.frontendControllerInfo({
              validateStatus: null
            })
          this.isAuthed = loginStatus >= 200 && loginStatus < 400
        } catch {
          this.isAuthed = false
        }

        this.authInitialized = true
      }
    }
  })
