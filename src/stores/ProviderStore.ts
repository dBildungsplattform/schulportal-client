import { defineStore } from 'pinia'
// import ApiService from '@/services/ApiService'

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
    async getAllProviders() {
      // this.allProviders = await ApiService().get('/providers')
      this.allProviders = [
        {
          id: 1,
          name: 'Spongebob',
          url: 'https://de.wikipedia.org/wiki/SpongeBob_Schwammkopf'
        },
        {
          id: 2,
          name: 'Futurama',
          url: 'https://de.wikipedia.org/wiki/Futurama'
        },
        {
          id: 3,
          name: 'Die Simpsons',
          url: 'https://de.wikipedia.org/wiki/Die_Simpsons'
        }
      ]
    }
  }
})
