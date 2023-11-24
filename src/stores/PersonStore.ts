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

type State = {
  allPersons: Person[]
  errorCode: string
  loading: boolean
}

export const usePersonStore = defineStore({
  id: 'personStore',
  state: (): State => {
    return {
      allPersons: [],
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async getAllPersons() {
      this.loading = true
      try {
        const { data } = await ApiService.get('/personen')
        this.allPersons = data
        this.loading = false
      } catch (error: any) {
        this.errorCode = error.response.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    },

    async resetPassword(userId: string) {
      this.loading = true
      try {
        const { data } = await ApiService.patch(`/personen/${userId}/password`)
        this.loading = false
        return data
      } catch (error: any) {
        this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    }
  }
})
