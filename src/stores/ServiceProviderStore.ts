import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { ProviderApiFactory, ServiceProviderKategorie, type ProviderApiInterface } from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const serviceProviderApi: ProviderApiInterface = ProviderApiFactory(undefined, '', axiosApiInstance);

export type ServiceProvider = {
  id: string;
  name: string;
  url: string;
  kategorie: string;
  hasLogo: boolean;
  logoUrl?: string;
  target: string;
  requires2fa: boolean;
};

export type ServiceProviderIdNameResponse = {
  id: string;
  name: string;
};

type ServiceProviderState = {
  allServiceProviders: ServiceProvider[];
  availableServiceProviders: ServiceProvider[];
  errorCode: string;
  loading: boolean;
};

type ServiceProviderGetters = {};
type ServiceProviderActions = {
  getAllServiceProviders: () => Promise<void>;
  getAvailableServiceProviders: () => Promise<void>;
};

export { ServiceProviderKategorie };

export type ServiceProviderStore = Store<
  'serviceProviderStore',
  ServiceProviderState,
  ServiceProviderGetters,
  ServiceProviderActions
>;

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
      availableServiceProviders: [],
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async getAllServiceProviders() {
      this.loading = true;
      try {
        const { data }: { data: ServiceProvider[] } =
          await serviceProviderApi.providerControllerGetAllServiceProviders();
        this.allServiceProviders = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getAvailableServiceProviders() {
      this.loading = true;
      try {
        const { data }: { data: ServiceProvider[] } =
          await serviceProviderApi.providerControllerGetAvailableServiceProviders();
        this.availableServiceProviders = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },
  },
});
