import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  DbiamPersonenkontexteApiFactory,
  PersonenApiFactory,
  PersonenFrontendApiFactory,
  type CreatePersonBodyParams,
  type DBiamCreatePersonenkontextBodyParams,
  type DbiamPersonenkontexteApiInterface,
  type DBiamPersonenkontextResponse,
  type PersonenApiInterface,
  type PersonendatensatzResponse,
  type PersonenFrontendApiInterface,
  type PersonFrontendControllerFindPersons200Response,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);
const personenFrontendApi: PersonenFrontendApiInterface = PersonenFrontendApiFactory(undefined, '', axiosApiInstance);
const personenKontexteApi: DbiamPersonenkontexteApiInterface = DbiamPersonenkontexteApiFactory(
  undefined,
  '',
  axiosApiInstance,
);

export type Person = {
  id: string;
  name: {
    familienname: string;
    vorname: string;
  };
  referrer: string | null;
  personalnummer?: string | null;
};

export type CreatedPerson = CreatePersonBodyParams;
export type CreatedPersonenkontext = DBiamCreatePersonenkontextBodyParams;

export type Personendatensatz = {
  person: Person;
};

export type { PersonendatensatzResponse };

type PersonState = {
  allPersons: Array<Personendatensatz>;
  createdPerson: PersonendatensatzResponse | null;
  createdPersonenkontext: DBiamPersonenkontextResponse | null;
  errorCode: string;
  loading: boolean;
  totalPersons: number;
  currentPerson: Personendatensatz | null;
};

type PersonGetters = {};
type PersonActions = {
  createPerson: (person: CreatePersonBodyParams) => Promise<PersonendatensatzResponse>;
  createPersonenkontext: (
    personenkontext: DBiamCreatePersonenkontextBodyParams,
  ) => Promise<DBiamPersonenkontextResponse>;
  getAllPersons: (searchFilter: string) => Promise<void>;
  getPersonById: (personId: string) => Promise<Personendatensatz>;
  resetPassword: (personId: string) => Promise<string>;
};

export type PersonStore = Store<'personStore', PersonState, PersonGetters, PersonActions>;

export const usePersonStore: StoreDefinition<'personStore', PersonState, PersonGetters, PersonActions> = defineStore({
  id: 'personStore',
  state: (): PersonState => {
    return {
      allPersons: [],
      createdPerson: null,
      createdPersonenkontext: null,
      errorCode: '',
      loading: false,
      totalPersons: 0,
      currentPerson: null,
    };
  },
  actions: {
    async createPerson(person: CreatePersonBodyParams): Promise<PersonendatensatzResponse> {
      this.loading = true;
      try {
        const { data }: { data: PersonendatensatzResponse } = await personenApi.personControllerCreatePerson(person);
        this.createdPerson = data;
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

    async getAllPersons(searchFilter: string) {
      this.loading = true;
      try {
        const { data }: AxiosResponse<PersonFrontendControllerFindPersons200Response> =
          await personenFrontendApi.personFrontendControllerFindPersons(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            searchFilter,
          );

        this.allPersons = data.items;
        this.totalPersons = data.total;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getPersonById(personId: string): Promise<Personendatensatz> {
      this.loading = true;
      this.errorCode = '';
      try {
        const { data }: { data: Personendatensatz } = await personenApi.personControllerFindPersonById(personId);
        this.currentPerson = data;
        return data;
      } catch (error) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(personId: string): Promise<string> {
      this.loading = true;
      try {
        const { data }: { data: string } = await personenApi.personControllerResetPasswordByPersonId(personId);
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
