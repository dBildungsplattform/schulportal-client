import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonManagementView from './PersonManagementView.vue';
import { usePersonStore, type PersonendatensatzResponse, type PersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { nextTick } from 'vue';
import { useRolleStore, type RolleResponse, type RolleStore } from '@/stores/RolleStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import type { FindRollenResponse } from '@/api-client/generated/api';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let personStore: PersonStore;
let personenkontextStore: PersonenkontextStore;
let rolleStore: RolleStore;
let searchFilterStore: SearchFilterStore;

beforeEach(() => {
  mockadapter.reset();

  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();
  personStore = usePersonStore();
  personenkontextStore = usePersonenkontextStore();
  rolleStore = useRolleStore();
  searchFilterStore = useSearchFilterStore();

  organisationStore.klassen = [
    {
      id: '123456',
      name: '11b',
      kennung: '9356494-11b',
      namensergaenzung: 'Klasse',
      kuerzel: '11b',
      typ: 'KLASSE',
      administriertVon: '1',
    },
  ];
  organisationStore.allOrganisationen = [
    {
      id: '9876',
      name: 'Random Schulname Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'rsg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
    {
      id: '1123',
      name: 'Albert-Emil-Hansebrot-Gymnasium',
      kennung: '2745475',
      namensergaenzung: 'Schule',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];
  personenkontextStore.allUebersichten = {
    total: 0,
    offset: 0,
    limit: 0,
    items: [
      {
        personId: '1234',
        vorname: 'Samuel',
        nachname: 'Vimes',
        benutzername: 'string',
        lastModifiedZuordnungen: null,
        zuordnungen: [
          {
            sskId: 'string',
            rolleId: 'string',
            sskName: 'string',
            sskDstNr: 'string',
            rolle: 'string',
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
          },
        ],
      },
    ],
  };
  personStore.allPersons = [
    {
      person: {
        id: '1234',
        name: {
          familienname: 'Vimes',
          vorname: 'Samuel',
        },
      },
    },
    {
      person: {
        id: '5678',
        name: {
          familienname: 'von Lipwig',
          vorname: 'Moist',
        },
      },
    },
  ] as PersonendatensatzResponse[];
  personenkontextStore.filteredRollen = {
    moeglicheRollen: [
      {
        id: '1',
        administeredBySchulstrukturknoten: '1',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      },
    ] as RolleResponse[],
    total: 1,
  } as FindRollenResponse;

  wrapper = mount(PersonManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonManagementView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
      provide: {
        organisationStore,
        personStore,
        personenkontextStore,
        rolleStore,
        searchFilterStore,
      },
    },
  });
});

describe('PersonManagementView', () => {
  test('it renders the person management table', () => {
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
  });

  test('it sets filters', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    expect(schuleAutocomplete?.text()).toEqual('9356494 (Random Schulname Gymnasium)');

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue(['1']);
    await nextTick();

    expect(rolleAutocomplete?.text()).toEqual('Rolle 1');

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue(['123456']);
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('11b');
  });
});
