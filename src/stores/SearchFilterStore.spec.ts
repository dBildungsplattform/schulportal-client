import { SortField } from './PersonStore';
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
    searchFilterStore.setKlasseFilterForPersonen(['1', '2']);
    expect(searchFilterStore.selectedKlassen).toEqual(['1', '2']);

    // it sets the selectedRollen
    searchFilterStore.setRolleFilterForPersonen(['5', '8']);
    expect(searchFilterStore.selectedRollen).toEqual(['5', '8']);

    // it sets the selectedOrganisationen
    searchFilterStore.setOrganisationFilterForPersonen(['10', '20']);
    expect(searchFilterStore.selectedOrganisationen).toEqual(['10', '20']);

    // it sets the searchFilter
    searchFilterStore.setSearchFilterForPersonen('search');
    expect(searchFilterStore.searchFilter).toEqual('search');

    // it sets sortOrder
    searchFilterStore.setSortOrderForPersonen('desc');
    expect(searchFilterStore.sortOrder).toEqual('desc');

    // it sets sortField
    searchFilterStore.setSortFieldForPersonen(SortField.Vorname);
    expect(searchFilterStore.sortField).toEqual(SortField.Vorname);

    // it sets currentSort
    searchFilterStore.setCurrentSortForPersonen({ key: SortField.Vorname, order: 'desc' });
    expect(searchFilterStore.currentSort).toEqual({ key: SortField.Vorname, order: 'desc' });

    // it sets the selectedRolleFilterWithObjects
    searchFilterStore.setRolleFilterWithObjectsForPersonen(['5'], [
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

    // it sets the selectedSchuleForKlassen
    searchFilterStore.setSchuleFilterForKlassen('10');
    expect(searchFilterStore.selectedSchuleForKlassen).toEqual('10');

    // it sets the selectedKlassenForKlassen
    searchFilterStore.setKlasseFilterForKlassen(['10', '20']);
    expect(searchFilterStore.selectedKlassenForKlassen).toEqual(['10', '20']);
  });
});
