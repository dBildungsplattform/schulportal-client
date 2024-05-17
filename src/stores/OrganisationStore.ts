import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  OrganisationenApiFactory,
  OrganisationsTyp,
  TraegerschaftTyp,
  type OrganisationenApiInterface,
  type CreateOrganisationBodyParams,
  type RollenSystemRecht,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const organisationApi: OrganisationenApiInterface = OrganisationenApiFactory(undefined, '', axiosApiInstance);

export type Organisation = {
  id: string;
  kennung?: string | null;
  name: string;
  namensergaenzung?: string | null;
  kuerzel?: string;
  typ: OrganisationsTyp;
  administriertVon?: string | null;
};

type OrganisationState = {
  allOrganisationen: Array<Organisation>;
  currentOrganisation: Organisation | null;
  createdOrganisation: Organisation | null;
  errorCode: string;
  loading: boolean;
};

export type OrganisationenFilter = {
  searchString?: string;
  systemrechte?: RollenSystemRecht[];
  excludeTyp?: OrganisationsTyp[];
};

type OrganisationGetters = {};
type OrganisationActions = {
  getAllOrganisationen: (filter?: OrganisationenFilter) => Promise<void>;
  getOrganisationById: (organisationId: string) => Promise<Organisation>;
  createOrganisation: (
    kennung: string,
    name: string,
    namensergaenzung: string,
    kuerzel: string,
    typ: OrganisationsTyp,
    traegerschaft?: TraegerschaftTyp,
    administriertVon?: string,
    zugehoerigZu?: string,
  ) => Promise<Organisation>;
};

export { OrganisationsTyp };
export type OrganisationStore = Store<'organisationStore', OrganisationState, OrganisationGetters, OrganisationActions>;

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
    async getAllOrganisationen(filter?: OrganisationenFilter) {
      this.loading = true;
      try {
        const { data }: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
          undefined,
          undefined,
          undefined,
          undefined,
          filter?.searchString,
          undefined,
          filter?.systemrechte,
          filter?.excludeTyp,
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
      typ: OrganisationsTyp,
      traegerschaft?: TraegerschaftTyp,
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
        /* if an unknown error occurs, set to UNSPECIFIED */
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ORGANISATION_SPECIFICATION_ERROR';
        }
        this.loading = false;
        return Promise.reject(this.errorCode);
      }
    },
  },
});
