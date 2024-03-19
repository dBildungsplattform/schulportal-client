import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  PersonenkontexteApiFactory,
  type PersonenkontexteApiInterface,
  type SystemrechtResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenKontextApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);

type PersonenkontextState = {
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
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
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async hasSystemrecht(personId: string, systemRecht: 'ROLLEN_VERWALTEN'): Promise<SystemrechtResponse> {
      this.loading = true;
      try {
        const { data }: { data: SystemrechtResponse } =
          await personenKontextApi.personenkontextControllerHatSystemRecht(personId, systemRecht);
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
  },
});
