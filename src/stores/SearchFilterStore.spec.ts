import { DoFactory } from 'test/DoFactory';
import type { RolleResponse } from './RolleStore';
import { useSearchFilterStore, type SearchFilterStore } from './SearchFilterStore';
import { setActivePinia, createPinia } from 'pinia';

describe('SearchFilterStore', () => {
  let searchFilterStore: SearchFilterStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    searchFilterStore = useSearchFilterStore();
  });

  it('should initalize state correctly', () => {
    expect(searchFilterStore.selectedKlassen).toEqual([]);
    expect(searchFilterStore.selectedRollen).toEqual([]);
    expect(searchFilterStore.selectedOrganisationen).toEqual([]);
    expect(searchFilterStore.selectedRollenObjects).toEqual([]);
    expect(searchFilterStore.searchFilterPersonen).toEqual('');
    expect(searchFilterStore.searchFilterSchulen).toEqual('');
    expect(searchFilterStore.selectedSchuleForKlassen).toEqual(null);
    expect(searchFilterStore.selectedKlassenForKlassen).toEqual([]);
    expect(searchFilterStore.selectedSchuleForSchulischeServiceProvider).toEqual(null);
  });

  it('should change the state', () => {
    // it sets the selectedKlassen
    searchFilterStore.setKlasseFilterForPersonen(['1', '2']);
    expect(searchFilterStore.selectedKlassen).toEqual(['1', '2']);

    // it sets the selectedRollen
    searchFilterStore.setRolleFilterForPersonen(['5', '8']);
    expect(searchFilterStore.selectedRollen).toEqual(['5', '8']);

    // it sets the selectedOrganisationen
    searchFilterStore.setOrganisationFilterForPersonen(['10', '20']);
    expect(searchFilterStore.selectedOrganisationen).toEqual(['10', '20']);

    // it sets the searchFilter for personen
    searchFilterStore.setSearchFilterForPersonen('search');
    expect(searchFilterStore.searchFilterPersonen).toEqual('search');
    searchFilterStore.setSearchFilterForPersonen(null);
    expect(searchFilterStore.searchFilterPersonen).toEqual('');

    // it sets the searchFilter for schulen
    searchFilterStore.setSearchFilterForSchulen('search');
    expect(searchFilterStore.searchFilterSchulen).toEqual('search');
    searchFilterStore.setSearchFilterForSchulen(null);
    expect(searchFilterStore.searchFilterSchulen).toEqual('');

    // it sets the selectedRolleFilterWithObjects
    const rolleFilterObject: RolleResponse = DoFactory.getRolleResponse();
    searchFilterStore.setRolleFilterWithObjectsForPersonen(['5'], [rolleFilterObject]);
    expect(searchFilterStore.selectedRollenObjects).toEqual([rolleFilterObject]);

    // it sets the selectedSchuleForKlassen
    searchFilterStore.setSchuleFilterForKlassen('10');
    expect(searchFilterStore.selectedSchuleForKlassen).toEqual('10');

    // it sets the selectedKlassenForKlassen
    searchFilterStore.setKlasseFilterForKlassen(['10', '20']);
    expect(searchFilterStore.selectedKlassenForKlassen).toEqual(['10', '20']);

    searchFilterStore.setSchuleForSchulischeServiceProvider('10');
    expect(searchFilterStore.selectedSchuleForSchulischeServiceProvider).toEqual('10');
  });
});
