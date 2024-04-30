import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonManagementView from './PersonManagementView.vue';
import { usePersonStore, type PersonendatensatzResponse, type PersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { OrganisationsTyp } from '@/stores/OrganisationStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let personStore: PersonStore;
let personenkontextStore: PersonenkontextStore;
beforeEach(() => {
  mockadapter.reset();

  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  personStore = usePersonStore();
  personenkontextStore = usePersonenkontextStore();
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
        zuordnungen: [
          {
            sskId: 'string',
            rolleId: 'string',
            sskName: 'string',
            sskDstNr: 'string',
            rolle: 'string',
            typ: OrganisationsTyp.Klasse,
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
    },
  });
});

describe('PersonManagementView', () => {
  test('it renders the person management table', () => {
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
  });
});
