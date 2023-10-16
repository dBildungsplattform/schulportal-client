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
    allProviders: [] as Provider[]
  }),
  actions: {
    async getAllProviders(personId: string) {
      ApiService()
        .get('/provider', { params: { personId } })
        .then((response) => {
          this.allProviders = response.data
        })
    }
  }
})
