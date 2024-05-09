import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { nextTick } from 'vue';
import type { DBiamPersonenkontextResponse, RollenMerkmal, RollenSystemRecht } from '@/api-client/generated';
import { useRolleStore, type RolleStore } from '@/stores/RolleStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let personenkontextStore: PersonenkontextStore;
let rolleStore: RolleStore;

beforeEach(() => {
  mockadapter.reset();
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();
  personenkontextStore = usePersonenkontextStore();
  rolleStore = useRolleStore();
  personenkontextStore.filteredOrganisationen = {
    moeglicheSsks: [
      {
        id: 'string',
        kennung: 'string',
        name: 'Organisation1',
        namensergaenzung: 'string',
        kuerzel: 'string',
        typ: 'TRAEGER',
        administriertVon: '1',
      },
    ],
    total: 0,
  };

  personenkontextStore.createdPersonenkontextForOrganisation = {
    personId: '12345',
    organisationId: '67890',
    rolleId: '54321',
  } as DBiamPersonenkontextResponse;

  organisationStore.klassen = [
    {
      id: '1',
      kennung: 'Org1',
      name: '9a',
      namensergaenzung: 'Ergänzung',
      kuerzel: 'O1',
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
    },
    {
      id: '2',
      kennung: 'Org2',
      name: '9b',
      namensergaenzung: 'Ergänzung',
      kuerzel: 'O2',
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
    },
  ];

  rolleStore.allRollen =[
    {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LERN',
      name: 'SuS',
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '54321',
    },
  ];
  wrapper = mount(PersonCreationView, {
    propsData: {
      searchInputKlasse: 'Testing the ref',
      searchInputOrganisation: 'Testing the ref',
    },
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonCreationView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it calls watchers for selected rolle and organisation with value', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9b');
    await nextTick();
  
    expect(organisationAutocomplete?.text()).toEqual('O1');
    expect(klasseAutocomplete?.text()).toEqual('Some value');
  });

  test('it calls watchers for unselected organisation', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue(undefined);
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    expect(organisationAutocomplete?.exists()).toBe(false);
  });
});
