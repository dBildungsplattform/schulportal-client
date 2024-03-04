import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
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
};

type ServiceProviderState = {
  allServiceProviders: ServiceProvider[];
  logoUrl: string | null;
  errorCode: string;
  loading: boolean;
};

type ServiceProviderGetters = {};
type ServiceProviderActions = {
  getAllServiceProviders: () => Promise<void>;
  getLogoByServiceProviderId: (angebotId: string) => Promise<void>;
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
      errorCode: '',
      logoUrl: null,
      loading: false,
    };
  },
  actions: {
    async getAllServiceProviders() {
      this.loading = true;
      try {
        const { data }: { data: ServiceProvider[] } =
          await serviceProviderApi.providerControllerGetServiceProvidersByPersonId();
        this.allServiceProviders = data;
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
      }
    },
    async getLogoByServiceProviderId(angebotId: string) {
      this.loading = true;
      try {
        const { data }: { data: Blob } = await serviceProviderApi.providerControllerGetServiceProviderLogo(angebotId);
        this.logoUrl = URL.createObjectURL(data);
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
      }
    },
  },
});
