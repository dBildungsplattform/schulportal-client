import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError } from 'axios'
import {
  FrontendApiFactory,
  type FrontendApiInterface,
  type FrontendControllerPersons200Response
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

type Personenkontext = {
  id: string
}

export type Personendatensatz = {
  person: Person
  personenkontexte: Array<Personenkontext>
}

type PersonState = {
  allPersons: Array<Personendatensatz>
  errorCode: string
  loading: boolean
  totalPersons: number
}

type PersonGetters = {}
type PersonActions = {
  getAllPersons: () => Promise<void>
  resetPassword: (userId: string) => Promise<string>
}

export type PersonStore = Store<'personStore', PersonState, PersonGetters, PersonActions>

export const usePersonStore: StoreDefinition<
  'personStore',
  PersonState,
  PersonGetters,
  PersonActions
> = defineStore({
  id: 'personStore',
  state: (): PersonState => {
    return {
      allPersons: [],
      errorCode: '',
      loading: false,
      totalPersons: 0
    }
  },
  actions: {
    async getAllPersons() {
      this.loading = true
      try {
        const { data }: { data: FrontendControllerPersons200Response } =
          await frontendApi.frontendControllerPersons()
        this.allPersons = data.items || []
        this.totalPersons = data.total
        this.loading = false
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
      }
    },

    async resetPassword(userId: string): Promise<string> {
      this.loading = true
      try {
        const { data }: { data: string } = await frontendApi.frontendControllerPasswordReset(userId)
        this.loading = false
        return data
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
        return Promise.reject(this.errorCode)
      }
    }
  }
})
