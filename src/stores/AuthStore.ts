import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { AuthApiFactory, type AuthApiInterface } from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

type AuthState = {
  isAuthed: boolean
}

type AuthActions = {
  initializeAuthStatus: () => Promise<void>
}

type AuthGetters = {}

export type AuthStore = Store<'authStore', AuthState, AuthGetters, AuthActions>

const authApi: AuthApiInterface = AuthApiFactory(undefined, '', axiosApiInstance)

export const useAuthStore: StoreDefinition<'authStore', AuthState, AuthGetters, AuthActions> =
  defineStore({
    id: 'authStore',
    state: (): AuthState => ({
      isAuthed: false as boolean
    }),
    actions: {
      async initializeAuthStatus() {
        try {
          const { status: loginStatus }: { status: number } =
            await authApi.authenticationControllerInfo({
              validateStatus: null
            })
          this.isAuthed = loginStatus >= 200 && loginStatus < 400
        } catch {
          this.isAuthed = false
        }
      }
    }
  })
