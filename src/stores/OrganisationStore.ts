import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  OrganisationenApiFactory,
  OrganisationResponseTypEnum,
  CreateOrganisationBodyParamsTypEnum,
  CreateOrganisationBodyParamsTraegerschaftEnum,
  type OrganisationenApiInterface,
  type CreateOrganisationBodyParams,
  type OrganisationResponseLegacy,
  RollenSystemRecht,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const organisationApi: OrganisationenApiInterface = OrganisationenApiFactory(undefined, '', axiosApiInstance);

type OrganisationState = {
  allOrganisationen: Array<Organisation>;
  currentOrganisation: Organisation | null;
  createdOrganisation: Organisation | null;
  errorCode: string;
  loading: boolean;
};

type OrganisationGetters = {};
type OrganisationActions = {
  getAllOrganisationen: () => Promise<void>;
  getAllOrganisationenWithRecht: (rechte: RollenSystemRecht[]) => Promise<void>;
  getOrganisationById: (organisationId: string) => Promise<Organisation>;
  createOrganisation: (
    kennung: string,
    name: string,
    namensergaenzung: string,
    kuerzel: string,
    typ: CreateOrganisationBodyParamsTypEnum,
    traegerschaft?: CreateOrganisationBodyParamsTraegerschaftEnum,
    administriertVon?: string,
    zugehoerigZu?: string,
  ) => Promise<Organisation>;
};

export { CreateOrganisationBodyParamsTypEnum };
export { OrganisationResponseTypEnum };
export type OrganisationStore = Store<'organisationStore', OrganisationState, OrganisationGetters, OrganisationActions>;
export type Organisation = OrganisationResponseLegacy;

export const useOrganisationStore: StoreDefinition<
  'organisationStore',
  OrganisationState,
  OrganisationGetters,
  OrganisationActions
> = defineStore({
  id: 'organisationStore',
  state: (): OrganisationState => {
    return {
      allOrganisationen: [],
      currentOrganisation: null,
      createdOrganisation: null,
      errorCode: '',
      loading: false,
    };
  },
  actions: {
    async getAllOrganisationen() {
      this.loading = true;
      try {
        const { data }: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations();

        this.allOrganisationen = data;
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
      }
    },
    async getAllOrganisationenWithRecht(rechte: RollenSystemRecht[]) {
      this.loading = true;
      try {
        const { data }: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          rechte,
        );

        this.allOrganisationen = data;
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
      }
    },
    async getOrganisationById(organisationId: string) {
      this.errorCode = '';
      this.loading = true;
      try {
        const { data }: { data: Organisation } =
          await organisationApi.organisationControllerFindOrganisationById(organisationId);

        this.currentOrganisation = data;
        this.loading = false;
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
        return Promise.reject(this.errorCode);
      }
    },
    async createOrganisation(
      kennung: string,
      name: string,
      namensergaenzung: string,
      kuerzel: string,
      typ: CreateOrganisationBodyParamsTypEnum,
      traegerschaft?: CreateOrganisationBodyParamsTraegerschaftEnum,
      administriertVon?: string,
      zugehoerigZu?: string,
    ): Promise<Organisation> {
      this.loading = true;
      try {
        const createOrganisationBodyParams: CreateOrganisationBodyParams = {
          kennung: kennung,
          name: name,
          namensergaenzung: namensergaenzung,
          kuerzel: kuerzel,
          typ: typ,
          traegerschaft: traegerschaft,
          administriertVon: administriertVon,
          zugehoerigZu: zugehoerigZu,
        };
        const { data }: { data: Organisation } =
          await organisationApi.organisationControllerCreateOrganisation(createOrganisationBodyParams);
        this.loading = false;
        this.createdOrganisation = data;
        return data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        this.loading = false;
        return Promise.reject(this.errorCode);
      }
    },
  },
});
