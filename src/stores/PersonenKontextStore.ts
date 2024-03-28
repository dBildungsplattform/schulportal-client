import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  DbiamPersonenkontexteApiFactory,
  DbiamPersonenuebersichtApiFactory,
  PersonenkontexteApiFactory,
  type DBiamCreatePersonenkontextBodyParams,
  type DbiamPersonenkontexteApiInterface,
  type DBiamPersonenkontextResponse,
  type DbiamPersonenuebersichtApiInterface,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type PersonenkontexteApiInterface,
  type SystemrechtResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenKontextApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);
const personenKontexteApi: DbiamPersonenkontexteApiInterface = DbiamPersonenkontexteApiFactory(
  undefined,
  '',
  axiosApiInstance,
);
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
};

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
  allUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response | null;
  personenuebersicht: DBiamPersonenuebersichtResponse | null;
  createdPersonenkontext: DBiamPersonenkontextResponse | null;
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
  createPersonenkontext: (
    personenkontext: DBiamCreatePersonenkontextBodyParams,
  ) => Promise<DBiamPersonenkontextResponse>;
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  getAllPersonenuebersichten: () => Promise<void>;
};

export type { SystemrechtResponse };
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
      allUebersichten: null,
      personenuebersicht: null,
      createdPersonenkontext: null,
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
    async createPersonenkontext(
      personenkontext: DBiamCreatePersonenkontextBodyParams,
    ): Promise<DBiamPersonenkontextResponse> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenkontextResponse } =
          await personenKontexteApi.dBiamPersonenkontextControllerCreatePersonenkontext(personenkontext);
        this.createdPersonenkontext = data;
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
    async getPersonenuebersichtById(personId: string): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenuebersichtResponse } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichtenByPerson(personId);
        this.personenuebersicht = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      }
      this.loading = false;
    },
    async getAllPersonenuebersichten(): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response } =
          await personenuebersichtApi.dBiamPersonenuebersichtControllerFindPersonenuebersichten();
        this.allUebersichten = data;
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