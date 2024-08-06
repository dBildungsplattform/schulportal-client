import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  Class2FAApiFactory,
  PersonenApiFactory,
  PersonenFrontendApiFactory,
  type AssignHardwareTokenBodyParams,
  type AssignHardwareTokenResponse,
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
const twoFactorApi = Class2FAApiFactory(undefined, '', axiosApiInstance);

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

export type TwoFactorState = {
  errorCode: string;
  hasToken: boolean | null;
  tokenKind: 'hardware' | 'software' | null;
  qrCode: string;
};

export type { PersonendatensatzResponse };

type PersonState = {
  allPersons: Array<Personendatensatz>;
  errorCode: string;
  loading: boolean;
  totalPersons: number;
  currentPerson: Personendatensatz | null;
  twoFactorState: TwoFactorState;
};

export type PersonFilter = {
  organisationIDs?: Array<string>;
  rolleIDs?: Array<string>;
  searchFilter?: string;
};

type InitSoftwareTokenResponse = {
  detail: {
    googleurl: {
      description: string;
      img: string;
      value: string;
    };
    oathurl: {
      description: string;
      img: string;
      value: string;
    };
    otpkey: {
      description: string;
      img: string;
      value: string;
      value_b32: string;
    };
    rollout_state: string;
    serial: string;
    threadid: number;
  };
};

type PersonGetters = {};
type PersonActions = {
  resetState: () => void;
  getAllPersons: (filter: PersonFilter) => Promise<void>;
  getPersonById: (personId: string) => Promise<Personendatensatz>;
  resetPassword: (personId: string) => Promise<string>;
  deletePerson: (personId: string) => Promise<void>;
  get2FAState: (personId: string) => Promise<void>;
  get2FASoftwareQRCode: (personId: string) => Promise<void>;
  assignHardwareToken: (personUserName: string, serial: string, otp: string) => Promise<AssignHardwareTokenResponse>;
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
      twoFactorState: {
        errorCode: '',
        hasToken: null,
        tokenKind: null,
        qrCode: '',
      },
    };
  },
  actions: {
    resetState() {
      this.$reset();
    },
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

    async assignHardwareToken(
      personUserName: string,
      serial: string,
      otp: string,
    ): Promise<AssignHardwareTokenResponse> {
      this.loading = true;
      const assignTokenPayload: AssignHardwareTokenBodyParams = {
        serial: serial,
        otp: otp,
        user: personUserName,
      };
      try {
        return (await twoFactorApi.privacyIdeaAdministrationControllerAssignHardwareToken(assignTokenPayload)).data;
      } finally {
        this.loading = false;
      }
    },

    async get2FAState(personId: string) {
      this.loading = true;
      try {
        const twoFactorState: TokenStateResponse = (
          await twoFactorApi.privacyIdeaAdministrationControllerGetTwoAuthState(personId)
        ).data;

        this.twoFactorState.hasToken = twoFactorState.hasToken;

        if (!twoFactorState.hasToken) {
          return;
        }

        switch (twoFactorState.tokenKind) {
          case 'hardware':
            this.twoFactorState.tokenKind = 'hardware';
            break;
          case 'software':
            this.twoFactorState.tokenKind = 'software';
            break;
          default:
            this.twoFactorState.tokenKind = null;
        }
      } catch (error: unknown) {
        this.twoFactorState.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.twoFactorState.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
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

        this.twoFactorState.qrCode = qrCodeImageBase64;
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
