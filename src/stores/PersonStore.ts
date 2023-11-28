import { defineStore, type Store, type StoreDefinition } from 'pinia'
import ApiService from '@/services/ApiService'
import { AxiosError } from 'axios'

export type Person = {
  person: {
    id: string
    name: {
      familienname: string
      vorname: string
    }
  }
}

type PersonState = {
  allPersons: Person[]
  errorCode: string
  loading: boolean
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
      loading: false
    }
  },
  actions: {
    async getAllPersons() {
      this.loading = true
      try {
        const { data }: { data: Person[] } = await ApiService.get('/personen')
        this.allPersons = data
        this.loading = false
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (error instanceof AxiosError) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
      }
    },

    async resetPassword(userId: string): Promise<string> {
      this.loading = true
      try {
        const { data }: { data: string } = await ApiService.patch(`/personen/${userId}/password`)
        this.loading = false
        return data
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (error instanceof AxiosError) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
        return this.errorCode
      }
    }
  }
})
