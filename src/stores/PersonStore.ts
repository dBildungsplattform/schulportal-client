import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  Class2FAApiFactory,
  PersonenApiFactory,
  PersonenFrontendApiFactory,
  type Class2FAApiInterface,
  type DbiamCreatePersonWithContextBodyParams,
  type PersonenApiInterface,
  type PersonendatensatzResponse,
  type PersonenFrontendApiInterface,
  type PersonFrontendControllerFindPersons200Response,
  type TokenInitBodyParams,
  type TokenStateResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import { type DbiamPersonenkontextBodyParams } from './PersonenkontextStore';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);
const personenFrontendApi: PersonenFrontendApiInterface = PersonenFrontendApiFactory(undefined, '', axiosApiInstance);

const twoFactorApi: Class2FAApiInterface = Class2FAApiFactory(undefined, '', axiosApiInstance);

export type Person = {
  id: string;
  name: {
    familienname: string;
    vorname: string;
  };
  referrer: string | null;
  personalnummer?: string | null;
};

export type CreatePersonBodyParams = DbiamCreatePersonWithContextBodyParams;
export type CreatedPersonenkontext = DbiamPersonenkontextBodyParams;

export type Personendatensatz = {
  person: Person;
};

export type { PersonendatensatzResponse };

type PersonState = {
  allPersons: Array<Personendatensatz>;
  errorCode: string;
  loading: boolean;
  totalPersons: number;
  currentPerson: Personendatensatz | null;
};

export type PersonFilter = {
  organisationIDs?: Array<string>;
  rolleIDs?: Array<string>;
  searchFilter?: string;
};

type PersonGetters = {};
type PersonActions = {
  getAllPersons: (filter: PersonFilter) => Promise<void>;
  getPersonById: (personId: string) => Promise<Personendatensatz>;
  resetPassword: (personId: string) => Promise<string>;
  deletePerson: (personId: string) => Promise<void>;
  get2FAState: (personId: string) => Promise<TokenStateResponse>;
  get2FASoftwareQRCode: (personId: string) => Promise<string>;
};

export type PersonStore = Store<'personStore', PersonState, PersonGetters, PersonActions>;

export const usePersonStore: StoreDefinition<'personStore', PersonState, PersonGetters, PersonActions> = defineStore({
  id: 'personStore',
  state: (): PersonState => {
    return {
      allPersons: [],
      errorCode: '',
      loading: false,
      totalPersons: 0,
      currentPerson: null,
    };
  },
  actions: {
    async getAllPersons(filter: PersonFilter) {
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
            filter.organisationIDs,
            filter.rolleIDs,
            filter.searchFilter,
          );

        this.allPersons = data.items;
        this.totalPersons = +data.total;
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
    async deletePerson(personId: string) {
      this.loading = true;
      try {
        await personenApi.personControllerDeletePersonById(personId);
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

    async get2FAState(personId: string) {
      this.loading = true;
      try {
        const token: TokenStateResponse = (
          await twoFactorApi.privacyIdeaAdministrationControllerGetTwoAuthState(personId)
        ).data;

        return token;
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

    async get2FASoftwareQRCode(personId: string) {
      this.loading = true;
      try {
        const bodyParams: TokenInitBodyParams = {
          personId: personId,
        };
        const qrCodeImageBase64: string = (
          await twoFactorApi.privacyIdeaAdministrationControllerInitializeSoftwareToken(bodyParams)
        ).data;

        return qrCodeImageBase64;
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
