import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  HatSystemrechtBodyParamsSystemRechtEnum,
  PersonenkontexteApiFactory,
  type HatSystemrechtBodyParams,
  type OrganisationResponse,
  type PersonenkontexteApiInterface,
  type SystemrechtResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenKontextApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);

type PersonenkontextState = {
  systemrechtsAdministrationsebenen: Array<OrganisationResponse>;
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (
    personId: string,
    systemrecht: HatSystemrechtBodyParamsSystemRechtEnum,
  ) => Promise<SystemrechtResponse>;
};

export { HatSystemrechtBodyParamsSystemRechtEnum };

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
      systemrechtsAdministrationsebenen: [],
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async hasSystemrecht(
      personId: string,
      systemrecht: HatSystemrechtBodyParamsSystemRechtEnum,
    ): Promise<SystemrechtResponse> {
      this.loading = true;
      try {
        const createSystemrechtBodyParams: HatSystemrechtBodyParams = {
          systemRecht: systemrecht,
        };
        const { data }: { data: SystemrechtResponse } =
          await personenKontextApi.personenkontextControllerHatSystemRecht(personId, createSystemrechtBodyParams);
        this.systemrechtsAdministrationsebenen = data.ROLLEN_VERWALTEN;
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
