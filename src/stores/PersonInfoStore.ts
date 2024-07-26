import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  PersonInfoApiFactory,
  type DbiamCreatePersonWithContextBodyParams,
  type PersonInfoApiInterface,
  type PersonInfoResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const personenInfoApi: PersonInfoApiInterface = PersonInfoApiFactory(undefined, '', axiosApiInstance);
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

export type Personendatensatz = {
  person: Person;
};

export type { PersonInfoResponse };

type PersonInfoState = {
  personInfo: PersonInfoResponse | null;
  errorCode: string;
  loading: boolean;
};

type PersonInfoActions = {
  initPersonInfo: () => Promise<void>;
};

type PersonInfoGetters = {};

export type PersonInfoStore = Store<'personInfoStore', PersonInfoState, PersonInfoGetters, PersonInfoActions>;

export const usePersonInfoStore: StoreDefinition<
  'personInfoStore',
  PersonInfoState,
  PersonInfoGetters,
  PersonInfoActions
> = defineStore({
  id: 'personInfoStore',
  state: (): PersonInfoState => {
    return {
      personInfo: null,
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async initPersonInfo() {
      this.loading = true;
      try {
        const { data }: AxiosResponse<PersonInfoResponse> = await personenInfoApi.personInfoControllerInfo();
        this.personInfo = data;
      } catch (error) {
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data?.message || '';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
