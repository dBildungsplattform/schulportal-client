import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError, type AxiosResponse } from 'axios'
import {
  PersonenApiFactory,
  PersonenFrontendApiFactory,
  type CreatePersonBodyParams,
  type PersonenApiInterface,
  type PersonendatensatzResponse,
  type PersonenFrontendApiInterface,
  type PersonFrontendControllerFindPersons200Response
} from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance)
const personenFrontendApi: PersonenFrontendApiInterface = PersonenFrontendApiFactory(
  undefined,
  '',
  axiosApiInstance
)

export type Person = {
  id: string
  name: {
    familienname: string
    vorname: string
  }
  referrer: string
}

export type CreatedPerson = CreatePersonBodyParams

type Personenkontext = {
  id: string
}

export type Personendatensatz = {
  person: Person
  personenkontexte: Array<Personenkontext>
}

type PersonState = {
  allPersons: Array<Personendatensatz>
  createdPerson: PersonendatensatzResponse | null
  errorCode: string
  loading: boolean
  totalPersons: number
  currentPerson: Personendatensatz | null
}

type PersonGetters = {}
type PersonActions = {
  createPerson: (person: CreatePersonBodyParams) => Promise<PersonendatensatzResponse>
  getAllPersons: () => Promise<void>
  getPersonById: (personId: string) => Promise<Personendatensatz>
  resetPassword: (personId: string) => Promise<string>
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
      createdPerson: null,
      errorCode: '',
      loading: false,
      totalPersons: 0,
      currentPerson: null
    }
  },
  actions: {
    async createPerson(person: CreatePersonBodyParams): Promise<PersonendatensatzResponse> {
      this.loading = true
      try {
        const { data }: { data: PersonendatensatzResponse } =
          await personenApi.personControllerCreatePerson(person)
        this.loading = false
        this.createdPerson = data
        return data
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
        return Promise.reject(this.errorCode)
      }
    },
    async getAllPersons() {
      this.loading = true
      try {
        const { data }: AxiosResponse<PersonFrontendControllerFindPersons200Response> =
          await personenFrontendApi.personFrontendControllerFindPersons()

        this.allPersons = data.items
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

    async getPersonById(personId: string): Promise<Personendatensatz> {
      this.loading = true
      try {
        const { data }: { data: Personendatensatz } =
          await personenApi.personControllerFindPersonById(personId)
        this.loading = false
        this.currentPerson = data
        return data
      } catch (error) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
        return Promise.reject(this.errorCode)
      }
    },

    async resetPassword(personId: string): Promise<string> {
      this.loading = true
      try {
        const { data }: { data: string } =
          await personenApi.personControllerResetPasswordByPersonId(personId)
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
