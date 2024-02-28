import { defineStore, type Store, type StoreDefinition } from 'pinia'
import { isAxiosError } from 'axios'
import { ProviderApiFactory, type ProviderApiInterface } from '../api-client/generated/api'
import axiosApiInstance from '@/services/ApiService'

const serviceProviderApi: ProviderApiInterface = ProviderApiFactory(undefined, '', axiosApiInstance)

export type ServiceProvider = {
  id: string
  name: string
  url: string
}

type ServiceProviderState = {
  allServiceProviders: ServiceProvider[]
  errorCode: string
  loading: boolean
}

type ServiceProviderGetters = {}
type ServiceProviderActions = { getAllServiceProviders: () => Promise<void> }

export type ServiceProviderStore = Store<
  'serviceProviderStore',
  ServiceProviderState,
  ServiceProviderGetters,
  ServiceProviderActions
>

export const useServiceProviderStore: StoreDefinition<
  'serviceProviderStore',
  ServiceProviderState,
  ServiceProviderGetters,
  ServiceProviderActions
> = defineStore({
  id: 'serviceProviderStore',
  state: (): ServiceProviderState => {
    return {
      allServiceProviders: [],
      errorCode: '',
      loading: false
    }
  },
  actions: {
    async getAllServiceProviders() {
      this.loading = true
      try {
        const { data }: { data: ServiceProvider[] } =
          await serviceProviderApi.providerControllerGetServiceProvidersByPersonId()
        this.allServiceProviders = data
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
