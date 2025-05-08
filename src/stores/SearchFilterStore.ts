import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { RolleResponse } from './RolleStore';
import type { SortField } from './OrganisationStore';
import type { SortOrder } from '@/utils/sorting';

type SearchFilterState = {
  klassenPage: number;
  klassenPerPage: number;
  personenPage: number;
  personenPerPage: number;
  rollenPage: number;
  rollenPerPage: number;
  schulenPage: number;
  schulenPerPage: number;
  schultraegerPage: number;
  schulentraegerPerPage: number;
  searchFilterPersonen: string | null;
  searchFilterSchulen: string | null;
  selectedKlassen: Array<string> | null;
  selectedRollen: Array<string> | null;
  selectedRollenObjects: RolleResponse[];
  selectedOrganisationen: Array<string> | null;
  personenSortField: string | null;
  personenSortOrder: string | null;
  organisationenSortField: SortField | null;
  organisationenSortOrder: SortOrder | null;
  currentSort: { key: string; order: 'asc' | 'desc' } | null;
  selectedSchuleForKlassen: string | null;
  selectedKlassenForKlassen: Array<string> | null;
};

type SearchFilterActions = {
  setKlasseFilterForPersonen: (selectedKlassen: Array<string> | null) => Promise<void>;
  setRolleFilterForPersonen: (selectedRollen: Array<string> | null) => Promise<void>;
  setRolleFilterWithObjectsForPersonen: (
    selectedRollen: Array<string> | null,
    rollenObjects: RolleResponse[],
  ) => Promise<void>;
  setOrganisationFilterForPersonen: (selectedOrganisationen: Array<string> | null) => Promise<void>;
  setSearchFilterForPersonen: (searchFilter: string | null) => Promise<void>;
  setSearchFilterForSchulen: (searchFilter: string | null) => Promise<void>;
  setSortFieldForPersonen: (sortField: string | null) => Promise<void>;
  setSortOrderForPersonen: (sortOrder: string | null) => Promise<void>;
  setCurrentSortForPersonen: (currentSort: { key: string; order: 'asc' | 'desc' } | null) => Promise<void>;
  setSchuleFilterForKlassen: (selectedSchuleForKlassen: string | null) => Promise<void>;
  setKlasseFilterForKlassen: (selectedKlassenForKlassen: Array<string> | null) => Promise<void>;
};

type SearchFilterGetters = {};

export type SearchFilterStore = Store<'searchFilterStore', SearchFilterState, SearchFilterGetters, SearchFilterActions>;

export const useSearchFilterStore: StoreDefinition<
  'searchFilterStore',
  SearchFilterState,
  SearchFilterGetters,
  SearchFilterActions
> = defineStore({
  id: 'searchFilterStore',
  state: (): SearchFilterState => ({
    klassenPage: 1,
    klassenPerPage: 30,
    personenPage: 1,
    personenPerPage: 30,
    rollenPage: 1,
    rollenPerPage: 30,
    schulenPage: 1,
    schulenPerPage: 30,
    schultraegerPage: 1,
    schulentraegerPerPage: 30,
    searchFilterPersonen: '',
    searchFilterSchulen: '',
    selectedKlassen: [],
    selectedRollen: [],
    selectedRollenObjects: [],
    selectedOrganisationen: [],
    personenSortField: '',
    personenSortOrder: '',
    organisationenSortField: null,
    organisationenSortOrder: null,
    currentSort: null,
    selectedSchuleForKlassen: null,
    selectedKlassenForKlassen: [],
  }),
  actions: {
    async setKlasseFilterForPersonen(selectedKlassen: Array<string> | null) {
      this.selectedKlassen = selectedKlassen;
    },

    async setRolleFilterForPersonen(selectedRollen: Array<string> | null) {
      this.selectedRollen = selectedRollen;
    },

    async setOrganisationFilterForPersonen(selectedOrganisationen: Array<string> | null) {
      this.selectedOrganisationen = selectedOrganisationen;
    },

    async setSearchFilterForPersonen(searchFilterPersonen: string | null) {
      this.searchFilterPersonen = searchFilterPersonen || '';
    },

    async setSearchFilterForSchulen(searchFilterSchulen: string | null) {
      this.searchFilterSchulen = searchFilterSchulen || '';
    },

    async setSortFieldForPersonen(sortField: string | null) {
      this.personenSortField = sortField;
    },

    async setSortOrderForPersonen(sortOrder: string | null) {
      this.personenSortOrder = sortOrder;
    },

    async setCurrentSortForPersonen(currentSort: { key: string; order: 'asc' | 'desc' } | null) {
      this.currentSort = currentSort;
    },

    async setRolleFilterWithObjectsForPersonen(selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) {
      this.selectedRollen = selectedRollen;
      this.selectedRollenObjects = rollenObjects;
    },

    async setSchuleFilterForKlassen(selectedSchuleForKlassen: string | null) {
      this.selectedSchuleForKlassen = selectedSchuleForKlassen;
    },

    async setKlasseFilterForKlassen(selectedKlassenForKlassen: Array<string> | null) {
      this.selectedKlassenForKlassen = selectedKlassenForKlassen;
    },
  },
});
