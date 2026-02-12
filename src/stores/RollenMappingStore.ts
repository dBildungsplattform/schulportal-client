import { defineStore, type Store, type StoreDefinition } from 'pinia';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { RollenMappingApiFactory, type RollenMappingApiInterface } from '../api-client/generated/api';
import type { AxiosResponse } from 'axios';

const rollenMappingApi: RollenMappingApiInterface = RollenMappingApiFactory(undefined, '', axiosApiInstance);

export type RollenMapping = {
  id: string;
  rolleId: string;
  serviceProviderId: string;
  mapToLmsRolle: string;
};

export type CreateRollenMappingBodyParams = {
  rolleId: string;
  serviceProviderId: string;
  mapToLmsRolle: string;
};

type RollenMappingState = {
  createdRollenMapping: RollenMapping | null;
  updatedRollenMapping: RollenMapping | null;
  allRollenMappings: Array<RollenMapping>;
  errorCode: string;
  loading: boolean;
  totalRollenMappings: number;
};

type RollenMappingGetters = {};
type RollenMappingActions = {
  createRollenMapping: (body: CreateRollenMappingBodyParams) => Promise<RollenMapping>;
  deleteRollenMappingById: (rollenMappingId: string) => Promise<void>;
  getAllRollenMappings: () => Promise<void>;
  getRollenMappingsForServiceProvider: (serviceProviderId: string) => Promise<void>;
  getMappingForRolleAndServiceProvider: (
    rolleId: string,
    serviceProviderId: string,
    mapToLmsRolle: string,
  ) => Promise<RollenMapping>;
  getRollenMappingById: (rollenMappingId: string) => Promise<RollenMapping>;
  updateRollenMapping: (rollenMappingId: string, mapToLmsRolle: string) => Promise<void>;
};

export type RollenMappingStore = Store<
  'rollenMappingStore',
  RollenMappingState,
  RollenMappingGetters,
  RollenMappingActions
>;

export const useRollenMappingStore: StoreDefinition<
  'rollenMappingStore',
  RollenMappingState,
  RollenMappingGetters,
  RollenMappingActions
> = defineStore('rollenMappingStore', {
  state: (): RollenMappingState => ({
    createdRollenMapping: null,
    updatedRollenMapping: null,
    allRollenMappings: [],
    errorCode: '',
    loading: false,
    totalRollenMappings: 0,
  }),
  actions: {
    async createRollenMapping(body: CreateRollenMappingBodyParams): Promise<RollenMapping> {
      this.loading = true;
      this.errorCode = '';
      try {
        const { rolleId, serviceProviderId, mapToLmsRolle }: CreateRollenMappingBodyParams = body;
        const response: AxiosResponse<RollenMapping> =
          (await rollenMappingApi.rollenMappingControllerCreateNewRollenMapping(
            serviceProviderId,
            rolleId,
            mapToLmsRolle,
          )) as AxiosResponse<RollenMapping>;
        const rollenMapping: RollenMapping = response.data;
        this.createdRollenMapping = rollenMapping;
        return rollenMapping;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_CREATE_ERROR');
        return await Promise.reject(new Error(this.errorCode));
      } finally {
        this.loading = false;
      }
    },

    async deleteRollenMappingById(rollenMappingId: string): Promise<void> {
      this.loading = true;
      this.errorCode = '';
      try {
        await rollenMappingApi.rollenMappingControllerDeleteExistingRollenMapping(rollenMappingId);
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_DELETE_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getAllRollenMappings(): Promise<void> {
      this.loading = true;
      this.errorCode = '';
      try {
        const response: AxiosResponse<RollenMapping[]> =
          (await rollenMappingApi.rollenMappingControllerGetAllAvailableRollenMapping()) as AxiosResponse<
            RollenMapping[]
          >;
        this.allRollenMappings = response.data;
        this.totalRollenMappings = response.data.length;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_LIST_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getRollenMappingsForServiceProvider(serviceProviderId: string): Promise<void> {
      this.loading = true;
      this.errorCode = '';
      try {
        const response: AxiosResponse<RollenMapping[]> =
          (await rollenMappingApi.rollenMappingControllerGetAvailableRollenMappingForServiceProvider(
            serviceProviderId,
          )) as AxiosResponse<RollenMapping[]>;
        this.allRollenMappings = response.data;
        this.totalRollenMappings = response.data.length;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_LIST_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async getMappingForRolleAndServiceProvider(
      rolleId: string,
      serviceProviderId: string,
      mapToLmsRolle: string,
    ): Promise<RollenMapping> {
      this.loading = true;
      this.errorCode = '';
      try {
        const response: AxiosResponse<RollenMapping> =
          (await rollenMappingApi.rollenMappingControllerGetMappingForRolleAndServiceProvider(
            rolleId,
            serviceProviderId,
            mapToLmsRolle,
          )) as AxiosResponse<RollenMapping>;
        const data: Partial<RollenMapping> = response.data;
        if (!data.id) {
          throw new Error('Invalid RollenMapping response: missing id');
        } else if (!data.rolleId) {
          throw new Error('Invalid RollenMapping response: missing rolleId');
        } else if (!data.serviceProviderId) {
          throw new Error('Invalid RollenMapping response: missing serviceProviderId');
        }
        const rollenMapping: RollenMapping = {
          id: data.id,
          rolleId: data.rolleId,
          serviceProviderId: data.serviceProviderId,
          mapToLmsRolle: data.mapToLmsRolle || '',
        };
        return rollenMapping;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_FETCH_ERROR');
        return await Promise.reject(new Error(this.errorCode));
      } finally {
        this.loading = false;
      }
    },

    async getRollenMappingById(rollenMappingId: string): Promise<RollenMapping> {
      this.loading = true;
      this.errorCode = '';
      try {
        const response: AxiosResponse<RollenMapping> =
          (await rollenMappingApi.rollenMappingControllerGetRollenMappingWithId(
            rollenMappingId,
          )) as AxiosResponse<RollenMapping>;
        const data: RollenMapping = response.data;
        return data;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_FETCH_ERROR');
        return await Promise.reject(new Error(this.errorCode));
      } finally {
        this.loading = false;
      }
    },

    async updateRollenMapping(rollenMappingId: string, mapToLmsRolle: string): Promise<void> {
      this.loading = true;
      this.errorCode = '';
      try {
        const response: AxiosResponse<RollenMapping> =
          (await rollenMappingApi.rollenMappingControllerUpdateExistingRollenMapping(
            rollenMappingId,
            mapToLmsRolle,
          )) as AxiosResponse<RollenMapping>;
        const data: RollenMapping = response.data;
        this.updatedRollenMapping = data;
      } catch (error) {
        this.errorCode = getResponseErrorCode(error, 'ROLLENMAPPING_UPDATE_ERROR');
      } finally {
        this.loading = false;
      }
    },
  },
});
