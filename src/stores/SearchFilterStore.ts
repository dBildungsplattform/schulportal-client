import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { RolleResponse } from './RolleStore';
import type { SortOrder, OrganisationSortField } from '@/utils/sorting';

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
  organisationenSortField: OrganisationSortField | null;
  organisationenSortOrder: SortOrder | null;
  currentSort: { key: string; order: 'asc' | 'desc' } | null;
  selectedSchuleForKlassen: string | null;
  selectedKlassenForKlassen: Array<string> | null;
};

type SearchFilterActions = {
  setKlasseFilterForPersonen: (selectedKlassen: Array<string> | null) => void;
  setRolleFilterForPersonen: (selectedRollen: Array<string> | null) => void;
  setRolleFilterWithObjectsForPersonen: (selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) => void;
  setOrganisationFilterForPersonen: (selectedOrganisationen: Array<string> | null) => void;
  setSearchFilterForPersonen: (searchFilter: string | null) => void;
  setSearchFilterForSchulen: (searchFilter: string | null) => void;
  setSchuleFilterForKlassen: (selectedSchuleForKlassen: string | null) => void;
  setKlasseFilterForKlassen: (selectedKlassenForKlassen: Array<string> | null) => void;
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
    /* personenSortField and personenSortOrder need default values to avoid getting 400 errors from the backend */
    personenSortField: 'familienname',
    personenSortOrder: 'asc',
    organisationenSortField: null,
    organisationenSortOrder: null,
    currentSort: null,
    selectedSchuleForKlassen: null,
    selectedKlassenForKlassen: [],
  }),
  actions: {
    setKlasseFilterForPersonen(selectedKlassen: Array<string> | null) {
      this.selectedKlassen = selectedKlassen;
    },

    setRolleFilterForPersonen(selectedRollen: Array<string> | null) {
      this.selectedRollen = selectedRollen;
    },

    setOrganisationFilterForPersonen(selectedOrganisationen: Array<string> | null) {
      this.selectedOrganisationen = selectedOrganisationen;
    },

    setSearchFilterForPersonen(searchFilterPersonen: string | null) {
      this.searchFilterPersonen = searchFilterPersonen ?? '';
    },

    setSearchFilterForSchulen(searchFilterSchulen: string | null) {
      this.searchFilterSchulen = searchFilterSchulen ?? '';
    },

    setRolleFilterWithObjectsForPersonen(selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) {
      this.selectedRollen = selectedRollen;
      this.selectedRollenObjects = rollenObjects;
    },

    setSchuleFilterForKlassen(selectedSchuleForKlassen: string | null) {
      this.selectedSchuleForKlassen = selectedSchuleForKlassen;
    },

    setKlasseFilterForKlassen(selectedKlassenForKlassen: Array<string> | null) {
      this.selectedKlassenForKlassen = selectedKlassenForKlassen;
    },
  },
});
