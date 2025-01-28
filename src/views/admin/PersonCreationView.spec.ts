import { expect, type MockInstance, test } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import PersonCreationView from './PersonCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { Vertrauensstufe, type DBiamPersonResponse } from '@/api-client/generated';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { type PersonStore, usePersonStore } from '@/stores/PersonStore';
import {
  RollenMerkmal,
  RollenSystemRecht,
  useRolleStore,
  type RolleStore,
  type RolleWithServiceProvidersResponse,
} from '@/stores/RolleStore';
import { EmailAddressStatus } from '@/api-client/generated/api';

let wrapper: VueWrapper | null = null;
let router: Router;

const personStore: PersonStore = usePersonStore();
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
    userLock: null,
    lastModified: '2024-12-22',
    email: {
      address: 'email',
      status: EmailAddressStatus.Requested,
    },
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
    typ: 'LAND',
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
    rollenart: 'LERN',
    name: 'SuS',
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
  test('it renders the person creation form and its child components', () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'PersonenkontextCreate' })).toBeTruthy();
  });

  it('emits update:calculatedBefristungOption event with a value', async () => {
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

    // Get the BefristungInput component
    const personenkontextCreate: VueWrapper | undefined = wrapper?.findComponent({ name: 'PersonenkontextCreate' });

    // Emit the event from the child component
    await personenkontextCreate?.vm.$emit('update:calculatedBefristungOption', 'someOption');

    // Assert that the parent component emitted the event
    expect(
      wrapper?.findComponent({ ref: 'personenkontext-create' }).emitted('update:calculatedBefristungOption'),
    ).toBeTruthy();
    expect(
      wrapper?.findComponent({ ref: 'personenkontext-create' }).emitted('update:calculatedBefristungOption')![0],
    ).toEqual(['someOption']);
  });

  it('emits update:calculatedBefristungOption event with no value', async () => {
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

    // Get the BefristungInput component
    const personenkontextCreate: VueWrapper | undefined = wrapper?.findComponent({ name: 'PersonenkontextCreate' });

    // Emit the event from the child component
    await personenkontextCreate?.vm.$emit('update:calculatedBefristungOption', undefined);

    // Assert that the parent component emitted the event
    expect(
      wrapper?.findComponent({ ref: 'personenkontext-create' }).emitted('update:calculatedBefristungOption'),
    ).toBeTruthy();
    expect(
      wrapper?.findComponent({ ref: 'personenkontext-create' }).emitted('update:calculatedBefristungOption')![0],
    ).toEqual([undefined]);
  });

  test('it renders an error', async () => {
    personStore.errorCode = 'ERROR_ERROR';
    await nextTick();
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it navigates back to personen table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
    expect(personenkontextStore.createdPersonWithKontext).toBe(null);
  });

  test('it fills form and triggers submit', async () => {
    personenkontextStore.workflowStepResponse = {
      organisations: [
        {
          id: '9876',
          kennung: '',
          name: 'Organisation1',
          namensergaenzung: 'string',
          kuerzel: 'string',
          typ: 'TRAEGER',
          administriertVon: '1',
        },
      ],
      rollen: [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LERN',
          name: 'SuS',
          merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
          systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
          createdAt: '2022',
          updatedAt: '2022',
          id: '1',
          administeredBySchulstrukturknotenName: 'Land SH',
          administeredBySchulstrukturknotenKennung: '',
          version: 1,
        },
      ],
      selectedOrganisation: null,
      selectedRolle: null,
      canCommit: true,
    };

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

    const klasseSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'klasse-select' });
    await klasseSelect?.setValue('9a');
    await nextTick();

    const befristungInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'befristung' })
      .findComponent({ ref: 'befristung-input' });
    await befristungInput?.setValue('12.08.2099');
    await nextTick();

    const vornameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'vorname-input' });
    await vornameInput?.setValue('Randy');
    await nextTick();

    const nachnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'familienname-input' });
    await nachnameInput?.setValue('Cena');
    await nextTick();

    const kopersInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'kopers-input' })
      .findComponent({ ref: 'kopersnr-input' });
    await kopersInput?.setValue('23234');
    await nextTick();

    wrapper?.find('[data-testid="person-creation-form-submit-button"]').trigger('click');
    await nextTick();
    await flushPromises();

    // Form is resetting after submit so orga should be undefined
    expect(organisationSelect?.vm.$data).toStrictEqual({});
  });

  test('it renders success template and navigates back to form', async () => {
    personenkontextStore.createdPersonWithKontext = mockCreatedPersonWithKontext;
    await nextTick();

    expect(wrapper?.find('[data-testid="person-success-text"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="create-another-person-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-person-button"]').trigger('click');

    expect(wrapper?.find('[data-testid="person-success-text"]').isVisible()).toBe(true);
  });

  test('it navigates to person details when clicking on btn in success template', async () => {
    personenkontextStore.createdPersonWithKontext = mockCreatedPersonWithKontext;
    await nextTick();
    expect(wrapper?.find('[data-testid="to-details-button"]').isVisible()).toBe(true);
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="to-details-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledWith({ name: 'person-details', params: { id: '1' } });
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
    personenkontextStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });
});
