import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError } from 'axios'
import {
  CreateRolleBodyParamsMerkmaleEnum,
  CreateRolleBodyParamsRollenartEnum,
  RolleApiFactory,
  type CreateRolleBodyParams,
  type RolleApiInterface,
  type RolleResponse
} from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const roleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance)

export type Role = {
  schulStrukturKnoten: string
  rollenArt: string
  rollenName: string
  merkmale: Array<string>
}

type RoleState = {
  errorCode: string
  loading: boolean
}

type RoleGetters = {}
type RoleActions = {
  createRole: (
    rollenName: string,
    schulStrukturKnoten: string,
    rollenArt: keyof typeof CreateRolleBodyParamsRollenartEnum,
    merkmale: keyof typeof CreateRolleBodyParamsMerkmaleEnum
  ) => Promise<RolleResponse>
}

export type RoleStore = Store<'roleState', RoleState, RoleGetters, RoleActions>

export const useRoleStore: StoreDefinition<'roleStore', RoleState, RoleGetters, RoleActions> =
  defineStore({
    id: 'roleStore',
    state: (): RoleState => {
      return {
        errorCode: '',
        loading: false
      }
    },
    actions: {
      async createRole(
        rollenName: string,
        schulStrukturKnoten: string,
        rollenArt: keyof typeof CreateRolleBodyParamsRollenartEnum,
        merkmale: keyof typeof CreateRolleBodyParamsMerkmaleEnum
      ): Promise<RolleResponse> {
        this.loading = true
        try {
          const rollenArtValue: CreateRolleBodyParamsRollenartEnum =
            CreateRolleBodyParamsRollenartEnum[rollenArt]
          const merkmaleValue: CreateRolleBodyParamsMerkmaleEnum =
            CreateRolleBodyParamsMerkmaleEnum[merkmale]

          // Construct the body params object
          const createRolleBodyParams: CreateRolleBodyParams = {
            name: rollenName,
            administeredBySchulstrukturknoten: schulStrukturKnoten,
            rollenart: rollenArtValue,
            merkmale: merkmaleValue
          }
          const { data }: { data: RolleResponse } =
            await roleApi.rolleControllerCreateRolle(createRolleBodyParams)
          this.loading = false
          return data
        } catch (error) {
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
