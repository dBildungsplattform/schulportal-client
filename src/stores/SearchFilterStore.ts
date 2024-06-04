import { defineStore, type Store, type StoreDefinition } from 'pinia';

type SearchFilterState = {
  searchFilter: string | null;
  selectedSchulen: Array<string> | null;
  selectedRollen: Array<string> | null;
};

type SearchFilterActions = {
  setFilter: (searchFilter: string | null, selectedSchulen: Array<string> | null, selectedRollen: Array<string> | null) => Promise<void>;
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
    async setFilter(searchFilter: string | null, selectedSchulen: Array<string> | null, selectedRollen: Array<string> | null) {
      this.searchFilter = searchFilter;
      this.selectedSchulen = selectedSchulen;
      this.selectedRollen = selectedRollen;
    },
  },
});
