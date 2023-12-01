import { defineStore } from 'pinia'
import {
  FrontendApiFactory,
  type FrontendApiInterface
} from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const frontendApi: FrontendApiInterface = FrontendApiFactory(undefined, '', axiosApiInstance)

type Person = {
  id: string
  name: {
    familienname: string
    vorname: string
  }
}

type State = {
  allPersons: Array<Person>
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
        const { data } = await frontendApi.frontendControllerPersons()
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
