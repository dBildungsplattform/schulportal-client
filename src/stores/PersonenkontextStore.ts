import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  PersonenkontexteApiFactory,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  DbiamPersonenkontexteApiFactory,
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
  type PersonenkontexteUpdateResponse,
  type DbiamPersonenkontextBodyParams,
  type PersonenkontextWorkflowResponse,
  type DbiamCreatePersonWithContextBodyParams,
  type DBiamPersonResponse,
  type PersonendatensatzResponse,
  type PersonAdministrationApiInterface,
  PersonAdministrationApiFactory,
  RollenMerkmal,
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

const personAdministrationApi: PersonAdministrationApiInterface = PersonAdministrationApiFactory(
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
  editable: boolean;
  merkmale?: Array<RollenMerkmal>;
};

export type Uebersicht =
  | {
      personId: string;
      vorname: string;
      nachname: string;
      benutzername: string;
      lastModifiedZuordnungen: string | null;
      zuordnungen: {
        klasse?: string | undefined;
        sskId: string;
        rolleId: string;
        sskName: string;
        sskDstNr: string;
        rolle: string;
        administriertVon: string;
        typ: OrganisationsTyp;
        editable: boolean;
        merkmale?: Array<RollenMerkmal>;
      }[];
    }
  | undefined;

export type WorkflowFilter = {
  organisationId?: string;
  rolleId?: string;
  rolleName?: string;
  organisationName?: string;
  limit?: number;
};

type PersonenkontextState = {
  allUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response | null;
  updatedPersonenkontexte: PersonenkontexteUpdateResponse | null;
  workflowStepResponse: PersonenkontextWorkflowResponse | null;
  filteredRollen: FindRollenResponse | null;
  filteredOrganisationen: FindSchulstrukturknotenResponse | null;
  personenuebersicht: DBiamPersonenuebersichtResponse | null;
  createdPersonenkontextForOrganisation: DBiamPersonenkontextResponse | null;
  createdPersonenkontextForKlasse: DBiamPersonenkontextResponse | null;
  createdPersonWithKontext: DBiamPersonResponse | null;
  errorCode: string;
  loading: boolean;
  totalFilteredRollen: number;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
  processWorkflowStep: (filter?: WorkflowFilter) => Promise<PersonenkontextWorkflowResponse>;
  getPersonenkontextRolleWithFilter: (rolleName: string, limit?: number) => Promise<void>;
  getPersonenkontextAdministrationsebeneWithFilter: (rolleId: string, sskName: string, limit: number) => Promise<void>;
  updatePersonenkontexte: (combinedZuordnungen: Zuordnung[] | undefined, personId: string) => Promise<void>;
  createPersonenkontext: (
    personenkontext: DbiamPersonenkontextBodyParams,
    personenKontextTyp: PersonenKontextTyp,
  ) => Promise<DBiamPersonenkontextResponse>;
  getPersonenuebersichtById: (personId: string) => Promise<void>;
  getAllPersonenuebersichten: () => Promise<void>;
  createPersonWithKontext: (params: DbiamCreatePersonWithContextBodyParams) => Promise<PersonendatensatzResponse>;
};

export type {
  SystemrechtResponse,
  DbiamUpdatePersonenkontexteBodyParams,
  DbiamPersonenkontextBodyParams,
  PersonenkontextWorkflowResponse,
  PersonenkontexteUpdateResponse,
};
export type CreatedPersonenkontext = DbiamPersonenkontextBodyParams;
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
      workflowStepResponse: null,
      updatedPersonenkontexte: null,
      filteredRollen: null,
      filteredOrganisationen: null,
      personenuebersicht: null,
      createdPersonenkontextForOrganisation: null,
      createdPersonenkontextForKlasse: null,
      createdPersonWithKontext: null,
      errorCode: '',
      loading: false,
      totalFilteredRollen: 0,
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

    async processWorkflowStep(filter?: WorkflowFilter): Promise<PersonenkontextWorkflowResponse> {
      this.loading = true;
      try {
        const { data }: { data: PersonenkontextWorkflowResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerProcessStep(
            filter?.organisationId,
            filter?.rolleId,
            filter?.rolleName,
            filter?.organisationName,
            filter?.limit,
          );
        this.workflowStepResponse = data;
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

    async getPersonenkontextRolleWithFilter(rolleName: string, limit?: number) {
      this.loading = true;
      try {
        const { data }: { data: FindRollenResponse } =
          await personAdministrationApi.personAdministrationControllerFindRollen(rolleName, limit);
        this.filteredRollen = data;
        this.totalFilteredRollen = this.filteredRollen.total;
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
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerFindSchulstrukturknoten(
            rolleId,
            sskName,
            limit,
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

    async createPersonenkontext(
      personenkontext: DbiamPersonenkontextBodyParams,
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
    async updatePersonenkontexte(combinedZuordnungen: Zuordnung[] | undefined, personId: string): Promise<void> {
      this.loading = true;
      this.errorCode = '';
      try {
        const updateParams: DbiamUpdatePersonenkontexteBodyParams = {
          lastModified: this.personenuebersicht?.lastModifiedZuordnungen ?? undefined,
          count: this.personenuebersicht?.zuordnungen.length ?? 0,
          personenkontexte: combinedZuordnungen?.map((zuordnung: Zuordnung) => ({
            personId: personId,
            organisationId: zuordnung.sskId,
            rolleId: zuordnung.rolleId,
          })) as DbiamPersonenkontextBodyParams[],
        };
        const { data }: { data: PersonenkontexteUpdateResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerCommit(personId, updateParams);
        this.updatedPersonenkontexte = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'PERSONENKONTEXTE_UPDATE_ERROR';
        }
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
      } finally {
        this.loading = false;
      }
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
      } finally {
        this.loading = false;
      }
    },
    async createPersonWithKontext(params: DbiamCreatePersonWithContextBodyParams): Promise<DBiamPersonResponse> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerCreatePersonWithKontext(params);
        this.createdPersonWithKontext = data;
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
  },
});
