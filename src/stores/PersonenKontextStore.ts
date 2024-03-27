import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  DbiamPersonenuebersichtApiFactory,
  type DBiamCreatePersonenkontextBodyParams,
  type DbiamPersonenuebersichtApiInterface,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
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
export type Zuordnung = {
  sskId: string;
  rolleId: string;
  sskName: string;
  sskDstNr: string;
  rolle: string;
}

export type Uebersicht =
  | {
      personId: string;
      vorname: string;
      nachname: string;
      benutzername: string;
      zuordnungen: {
        sskId: string;
        rolleId: string;
        sskName: string;
        sskDstNr: string;
        rolle: string;
      }[];
    }
  | undefined;
type PersonenkontextState = {
  currentPersonenuebersicht: DBiamPersonenuebersichtResponse | null;
  allUebersichte: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response | null;
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  getAllPersonenuebersichte: () => Promise<void>;
};

export type { SystemrechtResponse, RawPagedResponse, DBiamPersonenuebersichtResponse };
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
      allUebersichte: null,
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
        const { data }: { data: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response } =
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
