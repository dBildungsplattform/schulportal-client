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
  type ParentOrganisationenResponse,
  type OrganisationRootChildrenResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import { useSearchFilterStore, type SearchFilterStore } from './SearchFilterStore';

const organisationApi: OrganisationenApiInterface = OrganisationenApiFactory(undefined, '', axiosApiInstance);
const searchFilterStore: SearchFilterStore = useSearchFilterStore();

export type Organisation = {
  id: string;
  kennung?: string | null;
  name: string;
  namensergaenzung?: string | null;
  kuerzel?: string;
  typ: OrganisationsTyp;
  administriertVon?: string | null;
  schuleDetails?: string;
  version?: number;
  itslearningEnabled?: boolean;
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
  lockingOrganisation: Organisation | null;
  totalKlassen: number;
  totalSchulen: number;
  totalPaginatedSchulen: number;
  totalPaginatedKlassen: number;
  totalPaginatedOrganisationen: number;
  totalOrganisationen: number;
  klassen: Array<Organisation>;
  errorCode: string;
  loading: boolean;
  loadingKlassen: boolean;
  parentOrganisationen: Array<Organisation>;
  schultraeger: Array<Organisation>;
  activatedItslearningOrganisation: Organisation | null;
};

export type OrganisationenFilter = {
  limit?: number;
  offset?: number;
  searchString?: string;
  systemrechte?: RollenSystemRecht[];
  includeTyp?: OrganisationsTyp;
  excludeTyp?: OrganisationsTyp[];
  administriertVon?: Array<string>;
  organisationIds?: Array<string>;
};

type OrganisationGetters = {};
type OrganisationActions = {
  getAllOrganisationen: (filter?: OrganisationenFilter) => Promise<void>;
  getFilteredKlassen(filter?: OrganisationenFilter): Promise<void>;
  getKlassenByOrganisationId: (filter?: OrganisationenFilter) => Promise<void>;
  getOrganisationById: (organisationId: string, organisationsTyp: OrganisationsTyp) => Promise<Organisation>;
  getLockingOrganisationById: (organisationId: string) => Promise<void>;
  getParentOrganisationsByIds: (organisationIds: string[]) => Promise<void>;
  createOrganisation: (
    kennung: string | undefined,
    name: string,
    namensergaenzung: string | undefined,
    kuerzel: string | undefined,
    typ: OrganisationsTyp,
    traegerschaft?: TraegerschaftTyp,
    administriertVon?: string,
    zugehoerigZu?: string,
  ) => Promise<Organisation>;
  deleteOrganisationById: (organisationId: string) => Promise<void>;
  updateOrganisationById: (organisationId: string, name: string) => Promise<void>;
  getSchultraeger: () => Promise<void>;
  fetchSchuleDetailsForKlassen: (filterActive: boolean) => Promise<void>;
  setItsLearningForSchule: (organisationId: string) => Promise<void>;
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
      lockingOrganisation: null,
      totalKlassen: 0,
      totalSchulen: 0,
      totalPaginatedSchulen: 0,
      totalPaginatedKlassen: 0,
      totalPaginatedOrganisationen: 0,
      totalOrganisationen: 0,
      klassen: [],
      errorCode: '',
      loading: false,
      loadingKlassen: false,
      parentOrganisationen: [],
      schultraeger: [],
      activatedItslearningOrganisation: null,
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
          filter?.organisationIds,
        );
        if (filter?.includeTyp === OrganisationsTyp.Klasse) {
          this.allKlassen = response.data;
          this.totalKlassen = +response.headers['x-paging-total'];
          await this.fetchSchuleDetailsForKlassen(false);
        } else if (filter?.includeTyp === OrganisationsTyp.Schule) {
          this.allSchulen = response.data;
          // The total number of all Schulen before applying pagination (To use in the Result table to show all Einträge)
          this.totalSchulen = +response.headers['x-paging-total'];
          // The paginated total number to show in the autocomplete filters.
          this.totalPaginatedSchulen = +response.headers['x-paging-pagetotal'];
        } else {
          this.allOrganisationen = response.data;
          this.totalOrganisationen = +response.headers['x-paging-total'];
          this.totalPaginatedOrganisationen = +response.headers['x-paging-pagetotal'];
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

    async fetchSchuleDetailsForKlassen(filterActive: boolean): Promise<void> {
      let administriertVonSet: Set<string> = new Set();
      if (filterActive) {
        administriertVonSet = new Set(
          this.klassen
            .map((klasse: Organisation) => klasse.administriertVon)
            .filter((id: string | undefined | null): id is string => id !== null && id !== undefined),
        );
      } else {
        administriertVonSet = new Set(
          this.allKlassen
            .map((klasse: Organisation) => klasse.administriertVon)
            .filter((id: string | undefined | null): id is string => id !== null && id !== undefined),
        );
      }
      const response: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
        undefined,
        searchFilterStore.klassenPerPage,
        undefined,
        undefined,
        undefined,
        OrganisationsTyp.Schule,
        ['SCHULEN_VERWALTEN'],
        undefined,
        undefined,
        Array.from(administriertVonSet),
      );

      const schulenMap: Map<string, string> = new Map(
        response.data.map((org: Organisation) => [org.id, `${org.kennung} (${org.name.trim()})`]),
      );

      this.allKlassen = this.allKlassen.map((klasse: Organisation) => ({
        ...klasse,
        schuleDetails: schulenMap.get(klasse.administriertVon || '') || '---',
      }));

      this.klassen = this.klassen.map((klasse: Organisation) => ({
        ...klasse,
        schuleDetails: schulenMap.get(klasse.administriertVon || '') || '---',
      }));
    },

    async getFilteredKlassen(filter?: OrganisationenFilter) {
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
        this.totalPaginatedKlassen = +response.headers['x-paging-pagetotal'];
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

    async getParentOrganisationsByIds(organisationIds: string[]) {
      this.errorCode = '';
      this.loading = true;
      try {
        const response: AxiosResponse<ParentOrganisationenResponse, unknown> =
          await organisationApi.organisationControllerGetParentsByIds({ organisationIds: organisationIds });
        const { parents }: ParentOrganisationenResponse = response.data;
        this.parentOrganisationen = parents;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getLockingOrganisationById(organisationId: string) {
      this.errorCode = '';
      this.loading = true;
      try {
        let organisation: Organisation | undefined = this.parentOrganisationen.find(
          (org: Organisation) => org.id === organisationId,
        );
        if (!organisation) organisation = this.allOrganisationen.find((org: Organisation) => org.id === organisationId);
        if (organisation) {
          this.lockingOrganisation = { ...organisation };
        } else {
          const { data }: { data: Organisation } =
            await organisationApi.organisationControllerFindOrganisationById(organisationId);
          this.lockingOrganisation = data;
        }
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async getKlassenByOrganisationId(filter?: OrganisationenFilter) {
      this.errorCode = '';
      this.loadingKlassen = true;
      try {
        const response: AxiosResponse<Organisation[]> = await organisationApi.organisationControllerFindOrganizations(
          filter?.offset,
          filter?.limit,
          undefined,
          undefined,
          filter?.searchString,
          OrganisationsTyp.Klasse,
          [],
          undefined,
          filter?.administriertVon,
          filter?.organisationIds,
        );

        this.klassen = response.data;
        this.totalKlassen = +response.headers['x-paging-total'];
        this.totalPaginatedKlassen = +response.headers['x-paging-pageTotal'];
        await this.fetchSchuleDetailsForKlassen(true);
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
      kennung: string | undefined,
      name: string,
      namensergaenzung: string | undefined,
      kuerzel: string | undefined,
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
        if (!this.currentKlasse?.version) {
          throw new Error('Organisation version not found');
        }
        const organisationByNameBodyParams: OrganisationByNameBodyParams = {
          name: name,
          version: this.currentKlasse.version,
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

    async getSchultraeger() {
      try {
        const response: AxiosResponse<OrganisationRootChildrenResponse> =
          await organisationApi.organisationControllerGetRootChildren();
        this.schultraeger = Object.values(response.data);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'SCHULTRAEGER_ERROR';
        }
      }
    },

    async setItsLearningForSchule(organisationId: string): Promise<void> {
      this.errorCode = '';
      this.loading = true;
      try {
        const { data }: { data: Organisation } =
          await organisationApi.organisationControllerEnableForitslearning(organisationId);
        this.activatedItslearningOrganisation = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ORGANISATION_SPECIFICATION_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
