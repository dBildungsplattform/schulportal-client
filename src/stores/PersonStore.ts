import { defineStore } from 'pinia'
import { FrontendApiFactory, type FrontendApiInterface } from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const frontendApi: FrontendApiInterface = FrontendApiFactory(undefined, '', axiosApiInstance)

type Person = {
  id: string
  name: {
    familienname: string
    vorname: string
  }
}

type Personenkontext = {
  id: string
}

type PersonenDatensatz = {
  person: Person
  personenkontexte: Array<Personenkontext>
}

type State = {
  allPersons: Array<PersonenDatensatz>
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
        const {
          data: { items }
        } = await frontendApi.frontendControllerPersons()
        this.allPersons = items
        this.loading = false
      } catch (error: any) {
        this.errorCode = error.response.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    },

    async resetPassword(userId: string) {
      this.loading = true
      try {
        const { data } = await frontendApi.frontendControllerPasswordReset(userId)
        this.loading = false
        return data
      } catch (error: any) {
        this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        this.loading = false
      }
    }
  }
})
