import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import {
  OrganisationenApiFactory,
  OrganisationsTyp,
  TraegerschaftTyp,
  type OrganisationenApiInterface,
  type CreateOrganisationBodyParams,
  type RollenSystemRecht,
  type OrganisationByNameBodyParams,
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

export type KlasseTableItem = {
  id: string;
  kennung?: string | null;
  name: string;
  namensergaenzung?: string | null;
  kuerzel?: string;
  typ: OrganisationsTyp;
  administriertVon?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SchuleTableItem = {
  id: string;
  kennung?: string | null;
  name: string;
  namensergaenzung?: string | null;
  kuerzel?: string;
  typ: OrganisationsTyp;
  administriertVon?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type OrganisationState = {
  allOrganisationen: Array<Organisation>;
  allKlassen: Array<Organisation>;
  allSchulen: Array<Organisation>;
  currentOrganisation: Organisation | null;
  currentKlasse: Organisation | null;
  updatedOrganisation: Organisation | null;
  createdKlasse: Organisation | null;
  createdSchule: Organisation | null;
  totalKlassen: number;
  totalSchulen: number;
  totalOrganisationen: number;
  klassen: Array<Organisation>;
  errorCode: string;
  loading: boolean;
  loadingKlassen: boolean;
};

export type OrganisationenFilter = {
  limit?: number;
  offset?: number;
  searchString?: string;
  systemrechte?: RollenSystemRecht[];
  includeTyp?: OrganisationsTyp;
  excludeTyp?: OrganisationsTyp[];
  administriertVon?: Array<string>;
};

type OrganisationGetters = {};
type OrganisationActions = {
  getAllOrganisationen: (filter?: OrganisationenFilter) => Promise<void>;
  getFilteredKlassenById(filter?: OrganisationenFilter): Promise<void>;
  getKlassenByOrganisationId: (organisationId: string, searchFilter?: string) => Promise<void>;
  getOrganisationById: (organisationId: string, organisationsTyp: OrganisationsTyp) => Promise<Organisation>;
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
  deleteOrganisationById: (organisationId: string) => Promise<void>;
  updateOrganisationById: (organisationId: string, name: string) => Promise<void>;
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
      allKlassen: [],
      allSchulen: [],
      currentOrganisation: null,
      currentKlasse: null,
      updatedOrganisation: null,
      createdKlasse: null,
      createdSchule: null,
      totalKlassen: 0,
      totalSchulen: 0,
      totalOrganisationen: 0,
      klassen: [],
      errorCode: '',
      loading: false,
      loadingKlassen: false,
    };
  },

  actions: {
    async getAllOrganisationen(filter?: OrganisationenFilter): Promise<void> {
      this.loading = true;
      try {
        const response: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
          filter?.offset,
          filter?.limit,
          undefined,
          undefined,
          filter?.searchString,
          filter?.includeTyp,
          filter?.systemrechte,
          filter?.excludeTyp,
          filter?.administriertVon,
        );
        if (filter?.includeTyp === OrganisationsTyp.Klasse) {
          this.allKlassen = response.data;
          this.totalKlassen = +response.headers['x-paging-total'];
        } else if (filter?.includeTyp === OrganisationsTyp.Schule) {
          this.allSchulen = response.data;
          this.totalSchulen = +response.headers['x-paging-total'];
        } else {
          this.allOrganisationen = response.data;
          this.totalOrganisationen = +response.headers['x-paging-total'];
        }
        this.loading = false;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getFilteredKlassenById(filter?: OrganisationenFilter) {
      this.loadingKlassen = true;
      try {
        const response: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
          undefined,
          25,
          undefined,
          undefined,
          filter?.searchString,
          OrganisationsTyp.Klasse,
          filter?.systemrechte,
          filter?.excludeTyp,
          filter?.administriertVon,
        );
        this.klassen = response.data;
        this.totalKlassen = +response.headers['x-paging-total'];
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loadingKlassen = false;
      }
    },

    async getOrganisationById(organisationId: string, organisationsTyp: OrganisationsTyp) {
      this.errorCode = '';
      this.loading = true;
      try {
        const { data }: { data: Organisation } =
          await organisationApi.organisationControllerFindOrganisationById(organisationId);
        if (organisationsTyp === OrganisationsTyp.Klasse) {
          this.currentKlasse = data;
        } else {
          this.currentOrganisation = data;
        }

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

    async getKlassenByOrganisationId(organisationId: string, searchFilter?: string) {
      this.errorCode = '';
      this.loadingKlassen = true;
      try {
        const response: AxiosResponse<Organisation[]> =
          await organisationApi.organisationControllerGetAdministrierteOrganisationen(organisationId, searchFilter);
        const getFilteredKlassen: Organisation[] = response.data.filter(
          (orga: Organisation) => orga.typ === OrganisationsTyp.Klasse,
        );
        this.klassen = getFilteredKlassen;
        this.totalKlassen = +response.headers['x-paging-total'];
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loadingKlassen = false;
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
        if (typ === OrganisationsTyp.Klasse) {
          this.createdKlasse = data;
        } else if (typ === OrganisationsTyp.Schule) {
          this.createdSchule = data;
        }
        return data;
      } catch (error: unknown) {
        /* if an unknown error occurs, set to UNSPECIFIED */
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ORGANISATION_SPECIFICATION_ERROR';
        }
        return await Promise.reject(this.errorCode);
      } finally {
        this.loading = false;
      }
    },
    async updateOrganisationById(organisationId: string, name: string): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      try {
        const organisationByNameBodyParams: OrganisationByNameBodyParams = {
          name: name,
        };
        const { data }: { data: Organisation } = await organisationApi.organisationControllerUpdateOrganisationName(
          organisationId,
          organisationByNameBodyParams,
        );
        this.updatedOrganisation = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'KLASSE_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
    async deleteOrganisationById(organisationId: string): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      try {
        await organisationApi.organisationControllerDeleteKlasse(organisationId);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'KLASSE_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
