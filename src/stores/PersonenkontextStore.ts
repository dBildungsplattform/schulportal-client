import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  PersonenkontexteApiFactory,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  DbiamPersonenkontexteApiFactory,
  type DBiamCreatePersonenkontextBodyParams,
  type DbiamPersonenkontexteApiInterface,
  type DBiamPersonenkontextResponse,
  type DbiamPersonenuebersichtApiInterface,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type PersonenkontexteApiInterface,
  type SystemrechtResponse,
  PersonenkontextApiFactory,
  type PersonenkontextApiInterface,
  DbiamPersonenuebersichtApiFactory,
  OrganisationsTyp,
  type DbiamUpdatePersonenkontexteBodyParams,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenKontextApi: PersonenkontextApiInterface = PersonenkontextApiFactory(undefined, '', axiosApiInstance);
const personenKontexteApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);
const dbiamPersonenkontexteApi: DbiamPersonenkontexteApiInterface = DbiamPersonenkontexteApiFactory(
  undefined,
  '',
  axiosApiInstance,
);
const personenuebersichtApi: DbiamPersonenuebersichtApiInterface = DbiamPersonenuebersichtApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

export enum PersonenKontextTyp {
  Organisation = 'ORGANISATION',
  Klasse = 'KLASSE',
}

export type Zuordnung = {
  klasse?: string | undefined;
  sskId: string;
  rolleId: string;
  sskName: string;
  sskDstNr: string;
  rolle: string;
  administriertVon: string;
  typ: OrganisationsTyp;
};

export type Uebersicht =
  | {
      personId: string;
      vorname: string;
      nachname: string;
      benutzername: string;
      zuordnungen: {
        klasse?: string | undefined;
        sskId: string;
        rolleId: string;
        sskName: string;
        sskDstNr: string;
        rolle: string;
        administriertVon: string;
        typ: OrganisationsTyp;
      }[];
    }
  | undefined;

type PersonenkontextState = {
  allUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response | null;
  filteredRollen: FindRollenResponse | null;
  filteredOrganisationen: FindSchulstrukturknotenResponse | null;
  personenuebersicht: DBiamPersonenuebersichtResponse | null;
  createdPersonenkontextForOrganisation: DBiamPersonenkontextResponse | null;
  createdPersonenkontextForKlasse: DBiamPersonenkontextResponse | null;
  errorCode: string;
  loading: boolean;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
  getPersonenkontextRolleWithFilter: (rolleName: string, limit: number) => Promise<void>;
  getPersonenkontextAdministrationsebeneWithFilter: (rolleId: string, sskName: string, limit: number) => Promise<void>;
  updatePersonenkontexte: (
    personenkontexte: DbiamUpdatePersonenkontexteBodyParams,
    personId: string,
  ) => Promise<DBiamPersonenkontextResponse>;
  createPersonenkontext: (
    personenkontext: DBiamCreatePersonenkontextBodyParams,
    personenKontextTyp: PersonenKontextTyp,
  ) => Promise<DBiamPersonenkontextResponse>;
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  getAllPersonenuebersichten: () => Promise<void>;
};

export type { SystemrechtResponse };
export type CreatedPersonenkontext = DBiamCreatePersonenkontextBodyParams;
export type UserinfoPersonenkontext = {
  organisationsId: string;
  rolle: {
    systemrechte: string[];
    serviceProviderIds: string[];
  };
};

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
      filteredRollen: null,
      filteredOrganisationen: null,
      personenuebersicht: null,
      createdPersonenkontextForOrganisation: null,
      createdPersonenkontextForKlasse: null,
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async hasSystemrecht(personId: string, systemRecht: 'ROLLEN_VERWALTEN'): Promise<SystemrechtResponse> {
      this.loading = true;
      try {
        const { data }: { data: SystemrechtResponse } =
          await personenKontexteApi.personenkontextControllerHatSystemRecht(personId, systemRecht);
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
    async createPersonenkontext(
      personenkontext: DBiamCreatePersonenkontextBodyParams,
      personenKontextTyp: PersonenKontextTyp,
    ): Promise<DBiamPersonenkontextResponse> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenkontextResponse } =
          await dbiamPersonenkontexteApi.dBiamPersonenkontextControllerCreatePersonenkontext(personenkontext);
        switch (personenKontextTyp) {
          case PersonenKontextTyp.Klasse:
            this.createdPersonenkontextForKlasse = data;
            break;
          case PersonenKontextTyp.Organisation:
            this.createdPersonenkontextForOrganisation = data;
            break;
        }
        return data;
      } catch (error: unknown) {
        /* if an unknown error occurs, set to UNSPECIFIED */
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'PERSONENKONTEXT_SPECIFICATION_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async updatePersonenkontexte(
      personenkontexte: DbiamUpdatePersonenkontexteBodyParams,
      personId: string,
    ): Promise<DBiamPersonenkontextResponse> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonenkontextResponse } =
          await dbiamPersonenkontexteApi.dBiamPersonenkontextControllerUpdatePersonenkontexte(
            personId,
            personenkontexte,
          );
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'PERSONENKONTEXTE_UPDATE_ERROR';
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
