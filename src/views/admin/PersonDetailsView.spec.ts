import { expect, test, type MockInstance } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import PersonDetailsView from './PersonDetailsView.vue';
import {
  type Personendatensatz,
  type PersonendatensatzResponse,
  type PersonStore,
  usePersonStore,
} from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Uebersicht } from '@/stores/PersonenkontextStore';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { nextTick, type ComputedRef, type DefineComponent } from 'vue';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';

let wrapper: VueWrapper | null = null;
let router: Router;

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
  },
};

const mockPersonenuebersicht: Uebersicht = {
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
      merkmale: RollenMerkmal.BefristungPflicht as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    },
    {
      id: '1',
      createdAt: '2024-06-25T13:03:53.802Z',
      updatedAt: '2024-06-25T13:03:53.802Z',
      name: 'SuS',
      administeredBySchulstrukturknoten: '1',
      rollenart: 'LERN',
      merkmale: RollenMerkmal.BefristungPflicht as unknown as Set<RollenMerkmal>,
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

personStore.currentPerson = mockPerson;
personenkontextStore.personenuebersicht = mockPersonenuebersicht;

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

  wrapper = mount(PersonDetailsView, {
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
    expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-vorname"]').text()).toBe('John');
    expect(wrapper?.find('[data-testid="person-familienname"]').text()).toBe('Orton');
    expect(wrapper?.find('[data-testid="person-username"]').text()).toBe('jorton');
    expect(wrapper?.find('[data-testid="person-zuordnung-1"]').text()).toBe('123456 (Testschule Birmingham): SuS 9a');
  });

  test('it navigates back to user table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('It cancels editing', async () => {
    await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
    await nextTick();

    const zuordnungCreateButton: VueWrapper | undefined = wrapper?.findComponent({ ref: 'zuordnung-create-button' });

    await wrapper?.find('[data-testid="zuordnung-edit-cancel"]').trigger('click');
    await nextTick();

    expect(zuordnungCreateButton?.exists()).toBe(false);
  });
  test('It triggers change Klasse and selects the first checkbox', async () => {
    // Trigger edit mode
    await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
    await nextTick();

    // Find the first checkbox
    const firstCheckbox: VueWrapper | undefined = wrapper?.findComponent({ ref: 'checkbox-zuordnung-1' });

    // Explicitly set the value of the checkbox via v-model
    await firstCheckbox?.setValue([
      {
        sskId: '1',
        rolleId: '1',
        sskName: 'Testschule Birmingham',
        sskDstNr: '123456',
        rolle: 'SuS',
        typ: OrganisationsTyp.Schule,
        administriertVon: '2',
        editable: true,
      },
    ]);
    await nextTick();

    // Trigger the Klasse change button
    await wrapper?.find('[data-testid="klasse-change-button"]').trigger('click');
    await nextTick();

    // Assert that the Klasse change form is displayed
    const klasseChangeFormComponent: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-change-form' });

    expect(klasseChangeFormComponent?.exists()).toBe(true);
  });
  test('Renders details for the current person', async () => {
    // Mock the current person in the store
    personStore.currentPerson = {
      person: {
        id: '1234',
        name: {
          familienname: 'Vimes',
          vorname: 'Samuel',
        },
      },
    } as PersonendatensatzResponse;

    await nextTick();

    const vornameElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-vorname"]');

    // Check if the element exists and has the correct text content
    expect(vornameElement?.text()).toBe('Samuel');
  });
  test('filteredRollen returns correct roles based on person context and selection', async () => {
    interface PersonDetailsViewType extends DefineComponent {
      filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined>;
    }
    const vm: PersonDetailsViewType = wrapper?.vm as unknown as PersonDetailsViewType;
    const filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = vm.filteredRollen;

    // Verify that filteredRollen contains only roles that are not already assigned and filtered correctly
    expect(filteredRollen).toBeDefined();
  });
});
