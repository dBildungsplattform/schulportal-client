import { defineStore } from 'pinia'
import ApiService from '@/services/ApiService'

type Provider = {
  id: number
  name: string
  url: string
}

type State = {
  allProviders: Provider[]
  errorCode: string
  loading: boolean
}

export const useProviderStore = defineStore({
  id: 'providerStore',
  state: (): State => {
    return {
      allProviders: [],
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async getAllProviders() {
      this.loading = true
      try {
        const { data } = await ApiService.get<Provider[]>('/provider')
        this.allProviders = data
        this.loading = false
      } catch (error: any) {
        this.errorCode = error.response.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    }
  }
})
