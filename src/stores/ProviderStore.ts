import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError } from 'axios'
import { ProviderApiFactory, type ProviderApiInterface } from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const providerApi: ProviderApiInterface = ProviderApiFactory(undefined, '', axiosApiInstance)

export type Provider = {
  id: string
  name: string
  url: string
}

type ProviderState = {
  allProviders: Provider[]
  errorCode: string
  loading: boolean
}

type ProviderGetters = {}
type ProviderActions = { getAllProviders: () => Promise<void> }

export type ProviderStore = Store<'providerStore', ProviderState, ProviderGetters, ProviderActions>

export const useProviderStore: StoreDefinition<
  'providerStore',
  ProviderState,
  ProviderGetters,
  ProviderActions
> = defineStore({
  id: 'providerStore',
  state: (): ProviderState => {
    return {
      allProviders: [],
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async getAllProviders() {
      this.loading = true
      try {
        const { data }: { data: Provider[] } =
          await providerApi.providerControllerGetServiceProvidersByPersonId()
        this.allProviders = data
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
