import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  RolleApiFactory,
  RollenArt,
  RollenMerkmal,
  RollenSystemRecht,
  type CreateRolleBodyParams,
  type RolleApiInterface,
  type RolleResponse,
  type RolleServiceProviderQueryParams,
  type RolleWithServiceProvidersResponse,
  type ServiceProviderResponse,
  type UpdateRolleBodyParams,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance);

type RolleState = {
  createdRolle: Rolle | null;
  updatedRolle: RolleWithServiceProvidersResponse | null;
  currentRolle: Rolle | null;
  allRollen: Array<RolleResponse>;
  errorCode: string;
  loading: boolean;
  totalRollen: number;
};

type RolleGetters = {};
type RolleActions = {
  addServiceProviderToRolle: (
    rolleId: string,
    rolleServiceProviderQueryParams: RolleServiceProviderQueryParams,
  ) => Promise<void>;
  createRolle: (
    rollenName: string,
    administrationsebene: string,
    rollenArt: RollenArt,
    merkmale: RollenMerkmal[],
    systemrechte: RollenSystemRecht[],
  ) => Promise<RolleResponse>;
  getAllRollen: (searchString: string) => Promise<void>;
  getRolleById: (rolleId: string) => Promise<Rolle>;
  updateRolle: (
    rolleId: string,
    rollenName: string,
    merkmale: RollenMerkmal[],
    systemrechte: RollenSystemRecht[],
    serviceProviderIds: string[],
  ) => Promise<RolleWithServiceProvidersResponse>;
};

export { RollenArt };
export { RollenMerkmal };
export { RollenSystemRecht };
export type { RolleResponse };

export type Rolle = {
  administeredBySchulstrukturknoten: string;
  id: string;
  merkmale: Set<RollenMerkmal>;
  name: string;
  rollenart: RollenArt;
  systemrechte?: Set<RollenSystemRecht>;
  serviceProviders?: Array<ServiceProviderResponse>;
};

export type RolleStore = Store<'rolleStore', RolleState, RolleGetters, RolleActions>;

export const useRolleStore: StoreDefinition<'rolleStore', RolleState, RolleGetters, RolleActions> = defineStore({
  id: 'rolleStore',
  state: (): RolleState => {
    return {
      createdRolle: null,
      updatedRolle: null,
      currentRolle: null,
      allRollen: [],
      errorCode: '',
      loading: false,
      totalRollen: 0,
    };
  },
  actions: {
    async addServiceProviderToRolle(rolleId: string, rolleServiceProviderQueryParams: RolleServiceProviderQueryParams) {
      this.loading = true;
      try {
        const { data }: AxiosResponse<ServiceProviderResponse> = await rolleApi.rolleControllerAddServiceProviderById(
          rolleId,
          rolleServiceProviderQueryParams,
        );
        if (this.createdRolle) {
          this.createdRolle.serviceProviders = this.createdRolle.serviceProviders || [];
          this.createdRolle.serviceProviders.push(data);
        }
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async createRolle(
      rollenName: string,
      administrationsebene: string,
      rollenArt: RollenArt,
      merkmale: RollenMerkmal[],
      systemrechte: RollenSystemRecht[],
    ): Promise<RolleResponse> {
      this.loading = true;
      try {
        // Construct the body params object
        const createRolleBodyParams: CreateRolleBodyParams = {
          name: rollenName,
          administeredBySchulstrukturknoten: administrationsebene,
          rollenart: rollenArt,
          // TODO Remove casting when generator issue is fixed from the server side
          merkmale: merkmale as unknown as Set<RollenMerkmal>,
          systemrechte: systemrechte as unknown as Set<RollenSystemRecht>,
        };
        const { data }: { data: RolleResponse } = await rolleApi.rolleControllerCreateRolle(createRolleBodyParams);
        this.createdRolle = data;
        return data;
      } catch (error: unknown) {
        /* if an unknown error occurs, set to UNSPECIFIED */
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ROLLE_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },

    async getAllRollen(searchString: string = '') {
      this.loading = true;
      try {
        const response: AxiosResponse<Array<RolleResponse>> = await rolleApi.rolleControllerFindRollen(
          undefined,
          undefined,
          searchString,
        );
        this.allRollen = response.data;
        this.totalRollen = +response.headers['x-paging-total'];
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getRolleById(rolleId: string): Promise<RolleResponse> {
      this.loading = true;
      this.errorCode = '';
      try {
        const { data }: { data: RolleResponse } =
          await rolleApi.rolleControllerFindRolleByIdWithServiceProviders(rolleId);
        this.currentRolle = data;
        return data;
      } catch (error) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async updateRolle(
      rolleId: string,
      rollenName: string,
      merkmale: RollenMerkmal[],
      systemrechte: RollenSystemRecht[],
      serviceProviderIds: string[],
    ): Promise<RolleWithServiceProvidersResponse> {
      this.loading = true;
      this.errorCode = '';
      try {
        const updateRolleBodyParams: UpdateRolleBodyParams = {
          name: rollenName,
          merkmale: merkmale as unknown as Set<RollenMerkmal>,
          systemrechte: systemrechte as unknown as Set<RollenSystemRecht>,
          serviceProviderIds: serviceProviderIds as unknown as Set<string>,
        };
        const { data }: { data: RolleWithServiceProvidersResponse } = await rolleApi.rolleControllerUpdateRolle(
          rolleId,
          updateRolleBodyParams,
        );
        this.updatedRolle = data;
        return data;
      } catch (error) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ROLLE_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
  },
});
