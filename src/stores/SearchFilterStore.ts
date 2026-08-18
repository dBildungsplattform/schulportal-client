import { SortOrder, type OrganisationSortField } from '@/utils/sorting';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { Organisation } from './OrganisationStore';
import { SortField } from './PersonStore';
import type { RolleResponse } from './RolleStore';
import { ServiceProviderKategorie } from './ServiceProviderStore';

export const DEFAULT_SERVICE_PROVIDER_KATEGORIEN: ReadonlyArray<ServiceProviderKategorie> = [
  ServiceProviderKategorie.Email,
  ServiceProviderKategorie.Unterricht,
  ServiceProviderKategorie.Verwaltung,
  ServiceProviderKategorie.Hinweise,
];

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
  serviceProviderPage: number;
  serviceProviderPerPage: number;
  mptRollenPage: number;
  mptRollenPerPage: number;
  serviceProviderSchulePage: number;
  serviceProviderSchulePerPage: number;
  searchFilterPersonen: string | null;
  searchFilterSchulen: string | null;
  selectedKlassen: Array<string> | null;
  selectedRollen: Array<string> | null;
  selectedRollenObjects: RolleResponse[];
  selectedOrganisationen: Array<string> | null;
  selectedOrgaObjects: Organisation[] | null;
  personenSortField: string | null;
  personenSortOrder: string | null;
  organisationenSortField: OrganisationSortField | null;
  organisationenSortOrder: SortOrder | null;
  currentSort: { key: string; order: 'asc' | 'desc' } | null;
  selectedSchuleForKlassen: string | null;
  selectedKlassenForKlassen: Array<string> | null;
  selectedSchuleForMptRollen: string | null;
  selectedSchuleForSchulischeServiceProvider: string | null;
  selectedKategorienForServiceProvider: Array<ServiceProviderKategorie>;
};

type SearchFilterActions = {
  setKlasseFilterForPersonen: (selectedKlassen: Array<string> | null) => void;
  setRolleFilterForPersonen: (selectedRollen: Array<string> | null) => void;
  setRolleFilterWithObjectsForPersonen: (selectedRollen: Array<string> | null, rollenObjects: RolleResponse[]) => void;
  setOrganisationFilterForPersonen: (
    selectedOrganisationen: Array<string> | null,
    orgaObjects?: Organisation[],
  ) => void;
  setSearchFilterForPersonen: (searchFilter: string | null) => void;
  setSearchFilterForSchulen: (searchFilter: string | null) => void;
  setSchuleFilterForKlassen: (selectedSchuleForKlassen: string | null) => void;
  setKlasseFilterForKlassen: (selectedKlassenForKlassen: Array<string> | null) => void;
  setSchuleForMptRollen: (selectedSchuleForMptRollen: string | null) => void;
  setSchuleForSchulischeServiceProvider: (selectedSchuleForSchulischeServiceProvider: string | null) => void;
  setKategorienForServiceProvider: (selectedKategorienForServiceProvider: Array<ServiceProviderKategorie>) => void;
  resetKategorienForServiceProvider: () => void;
};

type SearchFilterGetters = object;

export type SearchFilterStore = Store<'searchFilterStore', SearchFilterState, SearchFilterGetters, SearchFilterActions>;

export const useSearchFilterStore: StoreDefinition<
  'searchFilterStore',
  SearchFilterState,
  SearchFilterGetters,
  SearchFilterActions
> = defineStore('searchFilterStore', {
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
    serviceProviderPage: 1,
    serviceProviderPerPage: 30,
    mptRollenPage: 1,
    mptRollenPerPage: 30,
    serviceProviderSchulePage: 1,
    serviceProviderSchulePerPage: 30,
    searchFilterPersonen: '',
    searchFilterSchulen: '',
    selectedKlassen: [],
    selectedRollen: [],
    selectedRollenObjects: [],
    selectedOrganisationen: [],
    selectedOrgaObjects: [],
    personenSortField: SortField.Familienname,
    personenSortOrder: SortOrder.Asc,
    organisationenSortField: null,
    organisationenSortOrder: null,
    currentSort: { key: SortField.Familienname, order: SortOrder.Asc },
    selectedSchuleForKlassen: null,
    selectedKlassenForKlassen: [],
    selectedSchuleForMptRollen: null,
    selectedSchuleForSchulischeServiceProvider: null,
    selectedKategorienForServiceProvider: [...DEFAULT_SERVICE_PROVIDER_KATEGORIEN],
  }),
  actions: {
    setKlasseFilterForPersonen(selectedKlassen: Array<string> | null) {
      this.selectedKlassen = selectedKlassen;
    },

    setRolleFilterForPersonen(selectedRollen: Array<string> | null) {
      this.selectedRollen = selectedRollen;
    },

    setOrganisationFilterForPersonen(selectedOrganisationen: Array<string> | null, orgaObjects?: Organisation[]) {
      this.selectedOrganisationen = selectedOrganisationen;
      this.selectedOrgaObjects = orgaObjects ?? [];
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

    setSchuleForMptRollen(selectedSchuleForMptRollen: string | null) {
      this.selectedSchuleForMptRollen = selectedSchuleForMptRollen;
    },

    setSchuleForSchulischeServiceProvider(selectedSchuleForSchulischeServiceProvider: string | null) {
      this.selectedSchuleForSchulischeServiceProvider = selectedSchuleForSchulischeServiceProvider;
    },

    setKategorienForServiceProvider(selectedKategorienForServiceProvider: Array<ServiceProviderKategorie>) {
      this.selectedKategorienForServiceProvider = selectedKategorienForServiceProvider;
    },

    resetKategorienForServiceProvider() {
      this.selectedKategorienForServiceProvider = [...DEFAULT_SERVICE_PROVIDER_KATEGORIEN];
    },
  },
});
