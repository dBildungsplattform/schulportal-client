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
  type ServiceProviderResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance);

type RolleState = {
  createdRolle: Rolle | null;
  allRollen: Array<RolleResponse>;
  errorCode: string;
  loading: boolean;
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
  getAllRollen: () => Promise<void>;
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
      allRollen: [],
      errorCode: '',
      loading: false,
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
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
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
        this.loading = false;
        this.createdRolle = data;
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
        return Promise.reject(this.errorCode);
      }
    },

    async getAllRollen() {
      this.loading = true;
      try {
        const { data }: AxiosResponse<Array<RolleResponse>> = await rolleApi.rolleControllerFindRollen();
        this.allRollen = data;
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
