import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import PersonCreationView from './PersonCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { Vertrauensstufe, type DBiamPersonResponse } from '@/api-client/generated';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import {
  RollenMerkmal,
  RollenSystemRecht,
  useRolleStore,
  type RolleStore,
  type RolleWithServiceProvidersResponse,
} from '@/stores/RolleStore';

let wrapper: VueWrapper | null = null;
let router: Router;

const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
const organisationStore: OrganisationStore = useOrganisationStore();
const rolleStore: RolleStore = useRolleStore();

const mockCreatedPersonWithKontext: DBiamPersonResponse = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John',
    },
    referrer: 'jorton',
    personalnummer: '123456',
    mandant: '',
    geburt: null,
    stammorganisation: null,
    geschlecht: null,
    lokalisierung: null,
    vertrauensstufe: Vertrauensstufe.Kein,
    revision: '',
    startpasswort: '',
    isLocked: false,
    lockInfo: null,
    lastModified: '2024-12-22',
  },
  dBiamPersonenkontextResponses: [
    {
      befristung: '2024-05-06',
      personId: '1',
      organisationId: '9876',
      rolleId: '1',
    },
  ],
};

organisationStore.allOrganisationen = [
  {
    id: '9876',
    name: 'Random Schulname Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'rsg',
    typ: 'SCHULE',
    administriertVon: '1234',
  },
  {
    id: '1123',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '2745475',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1234',
  },
  {
    id: '1234',
    name: 'Land SH',
    kennung: '',
    namensergaenzung: 'land',
    kuerzel: 'LSH',
    typ: 'TRAEGER',
    administriertVon: '1',
  },
];

rolleStore.allRollen = [
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LEHR',
    name: 'Lehrer',
    // TODO: remove type casting when generator is fixed
    merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
    systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '1',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
      {
        id: '2',
        name: 'E-Mail',
      },
    ],
  },
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LERN',
    name: 'SuS',
    // TODO: remove type casting when generator is fixed
    merkmale: [] as unknown as Set<RollenMerkmal>,
    systemrechte: [] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '2',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
    ],
  },
] as RolleWithServiceProvidersResponse[];

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(PersonCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
    },
  });
});

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper).toBeTruthy();
    // expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
  });

  // TODO: how do we fix this test?
  // We have to use shallowMount instead of mount and comment all tests to make sonar accept coverage.
  // As soon as we use mount to write meaningful tests, sonar will complain about the coverage.

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'PersonenkontextCreate' })).toBeTruthy();
  });

  test('it fills form and triggers submit', async () => {
    const organisationSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'organisation-select' });
    await organisationSelect?.setValue('9876');
    await nextTick();

    const rolleSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'rolle-select' });
    await rolleSelect?.setValue('1');
    await nextTick();

    const vornameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'vorname-input' });
    await vornameInput?.setValue('Randy');
    await nextTick();

    const nachnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'familienname-input' });
    await nachnameInput?.setValue('Cena');
    await nextTick();

    personenkontextStore.createdPersonWithKontext = mockCreatedPersonWithKontext;

    wrapper?.find('[data-testid="person-creation-form-create-button"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-person-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-person-button"]').trigger('click');
    await nextTick();

    expect(personenkontextStore.createdPersonWithKontext).toBe(null);
  });

  test('it renders success template', async () => {
    personenkontextStore.createdPersonWithKontext = mockCreatedPersonWithKontext;
    await nextTick();

    expect(wrapper?.find('[data-testid="person-success-text"]').isVisible()).toBe(true);
  });
});
