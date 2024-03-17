import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  HatSystemrechtBodyParamsSystemRechtEnum,
  PersonenkontextApiFactory,
  PersonenkontexteApiFactory,
  type FindPersonenkontextRollenBodyParams,
  type FindPersonenkontextSchulstrukturknotenBodyParams,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  type HatSystemrechtBodyParams,
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
  hasSystemrecht: (
    personId: string,
    systemrecht: HatSystemrechtBodyParamsSystemRechtEnum,
  ) => Promise<SystemrechtResponse>;
  getPersonenkontextRolleWithFilter: (rolleName: string, limit: number) => void;
  getPersonenkontextAdministrationsebeneWithFilter: (rolleId: string, sskName: string, limit: number) => void;
};

export { HatSystemrechtBodyParamsSystemRechtEnum };
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
          await personenKontexteApi.personenkontextControllerHatSystemRecht(personId, createSystemrechtBodyParams);
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
        const findPersonenkontextRollenBodyParams: FindPersonenkontextRollenBodyParams = {
          rolleName: rolleName,
          limit: limit,
        };
        const { data }: { data: FindRollenResponse } =
          await personenKontextApi.dbiamPersonenkontextFilterControllerFindRollen(findPersonenkontextRollenBodyParams);
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
        const findPersonenkontextSSKBodyParams: FindPersonenkontextSchulstrukturknotenBodyParams = {
          rolleId: rolleId,
          sskName: sskName,
          limit: limit
        };
        const { data }: { data: FindSchulstrukturknotenResponse } =
          await personenKontextApi.dbiamPersonenkontextFilterControllerFindSchulstrukturknoten(
            findPersonenkontextSSKBodyParams,
          );
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
