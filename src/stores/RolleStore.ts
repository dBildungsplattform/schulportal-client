import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  CreateRolleBodyParamsRollenartEnum,
  CreateRolleBodyParamsMerkmaleEnum,
  RolleApiFactory,
  RolleResponseRollenartEnum,
  RolleResponseMerkmaleEnum,
  type CreateRolleBodyParams,
  type RolleApiInterface,
  type RolleResponse,
  CreateRolleBodyParamsSystemrechteEnum,
  RolleResponseSystemrechteEnum,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance);

type RolleState = {
  createdRolle: RolleResponse | null;
  allRollen: Array<RolleResponse>;
  errorCode: string;
  loading: boolean;
};

type RolleGetters = {};
type RolleActions = {
  getAllRollen: () => Promise<void>;
  createRolle: (
    rollenName: string,
    schulStrukturKnoten: string,
    rollenArt: CreateRolleBodyParamsRollenartEnum,
    merkmale: CreateRolleBodyParamsMerkmaleEnum[],
    systemrechte: CreateRolleBodyParamsSystemrechteEnum[],
  ) => Promise<RolleResponse>;
};

export { CreateRolleBodyParamsRollenartEnum };
export { CreateRolleBodyParamsMerkmaleEnum };
export { RolleResponseMerkmaleEnum };
export { RolleResponseRollenartEnum };
export { RolleResponseSystemrechteEnum };
export type { RolleResponse };

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
    async createRolle(
      rollenName: string,
      schulStrukturKnoten: string,
      rollenArt: CreateRolleBodyParamsRollenartEnum,
      merkmale: CreateRolleBodyParamsMerkmaleEnum[],
      systemrechte: CreateRolleBodyParamsSystemrechteEnum[],
    ): Promise<RolleResponse> {
      this.loading = true;
      try {
        // Construct the body params object
        const createRolleBodyParams: CreateRolleBodyParams = {
          name: rollenName,
          administeredBySchulstrukturknoten: schulStrukturKnoten,
          rollenart: rollenArt,
          // TODO Remove casting when generator issue is fixed from the server side
          merkmale: merkmale as unknown as Set<CreateRolleBodyParamsMerkmaleEnum>,
          systemrechte: systemrechte as unknown as Set<CreateRolleBodyParamsSystemrechteEnum>,
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
