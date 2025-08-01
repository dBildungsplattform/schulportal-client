import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import {
  PersonAdministrationApiFactory,
  PersonenkontextApiFactory,
  PersonenkontexteApiFactory,
  type DbiamCreatePersonenkontextBodyParams,
  type DbiamCreatePersonWithPersonenkontexteBodyParams,
  type DbiamPersonenkontextBodyParams,
  type DBiamPersonenkontextResponse,
  type DBiamPersonResponse,
  type DbiamUpdatePersonenkontexteBodyParams,
  type FindRollenResponse,
  type PersonAdministrationApiInterface,
  type PersonendatensatzResponse,
  type PersonenkontextApiInterface,
  type PersonenkontexteApiInterface,
  type PersonenkontexteUpdateResponse,
  type PersonenkontextWorkflowResponse,
  type SystemrechtResponse,
  RollenSystemRecht,
  LandesbediensteterApiFactory,
  type LandesbediensteterApiInterface,
  type LandesbediensteterWorkflowStepResponse,
  type LandesbediensteterWorkflowCommitBodyParams,
  type RolleResponse,
} from '../api-client/generated/api';
import { usePersonStore, type PersonStore } from './PersonStore';
import type { Zuordnung } from './types/Zuordnung';

const personenKontextApi: PersonenkontextApiInterface = PersonenkontextApiFactory(undefined, '', axiosApiInstance);
const personenKontexteApi: PersonenkontexteApiInterface = PersonenkontexteApiFactory(undefined, '', axiosApiInstance);
const personAdministrationApi: PersonAdministrationApiInterface = PersonAdministrationApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

const landesbediensteterApi: LandesbediensteterApiInterface = LandesbediensteterApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

export enum BefristungOption {
  SCHULJAHRESENDE = 'schuljahresende',
  UNBEFRISTET = 'unbefristet',
}

export enum PersonenKontextTyp {
  Organisation = 'ORGANISATION',
  Klasse = 'KLASSE',
}

export enum OperationContext {
  PERSON_ANLEGEN = 'PERSON_ANLEGEN',
  PERSON_BEARBEITEN = 'PERSON_BEARBEITEN',
}

export enum CreationType {
  Limited = 'limited',
  Full = 'full',
  AddPersonToOwnSchule = 'add-person-to-own-schule',
}

export type PersonenkontextUpdate = Pick<DbiamPersonenkontextBodyParams, 'organisationId' | 'rolleId' | 'befristung'>;

export type WorkflowFilter = {
  operationContext?: OperationContext;
  personId?: string;
  organisationId?: string;
  rollenIds?: string[];
  rolleName?: string;
  organisationName?: string;
  limit?: number;
  requestedWithSystemrecht?: RollenSystemRecht;
};

export function mapZuordnungToPersonenkontextUpdate(
  zuordnung: Pick<Zuordnung, 'sskId' | 'rolleId' | 'befristung'>,
): PersonenkontextUpdate {
  const befristung: string | undefined = zuordnung.befristung ?? undefined;
  return {
    organisationId: zuordnung.sskId,
    rolleId: zuordnung.rolleId,
    befristung,
  };
}

type PersonenkontextState = {
  updatedPersonenkontexte: PersonenkontexteUpdateResponse | null;
  workflowStepResponse: PersonenkontextWorkflowResponse | null;
  workflowStepLandesbediensteteResponse: LandesbediensteterWorkflowStepResponse | null;
  landesbediensteteCommitResponse: PersonenkontexteUpdateResponse | null;
  filteredRollen: FindRollenResponse | null;
  createdPersonWithKontext: DBiamPersonResponse | null;
  errorCode: string;
  loading: boolean;
  totalFilteredRollen: number;
  totalPaginatedRollen: number;
};

type PersonenkontextGetters = {};
type PersonenkontextActions = {
  hasSystemrecht: (personId: string, systemrecht: 'ROLLEN_VERWALTEN') => Promise<SystemrechtResponse>;
  processWorkflowStep: (filter: WorkflowFilter) => Promise<void>;
  processWorkflowStepLandesbedienstete: (filter: WorkflowFilter) => Promise<void>;
  commitLandesbediensteteKontext: (
    personId: string,
    updatedPersonenkontexte: PersonenkontextUpdate[] | undefined,
    personalnummer: string,
  ) => Promise<void>;
  getPersonenkontextRolleWithFilter: (rolleName: string, limit?: number) => Promise<void>;
  updatePersonenkontexte: (
    updatedPersonenkontexte: PersonenkontextUpdate[] | undefined,
    personId: string,
    personalnummer?: string,
  ) => Promise<void>;
  createPersonWithKontexte: (
    params: DbiamCreatePersonWithPersonenkontexteBodyParams,
  ) => Promise<PersonendatensatzResponse>;
};

export type {
  DbiamCreatePersonenkontextBodyParams,
  DbiamPersonenkontextBodyParams,
  DBiamPersonenkontextResponse,
  DbiamUpdatePersonenkontexteBodyParams,
  PersonenkontexteUpdateResponse,
  PersonenkontextWorkflowResponse,
  SystemrechtResponse,
  RolleResponse,
};

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
> = defineStore('personenkontextStore', {
  state: (): PersonenkontextState => {
    return {
      workflowStepResponse: null,
      workflowStepLandesbediensteteResponse: null,
      landesbediensteteCommitResponse: null,
      updatedPersonenkontexte: null,
      filteredRollen: null,
      createdPersonWithKontext: null,
      errorCode: '',
      loading: false,
      totalFilteredRollen: 0,
      totalPaginatedRollen: 0,
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
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },

    async processWorkflowStep(filter: WorkflowFilter): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: PersonenkontextWorkflowResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerProcessStep(
            filter.operationContext!,
            filter.personId,
            filter.organisationId,
            filter.rollenIds,
            filter.rolleName,
            filter.organisationName,
            filter.limit,
            filter.requestedWithSystemrecht,
          );
        this.workflowStepResponse = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async processWorkflowStepLandesbedienstete(filter: WorkflowFilter): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: PersonenkontextWorkflowResponse } =
          await landesbediensteterApi.landesbediensteterControllerStep(
            filter.organisationId,
            filter.rollenIds,
            filter.rolleName,
            filter.organisationName,
            filter.limit,
          );
        this.workflowStepResponse = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async commitLandesbediensteteKontext(
      personId: string,
      updatedPersonenkontexte: PersonenkontextUpdate[] | undefined,
      personalnummer: string,
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      this.loading = true;

      try {
        const body: LandesbediensteterWorkflowCommitBodyParams = {
          lastModified: personStore.personenuebersicht?.lastModifiedZuordnungen ?? undefined,
          personalnummer: personalnummer,
          count: personStore.personenuebersicht?.zuordnungen.length ?? 0,
          newPersonenkontexte:
            updatedPersonenkontexte?.map((personenkontextUpdate: PersonenkontextUpdate) => ({
              personId: personId,
              ...personenkontextUpdate,
            })) ?? [],
        };

        const { data }: { data: PersonenkontexteUpdateResponse } =
          await landesbediensteterApi.landesbediensteterControllerCommit(personId, body);

        this.landesbediensteteCommitResponse = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
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
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },

    async updatePersonenkontexte(
      updatedPersonenkontexte: PersonenkontextUpdate[] | undefined,
      personId: string,
      personalnummer?: string,
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      this.loading = true;
      this.errorCode = '';
      try {
        const updateParams: DbiamUpdatePersonenkontexteBodyParams = {
          lastModified: personStore.personenuebersicht?.lastModifiedZuordnungen ?? undefined,
          count: personStore.personenuebersicht?.zuordnungen.length ?? 0,
          personenkontexte:
            updatedPersonenkontexte?.map((personenkontextUpdate: PersonenkontextUpdate) => ({
              personId: personId,
              ...personenkontextUpdate,
            })) ?? [],
        };
        const { data }: { data: PersonenkontexteUpdateResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerCommit(personId, updateParams, personalnummer);
        this.updatedPersonenkontexte = data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'PERSONENKONTEXTE_UPDATE_ERROR');
      } finally {
        this.loading = false;
      }
    },

    async createPersonWithKontexte(
      params: DbiamCreatePersonWithPersonenkontexteBodyParams,
    ): Promise<DBiamPersonResponse> {
      this.loading = true;
      try {
        const { data }: { data: DBiamPersonResponse } =
          await personenKontextApi.dbiamPersonenkontextWorkflowControllerCreatePersonWithPersonenkontexte(params);
        this.createdPersonWithKontext = data;
        return data;
      } catch (error: unknown) {
        this.errorCode = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
  },
});
