import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { nextTick } from 'vue';
import type {
  DBiamPersonResponse,
  DBiamPersonenkontextResponse,
  RollenMerkmal,
  RollenSystemRecht,
} from '@/api-client/generated';
import { usePersonStore, type PersonStore } from '@/stores/PersonStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let personenkontextStore: PersonenkontextStore;
let personStore: PersonStore;

beforeEach(() => {
  mockadapter.reset();
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();
  personenkontextStore = usePersonenkontextStore();
  personStore = usePersonStore();

  personenkontextStore.filteredOrganisationen = {
    moeglicheSsks: [
      {
        id: 'string',
        kennung: '',
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

  personenkontextStore.createdPersonenkontextForKlasse = {
    personId: '12345',
    organisationId: '55555',
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

  personenkontextStore.filteredRollen = {
    moeglicheRollen: [
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
    ],
    total: 1,
  };

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

  test('it updates search and sets values selected rolle, organisation and klasse', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.vm.$emit('update:search', '54321');
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.vm.$emit('update:search', '01');
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.vm.$emit('update:search', '55555');
    await klasseAutocomplete?.setValue('55555');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('55555');
  });

  test('it resets field Organisation when Rolle is reset after being selected', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();
  });

  test('it resets field Klasse when organisation is reset after being selected', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();

    await rolleAutocomplete?.setValue(undefined);
    await nextTick();

    expect(organisationAutocomplete?.exists()).toBe(false);
  });

  test('it triggers submit', async () => {
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();

    const familiennameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'familienname-input' });
    await familiennameInput?.setValue('Mustermann');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('55555');
    await nextTick();

    const mockPerson: DBiamPersonResponse = {
      person: {
        id: '9876',
        name: {
          familienname: 'Cena',
          vorname: 'Randy',
        },
        referrer: 'rcena',
        mandant: '',
        geburt: null,
        stammorganisation: null,
        geschlecht: null,
        lokalisierung: null,
        vertrauensstufe: 'KEIN',
        revision: '',
        startpasswort: '',
        personalnummer: null,
      },
      DBiamPersonenkontextResponse: {
        organisationId: '12345',
        rolleId: '54321',
        personId: '9876',
      },
    };

    personStore.createdPersonWithKontext = mockPerson;

    wrapper?.find('[data-testid="person-creation-form-create-button"]').trigger('click');
    await nextTick();
  });
});
