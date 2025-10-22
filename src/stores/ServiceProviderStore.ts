import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { defineStore, type Store, type StoreDefinition } from 'pinia';

import {
  ProviderApiFactory,
  ServiceProviderKategorie,
  ServiceProviderMerkmal,
  type ManageableServiceProviderResponse,
  type ProviderApiInterface,
  type ProviderControllerGetManageableServiceProviders200Response,
} from '../api-client/generated/api';

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

export { ServiceProviderMerkmal };

export type ManageableServiceProvider = {};
export type ManageableServiceProviderListEntry = {
  id: string;
  kategorie: ServiceProviderKategorie;
  name: string;
  requires2fa: boolean;
  merkmale: Array<ServiceProviderMerkmal>;
  administrationsebene: { id: string; name: string; kennung?: string };
  rollen: Array<{ id: string; name: string }>;
  hasRollenerweiterung?: boolean;
  url?: string;
};

export type ServiceProviderIdNameResponse = {
  id: string;
  name: string;
};

type ServiceProviderState = {
  allServiceProviders: ServiceProvider[];
  availableServiceProviders: ServiceProvider[];
  manageableServiceProviders: ManageableServiceProviderListEntry[];
  totalManageableServiceProviders: number;
  currentServiceProvider: ManageableServiceProviderListEntry | null;
  currentServiceProviderLogo: string | null;
  errorCode: string;
  loading: boolean;
};

type ServiceProviderGetters = {};
type ServiceProviderActions = {
  getAllServiceProviders: () => Promise<void>;
  getAvailableServiceProviders: () => Promise<void>;
  getManageableServiceProviders: (page: number, entriesPerPage: number) => Promise<void>;
  getManageableServiceProviderById: (serviceProviderId: string) => Promise<void>;
  getServiceProviderLogoById: (serviceProviderId: string) => Promise<void>;
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
      manageableServiceProviders: [],
      totalManageableServiceProviders: 0,
      currentServiceProvider: null,
      currentServiceProviderLogo: null,
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

    async getManageableServiceProviders(page: number, entriesPerPage: number) {
      this.loading = true;
      try {
        const limit: number = entriesPerPage;
        const offset: number = (page - 1) * entriesPerPage;
        const response: ProviderControllerGetManageableServiceProviders200Response = (
          await serviceProviderApi.providerControllerGetManageableServiceProviders(offset, limit)
        ).data;
        const { items, total }: ProviderControllerGetManageableServiceProviders200Response = response;
        this.manageableServiceProviders = items;
        this.totalManageableServiceProviders = total;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getManageableServiceProviderById(serviceProviderId: string) {
      this.loading = true;
      try {
        const { data }: { data: ManageableServiceProviderResponse } =
          await serviceProviderApi.providerControllerGetManageableServiceProviderById(serviceProviderId);
        this.currentServiceProvider = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getServiceProviderLogoById(serviceProviderId: string) {
      this.loading = true;
      try {
        const response: { data: Blob } = await serviceProviderApi.providerControllerGetServiceProviderLogo(
          serviceProviderId,
          {
            responseType: 'blob',
          },
        );
        this.currentServiceProviderLogo = URL.createObjectURL(response.data);
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },
  },
});
