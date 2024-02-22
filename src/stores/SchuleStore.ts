import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError } from 'axios'
import {
  CreateRolleBodyParamsRollenartEnum,
  CreateRolleBodyParamsMerkmaleEnum,
  RolleApiFactory,
  RolleResponseRollenartEnum,
  RolleResponseMerkmaleEnum,
  type CreateRolleBodyParams,
  type RolleApiInterface,
  type RolleResponse
} from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance)

type SchuleState = {
  createdSchule: RolleResponse | null
  errorCode: string
  loading: boolean
}

type SchuleGetters = {}
type SchuleActions = {
  createSchule: (
    dienstellennummer: string,
    schulname: string,
    administrativeSchulträger: CreateRolleBodyParamsRollenartEnum,
    merkmale: CreateRolleBodyParamsMerkmaleEnum[]
  ) => Promise<RolleResponse>
}

export { CreateRolleBodyParamsRollenartEnum }
export { CreateRolleBodyParamsMerkmaleEnum }
export { RolleResponseMerkmaleEnum }
export { RolleResponseRollenartEnum }

export type SchuleStore = Store<'schuleStore', SchuleState, SchuleGetters, SchuleActions>

export const useSchuleStore: StoreDefinition<
  'schuleStore',
  SchuleState,
  SchuleGetters,
  SchuleActions
> = defineStore({
  id: 'schuleStore',
  state: (): SchuleState => {
    return {
      createdSchule: null,
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async createSchule(
      rollenName: string,
      schulStrukturKnoten: string,
      rollenArt: CreateRolleBodyParamsRollenartEnum,
      merkmale: CreateRolleBodyParamsMerkmaleEnum[]
    ): Promise<RolleResponse> {
      this.loading = true
      try {
        // Construct the body params object
        const createRolleBodyParams: CreateRolleBodyParams = {
          name: rollenName,
          administeredBySchulstrukturknoten: schulStrukturKnoten,
          rollenart: rollenArt,
          // TODO Remove casting when generator issue is fixed from the server side
          merkmale: merkmale as unknown as Set<CreateRolleBodyParamsMerkmaleEnum>
        }
        const { data }: { data: RolleResponse } =
          await rolleApi.rolleControllerCreateRolle(createRolleBodyParams)
        this.loading = false
        this.createdRolle = data
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
