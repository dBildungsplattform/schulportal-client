import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { RolleResponse } from './RolleStore';

type SearchFilterState = {
  klassenPage: number;
  klassenPerPage: number;
  personenPage: number;
  personenPerPage: number;
  rollenPage: number;
  rollenPerPage: number;
  schulenPage: number;
  schulenPerPage: number;
  searchFilter: string | null;
  selectedKlassen: Array<string> | null;
  selectedRollen: Array<string> | null;
  selectedRollenObjects: RolleResponse[];
  selectedOrganisationen: Array<string> | null;
  sortField: string | null;
  sortOrder: string | null;
  currentSort: { key: string; order: 'asc' | 'desc' } | null;
};

type SearchFilterActions = {
  setKlasseFilter: (selectedKlassen: Array<string> | null) => Promise<void>;
  setRolleFilter: (selectedRollen: Array<string> | null) => Promise<void>;
  setRolleFilterWithObjects: (selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) => Promise<void>;
  setOrganisationFilter: (selectedOrganisationen: Array<string> | null) => Promise<void>;
  setSearchFilter: (searchFilter: string | null) => Promise<void>;
  setSortField: (sortField: string | null) => Promise<void>;
  setSortOrder: (sortOrder: string | null) => Promise<void>;
  setCurrentSort: (currentSort: { key: string; order: 'asc' | 'desc' } | null) => Promise<void>;
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
    searchFilter: '',
    selectedKlassen: [],
    selectedRollen: [],
    selectedRollenObjects: [],
    selectedOrganisationen: [],
    sortField: '',
    sortOrder: '',
    currentSort: null,
  }),
  actions: {
    async setKlasseFilter(selectedKlassen: Array<string> | null) {
      this.selectedKlassen = selectedKlassen;
    },

    async setRolleFilter(selectedRollen: Array<string> | null) {
      this.selectedRollen = selectedRollen;
    },

    async setOrganisationFilter(selectedOrganisationen: Array<string> | null) {
      this.selectedOrganisationen = selectedOrganisationen;
    },

    async setSearchFilter(searchFilter: string | null) {
      this.searchFilter = searchFilter;
    },

    async setSortField(sortField: string | null) {
      this.sortField = sortField;
    },

    async setSortOrder(sortOrder: string | null) {
      this.sortOrder = sortOrder;
    },

    async setCurrentSort(currentSort: { key: string; order: 'asc' | 'desc' } | null) {
      this.currentSort = currentSort;
    },

    async setRolleFilterWithObjects(selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) {
      this.selectedRollen = selectedRollen;
      this.selectedRollenObjects = rollenObjects;
    },
  },
});
