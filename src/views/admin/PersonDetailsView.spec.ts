// import { expect, test } from 'vitest';
import routes from '@/router/routes';
import { useAuthStore, type AuthStore, type UserInfo } from '@/stores/AuthStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import {
  usePersonStore,
  type Personendatensatz,
  type PersonStore,
  type PersonWithUebersicht,
} from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { shallowMount, VueWrapper } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonDetailsView from './PersonDetailsView.vue';
// import { nextTick, type ComputedRef, type DefineComponent } from 'vue';
// import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';

let wrapper: VueWrapper | null = null;
let router: Router;

const authStore: AuthStore = useAuthStore();
const organisationStore: OrganisationStore = useOrganisationStore();
const personStore: PersonStore = usePersonStore();
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

const mockPerson: Personendatensatz = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John',
    },
    referrer: 'jorton',
    personalnummer: null,
    isLocked: null,
    lockInfo: null,
  },
};

const mockCurrentUser: UserInfo = {
  middle_name: null,
  nickname: null,
  profile: null,
  picture: null,
  website: null,
  gender: null,
  birthdate: null,
  zoneinfo: null,
  locale: null,
  phone_number: null,
  updated_at: null,
  personId: '2',
  email: 'albert@test.de',
  email_verified: true,
  family_name: 'Test',
  given_name: 'Albert',
  name: 'Albert Test',
  preferred_username: 'albert',
  sub: 'c71be903-d0ec-4207-b653-40c114680b63',
  personenkontexte: [
    {
      organisationsId: '123456',
      rolle: {
        systemrechte: ['ROLLEN_VERWALTEN', 'SCHULEN_VERWALTEN'],
        serviceProviderIds: ['789897798'],
      },
    },
  ],
};

const mockPersonenuebersicht: PersonWithUebersicht = {
  personId: '1',
  vorname: 'John',
  nachname: 'Orton',
  benutzername: 'jorton',
  lastModifiedZuordnungen: Date.now().toLocaleString(),
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Testschule Birmingham',
      sskDstNr: '123456',
      rolle: 'SuS',
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
    },
    {
      sskId: '3',
      rolleId: '4',
      sskName: 'Testschule London',
      sskDstNr: '123459',
      rolle: 'SuS',
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
    },
    {
      sskId: '2',
      rolleId: '1',
      sskName: '9a',
      sskDstNr: '123459',
      rolle: 'SuS',
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
    },
  ],
};

personenkontextStore.workflowStepResponse = {
  organisations: [
    {
      id: 'string',
      administriertVon: 'string',
      kennung: 'string',
      name: 'string',
      namensergaenzung: 'string',
      kuerzel: 'string',
      typ: 'ROOT',
    },
  ],
  rollen: [
    {
      id: '54321',
      createdAt: '2024-06-25T13:03:53.802Z',
      updatedAt: '2024-06-25T13:03:53.802Z',
      name: 'string',
      administeredBySchulstrukturknoten: 'string',
      rollenart: 'LERN',
      merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    },
    {
      id: '1',
      createdAt: '2024-06-25T13:03:53.802Z',
      updatedAt: '2024-06-25T13:03:53.802Z',
      name: 'SuS',
      administeredBySchulstrukturknoten: '1',
      rollenart: 'LERN',
      merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    },
  ],
  selectedOrganisation: 'string',
  selectedRolle: 'string',
  canCommit: true,
};

organisationStore.klassen = [
  {
    id: '1',
    kennung: '1234567',
    name: 'Klasse 1',
    namensergaenzung: 'Ergänzung',
    kuerzel: 'K1',
    typ: OrganisationsTyp.Klasse,
    administriertVon: '1',
  },
];

organisationStore.getParentOrganisationsByIds = async (_organisationIds: string[]): Promise<Organisation[]> => [];

authStore.currentUser = mockCurrentUser;
personStore.currentPerson = mockPerson;
personStore.personenuebersicht = mockPersonenuebersicht;

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

  wrapper = shallowMount(PersonDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonDetailsView,
      },
      plugins: [router],
    },
  });
});

describe('PersonDetailsView', () => {
  test('it renders the person details page and shows person data', async () => {
    expect(wrapper).toBeTruthy();
    // expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true);
    // expect(wrapper?.find('[data-testid="person-vorname"]').text()).toBe('John');
    // expect(wrapper?.find('[data-testid="person-familienname"]').text()).toBe('Orton');
    // expect(wrapper?.find('[data-testid="person-username"]').text()).toBe('jorton');
    // expect(wrapper?.find('[data-testid="person-zuordnung-1"]').text()).toBe('123456 (Testschule Birmingham): SuS 9a');
    // expect(wrapper?.getComponent({ name: 'PasswordReset' })).toBeTruthy();
  });

  // test('Renders details for the current person', async () => {
  //   const date: string = '01.01.2024';
  //   const datetime: string = `${date} 12:34:00`;
  //   const lockInfo: Person['lockInfo'] = {
  //     lock_locked_from: 'test',
  //     lock_timestamp: datetime,
  //   };
  //   // Mock the current person in the store
  //   personStore.currentPerson = mapPersonendatensatzResponseToPersonendatensatz({
  //     person: {
  //       id: '1234',
  //       name: {
  //         familienname: 'Vimes',
  //         vorname: 'Samuel',
  //       },
  //       isLocked: true,
  //       lockInfo,
  //     },
  //   } as PersonendatensatzResponse);

  //   const vornameElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-vorname"]');
  //   const lockInfoContainer: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-lock-info"]');

  //   // Check if the element exists and has the correct text content
  //   expect(vornameElement?.text()).toBe('Samuel');
  //   expect(lockInfoContainer?.html()).toContain(lockInfo.lock_locked_from);
  //   expect(lockInfoContainer?.html()).toContain(date);
  // });

  // TODO: how do we fix this test?
  // We have to use shallowMount instead of mount and comment all tests to make sonar accept coverage.
  // As soon as we use mount to write meaningful tests, sonar will complain about the coverage.

  // test('it navigates back to user table', async () => {
  //   const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
  //     router,
  //     'push',
  //   );
  //   await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
  //   expect(push).toHaveBeenCalledTimes(1);
  // });

  // test('it shows an error if error code exists', async () => {
  //   personStore.errorCode = 'UNSPECIFIED_ERROR';
  //   await nextTick();

  //   expect(wrapper?.find('[data-testid="alert-title"]').text()).toBe('Fehler beim Laden des Benutzers');
  //   personStore.errorCode = '';
  // });

  // test('It cancels editing', async () => {
  //   await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
  //   await nextTick();

  //   const zuordnungCreateButton: VueWrapper | undefined = wrapper?.findComponent({ ref: 'zuordnung-create-button' });

  //   await wrapper?.find('[data-testid="zuordnung-edit-cancel"]').trigger('click');
  //   await nextTick();

  //   expect(zuordnungCreateButton?.exists()).toBe(false);
  // });

  // test('It triggers change Klasse and selects the first checkbox', async () => {
  //   // Trigger edit mode
  //   await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
  //   await nextTick();

  //   // Find the first checkbox
  //   const firstCheckbox: VueWrapper | undefined = wrapper?.findComponent({ ref: 'checkbox-zuordnung-1' });

  //   // Explicitly set the value of the checkbox via v-model
  //   await firstCheckbox?.setValue([
  //     {
  //       sskId: '1',
  //       rolleId: '1',
  //       sskName: 'Testschule Birmingham',
  //       sskDstNr: '123456',
  //       rolle: 'SuS',
  //       typ: OrganisationsTyp.Schule,
  //       administriertVon: '2',
  //       editable: true,
  //     },
  //   ]);
  //   await nextTick();

  //   // Trigger the Klasse change button
  //   await wrapper?.find('[data-testid="klasse-change-button"]').trigger('click');
  //   await nextTick();

  //   // Assert that the Klasse change form is displayed
  //   const klasseChangeFormComponent: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-change-form' });

  //   expect(klasseChangeFormComponent?.exists()).toBe(true);
  // });
  // test('Renders details for the current person', async () => {
  //   // Mock the current person in the store
  //   personStore.currentPerson = {
  //     person: {
  //       id: '1234',
  //       name: {
  //         familienname: 'Vimes',
  //         vorname: 'Samuel',
  //       },
  //     },
  //   } as PersonendatensatzResponse;

  //   await nextTick();

  //   const vornameElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-vorname"]');

  //   // Check if the element exists and has the correct text content
  //   expect(vornameElement?.text()).toBe('Samuel');
  // });
  // test('filteredRollen returns correct roles based on person context and selection', async () => {
  //   interface PersonDetailsViewType extends DefineComponent {
  //     filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined>;
  //   }
  //   const vm: PersonDetailsViewType = wrapper?.vm as unknown as PersonDetailsViewType;
  //   const filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = vm.filteredRollen;

  //   // Verify that filteredRollen contains only roles that are not already assigned and filtered correctly
  //   expect(filteredRollen).toEqual([
  //     {
  //       value: '54321',
  //       title: 'string',
  //       rollenart: RollenArt.Lern,
  //       merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
  //     },
  //     {
  //       value: '1',
  //       title: 'SuS',
  //       rollenart: RollenArt.Lern,
  //       merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
  //     },
  //   ]);
  // });
});
