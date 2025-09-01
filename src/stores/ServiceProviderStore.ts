import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import {
  ProviderApiFactory,
  ServiceProviderKategorie,
  ServiceProviderSystem,
  ServiceProviderTarget,
  type ProviderApiInterface,
} from '../api-client/generated/api';
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

export type CreateServiceProviderParams = {
  name: string;
  target: ServiceProviderTarget;
  url: string;
  kategorie: ServiceProviderKategorie;
  providedOnSchulstrukturknoten: string;
  logo?: string;
  logoMimeType?: string;
  keycloakGroup?: string;
  keycloakRole?: string;
  externalSystem: ServiceProviderSystem;
  requires2fa: boolean;
  vidisAngebotId?: string;
};

export type UpdateServiceProviderParams = {
  name?: string;
  target?: ServiceProviderTarget;
  url?: string;
  kategorie?: ServiceProviderKategorie;
  providedOnSchulstrukturknoten?: string;
  logo?: string;
  logoMimeType?: string;
  keycloakGroup?: string;
  keycloakRole?: string;
  externalSystem?: ServiceProviderSystem;
  requires2fa?: boolean;
  vidisAngebotId?: string;
};

export type ServiceProviderIdNameResponse = {
  id: string;
  name: string;
};

type ServiceProviderState = {
  allServiceProviders: ServiceProvider[];
  availableServiceProviders: ServiceProvider[];
  createdServiceProvider: ServiceProvider | null;
  updatedServiceProvider: ServiceProvider | null;
  errorCode: string;
  loading: boolean;
};

type ServiceProviderGetters = {};
type ServiceProviderActions = {
  getAllServiceProviders: () => Promise<void>;
  getAvailableServiceProviders: () => Promise<void>;
  createNewServiceProvider: (params: CreateServiceProviderParams) => Promise<void>;
  updateServiceProvider: (providerId: string, params: UpdateServiceProviderParams) => Promise<void>;
  deleteServiceProvider: (providerId: string) => Promise<void>;
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
      createdServiceProvider: null,
      updatedServiceProvider: null,
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

    async createNewServiceProvider(params: CreateServiceProviderParams): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      this.createdServiceProvider = null;
      try {
        const { data }: { data: ServiceProvider } =
          await serviceProviderApi.providerControllerCreateNewServiceProvider(params);
        this.createdServiceProvider = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async updateServiceProvider(providerId: string, params: UpdateServiceProviderParams): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      this.updatedServiceProvider = null;

      try {
        const { data }: { data: ServiceProvider } = await serviceProviderApi.providerControllerUpdateServiceProvider(
          providerId,
          params,
        );
        this.updatedServiceProvider = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async deleteServiceProvider(providerId: string): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      try {
        await serviceProviderApi.providerControllerDeleteServiceProvider(providerId);
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },
  },
});
