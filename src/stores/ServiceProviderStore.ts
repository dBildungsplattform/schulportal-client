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
  type RollenerweiterungForServiceProviderResponse,
} from '../api-client/generated/api';

const serviceProviderApi: ProviderApiInterface = ProviderApiFactory(undefined, '', axiosApiInstance);

export type BaseServiceProvider = {
  id: string;
  name: string;
  kategorie: ServiceProviderKategorie;
  requires2fa: boolean;
};

export type StartPageServiceProvider = BaseServiceProvider & {
  url: string;
  hasLogo: boolean;
  target: string;
  // Could be undefined if the logo is not provided by the backend
  logoUrl?: string;
};

export type ManageableServiceProviderListEntry = BaseServiceProvider & {
  merkmale: Array<ServiceProviderMerkmal>;
  administrationsebene: { id: string; name: string; kennung?: string };
  rollen: Array<{ id: string; name: string }>;
  hasRollenerweiterung: boolean;
};

export type ManageableServiceProviderDetail = ManageableServiceProviderListEntry & {
  url: string;
  rollenerweiterungen: Array<RollenerweiterungForServiceProviderResponse>;
};

export { ServiceProviderMerkmal };

export type ManageableServiceProvider = {};

export type ServiceProviderIdNameResponse = {
  id: string;
  name: string;
};

type ServiceProviderState = {
  allServiceProviders: StartPageServiceProvider[];
  availableServiceProviders: StartPageServiceProvider[];
  manageableServiceProviders: ManageableServiceProviderListEntry[];
  totalManageableServiceProviders: number;
  currentServiceProvider: ManageableServiceProviderDetail | null;
  serviceProviderLogos: Map<string, string>;
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
      serviceProviderLogos: new Map<string, string>(),
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async getAllServiceProviders() {
      this.loading = true;
      try {
        const { data }: { data: StartPageServiceProvider[] } =
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
        const { data }: { data: StartPageServiceProvider[] } =
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
        this.currentServiceProvider = {
          ...data,
          hasRollenerweiterung: data.rollenerweiterungen.length > 0,
        };
      } catch (error) {
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
          { responseType: 'blob' },
        );

        // Convert Blob to base64 string - wrapped in a promise for async/await usage
        const logoUrl: string = await new Promise<string>(
          (resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: unknown) => void) => {
            const reader: FileReader = new FileReader();
            reader.onload = (): void => {
              resolve(reader.result as string);
            };
            reader.onerror = (): void => {
              reject(new Error('Failed to read blob'));
            };
            reader.readAsDataURL(response.data);
          },
        );

        this.serviceProviderLogos.set(serviceProviderId, logoUrl);
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },
  },
});
