import { defineStore } from 'pinia'
import ApiService from '@/services/ApiService'

type Provider = {
  id: number
  name: string
  url: string
}

export const useProviderStore = defineStore({
  id: 'providerStore',
  state: () => ({
    allProviders: [] as Provider[],
    errorCode: '' as string,
    loading: false as boolean
  }),
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
