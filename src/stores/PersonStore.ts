import { defineStore } from 'pinia'
import ApiService from '@/services/ApiService'

type Person = {
  person: {
    id: string
    name: {
      familienname: string
      vorname: string
    }
  }
}

export const usePersonStore = defineStore({
  id: 'personStore',
  state: () => ({
    allPersons: [] as Person[],
    errorCode: '' as string,
    loading: false as boolean
  }),
  actions: {
    async getAllPersons() {
      this.loading = true
      try {
        const { data } = await ApiService.get('/person')
        this.allPersons = data
        this.loading = false
      } catch (error: any) {
        this.errorCode = error.response.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    }
  }
})
