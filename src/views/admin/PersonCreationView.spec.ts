import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let personenkontextStore: PersonenkontextStore;
beforeEach(async () => {
  mockadapter.reset();
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();
  personenkontextStore = usePersonenkontextStore();
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

  wrapper = mount(PersonCreationView, {
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
  await wrapper.vm.$nextTick();
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
  test('searchInputKlasse watcher is triggered when search input changes', async () => {
    // Set up spy for the organisationStore.getKlassenByOrganisationId method
    const getKlassenSpy: MockInstance<
      [organisationId: string, searchFilter?: string | undefined],
      Promise<void>
    > = vi.spyOn(organisationStore, 'getKlassenByOrganisationId');

    // Mount the component
    wrapper = mount(PersonCreationView, {
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
    // Wait for the next tick to ensure reactivity has been triggered
    await wrapper.vm.$nextTick();
    // Change the value of searchInputKlasse
    await wrapper.setData({ searchInputKlasse: 'search value' });
    // Wait for the next tick to ensure the watcher has been triggered
    await wrapper.vm.$nextTick();
    // Expect that the organisationStore.getKlassenByOrganisationId method has been called
    expect(getKlassenSpy).toHaveBeenCalledTimes(1);
  });
});
