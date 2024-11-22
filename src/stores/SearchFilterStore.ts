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
  selectedSchuleForKlassen: string | null;
  selectedKlassenForKlassen: Array<string> | null;
  selectedSchulenForSchulen: Array<string> | null;
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
  setSortFieldForPersonen: (sortField: string | null) => Promise<void>;
  setSortOrderForPersonen: (sortOrder: string | null) => Promise<void>;
  setCurrentSortForPersonen: (currentSort: { key: string; order: 'asc' | 'desc' } | null) => Promise<void>;
  setSchuleFilterForKlassen: (selectedSchuleForKlassen: string | null) => Promise<void>;
  setKlasseFilterForKlassen: (selectedKlassenForKlassen: Array<string> | null) => Promise<void>;
  setSchuleFilterForSchulen: (selectedSchulenForSchulen: Array<string> | null) => Promise<void>;
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
    selectedSchuleForKlassen: null,
    selectedKlassenForKlassen: [],
    selectedSchulenForSchulen: [],
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

    async setSearchFilterForPersonen(searchFilter: string | null) {
      this.searchFilter = searchFilter;
    },

    async setSortFieldForPersonen(sortField: string | null) {
      this.sortField = sortField;
    },

    async setSortOrderForPersonen(sortOrder: string | null) {
      this.sortOrder = sortOrder;
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

    async setSchuleFilterForSchulen(selectedSchulenForSchulen: Array<string> | null) {
      this.selectedSchulenForSchulen = selectedSchulenForSchulen;
    },
  },
});
