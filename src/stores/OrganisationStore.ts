import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError, type AxiosResponse } from 'axios'
import {
  OrganisationenApiFactory,
  OrganisationResponseTypEnum,
  type OrganisationenApiInterface,
  type OrganisationResponse
} from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const organisationApi: OrganisationenApiInterface = OrganisationenApiFactory(
  undefined,
  '',
  axiosApiInstance
)

export type Organisation = {
  id: string
  kennung: string
  name: string
  namensergaenzung: string
  kuerzel: string
  typ: OrganisationResponseTypEnum
}

type OrganisationState = {
  allOrganisationen: Array<OrganisationResponse>
  errorCode: string
  loading: boolean
}

type OrganisationGetters = {}
type OrganisationActions = {
  getAllOrganisationen: () => Promise<void>
}

export type OrganisationStore = Store<
  'organisationStore',
  OrganisationState,
  OrganisationGetters,
  OrganisationActions
>

export const useOrganisationStore: StoreDefinition<
  'organisationStore',
  OrganisationState,
  OrganisationGetters,
  OrganisationActions
> = defineStore({
  id: 'organisationStore',
  state: (): OrganisationState => {
    return {
      allOrganisationen: [],
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async getAllOrganisationen() {
      this.loading = true
      try {
        const { data }: AxiosResponse<OrganisationResponse[]> =
          await organisationApi.organisationControllerFindOrganizations()

        this.allOrganisationen = data
        this.loading = false
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR'
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR'
        }
        this.loading = false
      }
    }
  }
})
