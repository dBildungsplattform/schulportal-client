import { defineStore } from 'pinia'
import {
  FrontendApiFactory,
  type FrontendApiInterface
} from '../api-client/openapi-generator-cli/generated/api.js'
import axiosApiInstance from '@/services/ApiService'

const frontendApi: FrontendApiInterface = FrontendApiFactory(undefined, '', axiosApiInstance)

type State = {
  authInitialized: boolean
  isAuthed: boolean
}

export const useAuthStore = defineStore({
  id: 'authStore',
  state: (): State => {
    return {
      authInitialized: false,
      isAuthed: false
    }
  },
  actions: {
    async initializeAuthStatus() {
      if (this.authInitialized) return
      try {
        const loginInfoResponse = await frontendApi.frontendControllerInfo({ validateStatus: null })
        this.isAuthed = loginInfoResponse.status >= 200 && loginInfoResponse.status < 400
      } catch {
        this.isAuthed = false
      }

      this.authInitialized = true
    }
  }
})
