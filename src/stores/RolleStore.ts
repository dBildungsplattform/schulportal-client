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

type RolleState = {
  createdRolle: RolleResponse | null
  errorCode: string
  loading: boolean
}

type RolleGetters = {}
type RolleActions = {
  createRolle: (
    rollenName: string,
    schulStrukturKnoten: string,
    rollenArt: CreateRolleBodyParamsRollenartEnum,
    merkmale: Set<CreateRolleBodyParamsMerkmaleEnum>
  ) => Promise<RolleResponse>
}

export { CreateRolleBodyParamsRollenartEnum }
export { CreateRolleBodyParamsMerkmaleEnum }
export { RolleResponseMerkmaleEnum }
export { RolleResponseRollenartEnum }

export type RolleStore = Store<'rolleStore', RolleState, RolleGetters, RolleActions>

export const useRolleStore: StoreDefinition<'rolleStore', RolleState, RolleGetters, RolleActions> =
  defineStore({
    id: 'rolleStore',
    state: (): RolleState => {
      return {
        createdRolle: null,
        errorCode: '',
        loading: false
      }
    },
    actions: {
      async createRolle(
        rollenName: string,
        schulStrukturKnoten: string,
        rollenArt: CreateRolleBodyParamsRollenartEnum,
        merkmale: Set<CreateRolleBodyParamsMerkmaleEnum>
      ): Promise<RolleResponse> {
        this.loading = true
        try {
          // Construct the body params object
          const createRolleBodyParams: CreateRolleBodyParams = {
            name: rollenName,
            administeredBySchulstrukturknoten: schulStrukturKnoten,
            rollenart: rollenArt,
            merkmale: merkmale
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
