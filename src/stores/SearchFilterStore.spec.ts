import { createPinia, setActivePinia } from 'pinia';
import { DoFactory } from 'test/DoFactory';
import type { Organisation } from './OrganisationStore';
import { RollenArt, RollenMerkmal, type RolleResponse } from './RolleStore';
import {
  DEFAULT_SERVICE_PROVIDER_KATEGORIEN,
  rollenPerPageDefault,
  useSearchFilterStore,
  type SearchFilterStore,
} from './SearchFilterStore';
import { ServiceProviderKategorie } from './ServiceProviderStore';

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
    expect(searchFilterStore.searchStringForRollen).toEqual('');
    expect(searchFilterStore.searchStringForPersonen).toEqual('');
    expect(searchFilterStore.searchStringForSchulen).toEqual('');
    expect(searchFilterStore.searchStringForServiceProvider).toEqual('');
    expect(searchFilterStore.selectedSchuleForKlassen).toEqual(null);
    expect(searchFilterStore.selectedKlassenForKlassen).toEqual([]);
    expect(searchFilterStore.selectedSchuleForMptRollen).toEqual(null);
    expect(searchFilterStore.mptRollenPage).toEqual(1);
    expect(searchFilterStore.mptRollenPerPage).toEqual(30);
    expect(searchFilterStore.selectedSchuleForSchulischeServiceProvider).toEqual(null);
    expect(searchFilterStore.selectedMerkmaleForRollen).toEqual([]);
    expect(searchFilterStore.selectedRollenartenForRollen).toEqual([]);
    expect(searchFilterStore.selectedOrganisationenForRollen).toEqual([]);
    expect(searchFilterStore.rollenPerPage).toEqual(rollenPerPageDefault);
    expect(searchFilterStore.selectedKategorienForServiceProvider).toEqual(DEFAULT_SERVICE_PROVIDER_KATEGORIEN);
    expect(searchFilterStore.selectedAngeboteForRollen).toEqual([]);
    expect(searchFilterStore.selectedAngeboteNamesForRollen).toEqual({});
  });

  it('should change the state', () => {
    const selectedKlassen: Organisation[] = [DoFactory.getKlasse(), DoFactory.getKlasse()];
    // it sets the selectedKlassen
    searchFilterStore.setKlasseFilterForPersonen(selectedKlassen);
    expect(searchFilterStore.selectedKlassen).toEqual(selectedKlassen);

    // it sets the selectedRollen
    const selectedRollen: RolleResponse[] = [DoFactory.getRolleResponse(), DoFactory.getRolleResponse()];
    searchFilterStore.setRolleFilterForPersonen(selectedRollen);
    expect(searchFilterStore.selectedRollen).toEqual(selectedRollen);
    searchFilterStore.setRolleFilterForPersonen(null);
    expect(searchFilterStore.selectedRollen).toBeNull();

    // it sets the selectedOrganisationen
    searchFilterStore.setOrganisationFilterForPersonen(['10', '20']);
    expect(searchFilterStore.selectedOrganisationen).toEqual(['10', '20']);

    // it sets the searchFilter for personen
    searchFilterStore.setSearchFilterForPersonen('search');
    expect(searchFilterStore.searchStringForPersonen).toEqual('search');
    searchFilterStore.setSearchFilterForPersonen(null);
    expect(searchFilterStore.searchStringForPersonen).toEqual('');

    // it sets the searchFilter for rollen name
    searchFilterStore.setSearchFilterForRollen('search');
    expect(searchFilterStore.searchStringForRollen).toEqual('search');
    searchFilterStore.setSearchFilterForRollen(null);
    expect(searchFilterStore.searchStringForRollen).toEqual('');

    // it sets the searchFilter for schulen
    searchFilterStore.setSearchFilterForSchulen('search');
    expect(searchFilterStore.searchStringForSchulen).toEqual('search');
    searchFilterStore.setSearchFilterForSchulen(null);
    expect(searchFilterStore.searchStringForSchulen).toEqual('');

    // it sets the searchFilter for service provider
    searchFilterStore.setSearchFilterForServiceProvider('search');
    expect(searchFilterStore.searchStringForServiceProvider).toEqual('search');
    searchFilterStore.setSearchFilterForServiceProvider(null);
    expect(searchFilterStore.searchStringForServiceProvider).toEqual('');

    // it sets the selectedSchuleForKlassen
    searchFilterStore.setSchuleFilterForKlassen('10');
    expect(searchFilterStore.selectedSchuleForKlassen).toEqual('10');

    // it sets the selectedKlassenForKlassen
    searchFilterStore.setKlasseFilterForKlassen(selectedKlassen);
    expect(searchFilterStore.selectedKlassenForKlassen).toEqual(selectedKlassen);

    searchFilterStore.setSchuleForMptRollen('10');
    expect(searchFilterStore.selectedSchuleForMptRollen).toEqual('10');
    searchFilterStore.setSchuleForMptRollen(null);
    expect(searchFilterStore.selectedSchuleForMptRollen).toEqual(null);

    searchFilterStore.setSchuleForSchulischeServiceProvider('10');
    expect(searchFilterStore.selectedSchuleForSchulischeServiceProvider).toEqual('10');

    searchFilterStore.setKategorienForServiceProvider([ServiceProviderKategorie.Email]);
    expect(searchFilterStore.selectedKategorienForServiceProvider).toEqual([ServiceProviderKategorie.Email]);

    // it resets the selectedKategorienForServiceProvider back to the default selection
    searchFilterStore.resetKategorienForServiceProvider();
    expect(searchFilterStore.selectedKategorienForServiceProvider).toEqual(DEFAULT_SERVICE_PROVIDER_KATEGORIEN);
  });

  it('should set merkmale filter for rollen', () => {
    searchFilterStore.setMerkmaleFilterForRollen([RollenMerkmal.KopersPflicht]);
    expect(searchFilterStore.selectedMerkmaleForRollen).toEqual([RollenMerkmal.KopersPflicht]);
  });

  it('should set rollenarten filter for rollen', () => {
    searchFilterStore.setRollenartenFilterForRollen([RollenArt.Lehr]);
    expect(searchFilterStore.selectedRollenartenForRollen).toEqual([RollenArt.Lehr]);
  });

  it('should set organisationen filter for rollen', () => {
    searchFilterStore.setOrganisationenFilterForRollen(['org1', 'org2']);
    expect(searchFilterStore.selectedOrganisationenForRollen).toEqual(['org1', 'org2']);
  });

  it('should set angebote filter for rollen', () => {
    searchFilterStore.setAngeboteFilterForRollen(['angebot1', 'angebot2']);
    expect(searchFilterStore.selectedAngeboteForRollen).toEqual(['angebot1', 'angebot2']);
  });

  it('should set angebote names for rollen', () => {
    searchFilterStore.setAngeboteNamesForRollen({ sp1: 'Provider One', sp2: 'Provider Two' });
    expect(searchFilterStore.selectedAngeboteNamesForRollen).toEqual({ sp1: 'Provider One', sp2: 'Provider Two' });
  });

  it('should overwrite existing angebote names for rollen', () => {
    searchFilterStore.setAngeboteNamesForRollen({ sp1: 'Provider One' });
    searchFilterStore.setAngeboteNamesForRollen({ sp2: 'Provider Two' });
    expect(searchFilterStore.selectedAngeboteNamesForRollen).toEqual({ sp2: 'Provider Two' });
  });
});
