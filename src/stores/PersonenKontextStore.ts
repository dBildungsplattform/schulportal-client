import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  PersonenkontextApiFactory,
  PersonenkontexteApiFactory,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  type PersonenkontextApiInterface,
  type PersonenkontexteApiInterface,
  type SystemrechtResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenKontexteApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);
const personenKontextApi: PersonenkontextApiInterface = PersonenkontextApiFactory(undefined, '', axiosApiInstance);

type PersonenkontextState = {
  filteredRollen: FindRollenResponse | null;
  filteredOrganisationen: FindSchulstrukturknotenResponse | null;
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
  getPersonenkontextRolleWithFilter: (rolleName: string, limit: number) => Promise<void>;
  getPersonenkontextAdministrationsebeneWithFilter: (rolleId: string, sskName: string, limit: number) => Promise<void>;
};

export type { SystemrechtResponse };

export type PersonenkontextStore = Store<
  'personenkontextStore',
  PersonenkontextState,
  PersonenkontextGetters,
  PersonenkontextActions
>;

export const usePersonenkontextStore: StoreDefinition<
  'personenkontextStore',
  PersonenkontextState,
  PersonenkontextGetters,
  PersonenkontextActions
> = defineStore({
  id: 'personenkontextStore',
  state: (): PersonenkontextState => {
    return {
      filteredRollen: null,
      filteredOrganisationen: null,
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async hasSystemrecht(personId: string, systemrecht: 'ROLLEN_VERWALTEN'): Promise<SystemrechtResponse> {
      this.loading = true;
      try {
        const { data }: { data: SystemrechtResponse } =
          await personenKontexteApi.personenkontextControllerHatSystemRecht(personId, systemrecht);
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async getPersonenkontextRolleWithFilter(rolleName: string, limit: number) {
      this.loading = true;
      try {
        const { data }: { data: FindRollenResponse } =
          await personenKontextApi.dbiamPersonenkontextFilterControllerFindRollen(rolleName, limit);
        this.filteredRollen = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async getPersonenkontextAdministrationsebeneWithFilter(rolleId: string, sskName: string, limit: number) {
      this.loading = true;
      try {
        const { data }: { data: FindSchulstrukturknotenResponse } =
          await personenKontextApi.dbiamPersonenkontextFilterControllerFindSchulstrukturknoten(rolleId, sskName, limit);
        this.filteredOrganisationen = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
  },
});
