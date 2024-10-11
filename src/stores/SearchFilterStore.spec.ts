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
    expect(searchFilterStore.searchFilter).toEqual('');
  });

  it('should change the state', async () => {
    // it sets the selectedKlassen
    searchFilterStore.setKlasseFilter(['1', '2']);
    expect(searchFilterStore.selectedKlassen).toEqual(['1', '2']);

    // it sets the selectedRollen
    searchFilterStore.setRolleFilter(['5', '8']);
    expect(searchFilterStore.selectedRollen).toEqual(['5', '8']);

    // it sets the selectedOrganisationen
    searchFilterStore.setOrganisationFilter(['10', '20']);
    expect(searchFilterStore.selectedOrganisationen).toEqual(['10', '20']);

    // it sets the searchFilter
    searchFilterStore.setSearchFilter('search');
    expect(searchFilterStore.searchFilter).toEqual('search');

    // it sets the selectedRolleFilterWithObjects
    searchFilterStore.setRolleFilterWithObjects(['5'], [
      {
        id: '10',
        administeredBySchulstrukturknoten: '1',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      },
    ] as RolleResponse[]);

    expect(searchFilterStore.selectedRollenObjects).toEqual([
      {
        id: '10',
        administeredBySchulstrukturknoten: '1',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      },
    ]);
  });
});
