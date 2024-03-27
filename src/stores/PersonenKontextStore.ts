import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  DbiamPersonenuebersichtApiFactory,
  type DBiamCreatePersonenkontextBodyParams,
  type DbiamPersonenuebersichtApiInterface,
  type DBiamPersonenuebersichtResponse,
  type RawPagedResponse,
  type SystemrechtResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenuebersichtApi: DbiamPersonenuebersichtApiInterface = DbiamPersonenuebersichtApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

type PersonenkontextState = {
  currentPersonenuebersicht: DBiamPersonenuebersichtResponse | null;
  allUebersichte: Array<RawPagedResponse>; 
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  getAllPersonenuebersichte: () => Promise<void>;
};

export type { SystemrechtResponse, RawPagedResponse };
export type CreatedPersonenkontext = DBiamCreatePersonenkontextBodyParams;

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
      currentPersonenuebersicht: null,
      allUebersichte: [],
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async getPersonenuebersichtById(personId: string): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenuebersichtResponse } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichtenByPerson(personId);
        this.currentPersonenuebersicht = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      }
      this.loading = false;
    },
    async getAllPersonenuebersichte(): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: PagedResponse[] } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichten();
        this.allUebersichte = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      }
      this.loading = false;
    },
  },
});
