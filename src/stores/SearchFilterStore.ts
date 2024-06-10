import { defineStore, type Store, type StoreDefinition } from 'pinia';

type SearchFilterState = {
  searchFilter: string | null;
  selectedSchulen: Array<string> | null;
  selectedRollen: Array<string> | null;
};

type SearchFilterActions = {
  setRolleFilter: (selectedRollen: Array<string> | null) => Promise<void>;
  setSchuleFilter: (selectedSchulen: Array<string> | null) => Promise<void>;
  setSearchFilter: (searchFilter: string | null) => Promise<void>;
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
    searchFilter: '',
    selectedSchulen: [],
    selectedRollen: [],
  }),
  actions: {
    async setRolleFilter(selectedRollen: Array<string> | null) {
      this.selectedRollen = selectedRollen;
    },

    async setSchuleFilter(selectedSchulen: Array<string> | null) {
      this.selectedSchulen = selectedSchulen;
    },

    async setSearchFilter(searchFilter: string | null) {
      this.searchFilter = searchFilter;
    },
  },
});
