import { RollenArt, RollenSystemRecht, type FindRollenResponse } from '@/api-client/generated/api';
import routes from '@/router/routes';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import { OperationType } from '@/stores/BulkOperationStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { useRolleStore, type RolleResponse, type RolleStore, type RollenMerkmal } from '@/stores/RolleStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import type { Person } from '@/stores/types/Person';
import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import type { Zuordnung } from '@/stores/types/Zuordnung';
import { DoFactory } from 'test/DoFactory';
import { DOMWrapper, VueWrapper, flushPromises, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonManagementView from './PersonManagementView.vue';

let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let personStore: PersonStore;
let personenkontextStore: PersonenkontextStore;
let rolleStore: RolleStore;
let searchFilterStore: SearchFilterStore;
let authStore: AuthStore;
let router: Router;

vi.useFakeTimers();

beforeEach(async () => {
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
  authStore = useAuthStore();

  authStore.hasPersonenBulkPermission = true;
  authStore.hasPersonenLoeschenPermission = true;
  authStore.hasPersonenverwaltungPermission = true;

  personStore.getAllPersons = vi.fn();
  organisationStore.getFilteredKlassen = vi.fn();
  organisationStore.getAllOrganisationen = vi.fn();
  personenkontextStore.getPersonenkontextRolleWithFilter = vi.fn();
  personenkontextStore.processWorkflowStep = vi.fn();

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
      id: '198',
      name: 'Realschule Randomname',
      kennung: '13465987',
      namensergaenzung: 'Schule',
      kuerzel: 'rsrn',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];

  personStore.allUebersichten = new Map();
  for (let index: number = 0; index < 5; index++) {
    const person: Person = DoFactory.getPerson();
    const zuordnung: Zuordnung = DoFactory.getZuordnung({ rollenArt: RollenArt.Lern });
    const personWithZuordnungen: PersonWithZuordnungen = DoFactory.getPersonWithZuordnung(person, [zuordnung]);
    personStore.allUebersichten.set(personWithZuordnungen.id, personWithZuordnungen);
  }

  personStore.totalPersons = personStore.allUebersichten.size;

  personenkontextStore.filteredRollen = {
    moeglicheRollen: [
      {
        id: '10',
        administeredBySchulstrukturknoten: '1',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      },
    ] as RolleResponse[],
    total: 1,
  } as FindRollenResponse;

  personenkontextStore.workflowStepResponse = {
    rollen: [
      {
        administeredBySchulstrukturknoten: '1234',
        rollenart: 'LEHR',
        name: 'SuS',
        merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
        systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
        createdAt: '2022',
        updatedAt: '2022',
        id: '54321',
        administeredBySchulstrukturknotenName: 'Land SH',
        administeredBySchulstrukturknotenKennung: '',
        version: 1,
      },
    ],
    organisations: [],
    selectedOrganisation: null,
    selectedRollen: null,
    canCommit: true,
  };

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

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
        authStore,
      },
      plugins: [router],
    },
  });
});

describe('PersonManagementView', () => {
  test('it renders person management table', () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(personStore.allUebersichten.size);
  });

  test('it renders person management table with active orga filter', () => {
    searchFilterStore.selectedOrganisationen = ['9876'];
    searchFilterStore.selectedRollen = null;
    searchFilterStore.selectedKlassen = null;
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(personStore.allUebersichten.size);
  });

  test('it renders person management table with active rolle filter', () => {
    searchFilterStore.selectedOrganisationen = null;
    searchFilterStore.selectedRollen = ['10'];
    searchFilterStore.selectedKlassen = null;
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(personStore.allUebersichten.size);
  });

  test('it navigates to details view', async () => {
    const spy: MockInstance = vi.spyOn(router, 'push');
    const person: Person = DoFactory.getPerson();
    const zuordnung: Zuordnung = DoFactory.getZuordnung({ rollenArt: RollenArt.Lern });
    const personWithZuordnungen: PersonWithZuordnungen = DoFactory.getPersonWithZuordnung(person, [zuordnung]);
    personStore.allUebersichten.clear();
    personStore.allUebersichten.set(personWithZuordnungen.id, personWithZuordnungen);
    await flushPromises();

    const row: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-table"] .v-data-table__tr');
    await row?.trigger('click');
    const personRow: Record<string, string | null> = {
      id: personWithZuordnungen.id,
      familienname: personWithZuordnungen.name.familienname,
      vorname: personWithZuordnungen.name.vorname,
      referrer: personWithZuordnungen.referrer,
      personalnummer: personWithZuordnungen.personalnummer,
      rollen: personWithZuordnungen.rollenAsString,
      administrationsebenen: personWithZuordnungen.administrationsebenenAsString,
      klassen: personWithZuordnungen.klassenZuordnungenAsString,
    };
    await wrapper?.getComponent({ name: 'ResultTable' }).vm.$emit('onHandleRowClick', undefined, { item: personRow });
    await nextTick();

    expect(spy).toHaveBeenCalledWith({
      name: 'person-details',
      params: {
        id: personWithZuordnungen.id,
      },
    });
  });

  test('it autoselects orga if only one is available', async () => {
    /* set all orgas to 1 */
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
    ];
    await flushPromises();

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    expect(schuleAutocomplete?.text()).toContain('9356494 (Random Schulname Gymnasium)');

    /* reset all orgas back to 2 */
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
        id: '198',
        name: 'Realschule Randomname',
        kennung: '13465987',
        namensergaenzung: 'Schule',
        kuerzel: 'rsrn',
        typ: 'SCHULE',
        administriertVon: '1',
      },
    ];
  });

  test('it reloads data after changing page', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue(['123456']);
    await nextTick();

    // Mock the getAllPersons method to capture its arguments
    const getAllPersonsSpy: MockInstance = vi.spyOn(personStore, 'getAllPersons');

    expect(wrapper?.find('.v-pagination__next button.v-btn--disabled').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain(`1-${personStore.allUebersichten.size}`);

    personStore.totalPersons = 50;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
    expect(wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').isVisible()).toBe(true);
    await wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('31-50');
    // Check if getAllPersons was called with the correct arguments
    expect(getAllPersonsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationIDs: ['123456'], // This should be the selectedKlassen value
      }),
    );
    // Clear selectedKlassen and test again
    await klasseAutocomplete?.setValue([]);
    await nextTick();

    await wrapper?.find('.v-pagination__prev button:not(.v-btn--disabled)').trigger('click');

    // Now it should use selectedSchulen
    expect(getAllPersonsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationIDs: ['9876'], // This should be the selectedSchulen value
      }),
    );
  });

  test('it reloads data after changing limit', async () => {
    expect(wrapper?.find('.v-data-table-footer__items-per-page').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');

    const component: WrapperLike | undefined = wrapper?.findComponent('.v-data-table-footer__items-per-page .v-select');
    await component?.setValue(50);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('50');

    /* set a limit lower than total persons */
    personStore.totalPersons = 100;
    await component?.setValue(30);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');
  });

  test('it sets and resets filters', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    expect(schuleAutocomplete?.text()).toEqual('9356494 (Random Schulname Gymnasium)');

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue(['1']);
    await nextTick();

    expect(rolleAutocomplete?.text()).toEqual('1');

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue(['123456']);
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('11b');

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(schuleAutocomplete?.text()).toBe('');
    expect(rolleAutocomplete?.text()).toBe('');
    expect(klasseAutocomplete?.text()).toBe('');
  });

  test('it updates Organisation search correctly', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    await organisationAutocomplete?.setValue('org');
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', '2');
    await nextTick();
    expect(organisationStore.getAllOrganisationen).toHaveBeenCalled();
  });

  test('it updates Rollen search correctly', async () => {
    searchFilterStore.selectedRollenObjects = [
      {
        id: '1',
        administeredBySchulstrukturknoten: '1',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      },
    ] as RolleResponse[];

    const rollenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });

    searchFilterStore.searchFilterPersonen = 'test search';

    // Mock the getPersonenkontextRolleWithFilter method
    const mockGetPersonenkontextRolleWithFilter: Mock = vi.fn().mockResolvedValue({
      moeglicheRollen: [{ id: '1', name: 'Test Rolle' }],
      total: 1,
    });
    personenkontextStore.getPersonenkontextRolleWithFilter = mockGetPersonenkontextRolleWithFilter;

    // Trigger the search
    await rollenAutocomplete?.setValue(['name']);
    await rollenAutocomplete?.vm.$emit('update:search', 'name');

    // Fast-forward timers
    vi.runAllTimers();

    // Wait for all promises to resolve
    await vi.runAllTicks();

    // Assert that the method was called
    expect(mockGetPersonenkontextRolleWithFilter).toHaveBeenCalledWith('name', 25);

    // Add more assertions here to check the state after the search
    expect(personenkontextStore.filteredRollen).toBeDefined();
    expect(personenkontextStore.filteredRollen?.moeglicheRollen).toHaveLength(1);
  });

  type BulkOperationTestParams = {
    operationType: OperationType;
    layoutCardTestId: string;
    discardButtonTestId: string;
  };

  test.each([
    {
      operationType: OperationType.CHANGE_KLASSE,
      layoutCardTestId: 'change-klasse-layout-card',
      discardButtonTestId: 'bulk-change-klasse-discard-button',
    },
    {
      operationType: OperationType.DELETE_PERSON,
      layoutCardTestId: 'person-delete-layout-card',
      discardButtonTestId: 'person-delete-discard-button',
    },
    {
      operationType: OperationType.MODIFY_ROLLE,
      layoutCardTestId: 'rolle-modify-layout-card',
      discardButtonTestId: 'rolle-modify-discard-button',
    },
    {
      operationType: OperationType.ORG_UNASSIGN,
      layoutCardTestId: 'org-unassign-layout-card',
      discardButtonTestId: 'org-unassign-discard-button',
    },
    {
      operationType: OperationType.RESET_PASSWORD,
      layoutCardTestId: 'password-reset-layout-card',
      discardButtonTestId: 'password-reset-discard-button',
    },
  ])(
    'it checks a checkbox in the table, selects $operationType, triggers dialog then cancels it',
    async ({ operationType, layoutCardTestId, discardButtonTestId }: BulkOperationTestParams) => {
      const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
      await schuleAutocomplete?.setValue(['9876']);
      await nextTick();
      // Find the first checkbox in the table
      const checkbox: DOMWrapper<Element> | undefined = wrapper?.find(
        '[data-testid="person-table"] .v-selection-control',
      );
      // Initial state check (optional)
      expect(checkbox?.classes()).not.toContain('v-selection-control--selected');
      // Trigger the checkbox click
      await checkbox?.trigger('click');
      await nextTick();

      const benutzerEditSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'benutzer-bulk-edit-select' });
      benutzerEditSelect?.setValue(operationType);
      await nextTick();

      expect(document.body.querySelector(`[data-testid="${layoutCardTestId}"]`)).not.toBeNull();

      const cancelButton: Element | null = document.querySelector(`[data-testid="${discardButtonTestId}"]`);
      cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();

      expect(document.body.querySelector(`[data-testid="${layoutCardTestId}"]`)).toBeNull();
    },
  );

  test.each([
    [OperationType.CHANGE_KLASSE],
    [OperationType.DELETE_PERSON],
    // [OperationType.MODIFY_ROLLE],
    [OperationType.ORG_UNASSIGN],
    [OperationType.RESET_PASSWORD],
  ])('%s is not shown if user has no permission', async (operationType: OperationType) => {
    authStore.hasPersonenLoeschenPermission = false;
    authStore.hasPersonenverwaltungPermission = false;

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
          authStore,
        },
      },
    });

    // Find the first checkbox in the table
    const checkbox: DOMWrapper<Element> | undefined = wrapper.find('[data-testid="person-table"] .v-selection-control');
    // Initial state check (optional)
    expect(checkbox.classes()).not.toContain('v-selection-control--selected');

    // Trigger the checkbox click
    await checkbox.trigger('click');
    await nextTick();

    const benutzerEditSelect: VueWrapper | undefined = wrapper.findComponent({ ref: 'benutzer-bulk-edit-select' });

    // eslint-disable-next-line @typescript-eslint/dot-notation
    (benutzerEditSelect.props() as { items: { value: string }[] })['items'].forEach((item: { value: string }) => {
      expect(item.value).not.toBe(operationType);
    });
  });

  test('it shows the error dialog, when the selection is invalid', async () => {
    // don't select schule and select a person without LERN-rolle
    personStore.allUebersichten = new Map();
    const person: Person = DoFactory.getPerson();
    const zuordnung: Zuordnung = DoFactory.getZuordnung({ rollenArt: RollenArt.Leit });
    personStore.allUebersichten.set(person.id, DoFactory.getPersonWithZuordnung(person, [zuordnung]));

    await flushPromises();

    const checkbox: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="person-table"] .v-selection-control',
    );
    // Initial state check (optional)
    expect(checkbox?.classes()).not.toContain('v-selection-control--selected');
    // Trigger the checkbox click
    await checkbox?.trigger('click');
    await nextTick();
    wrapper?.findComponent({ name: 'ResultTable' }).vm.$emit('update:selectedRows', [person.id]);
    await nextTick();

    const benutzerEditSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'benutzer-bulk-edit-select' });
    benutzerEditSelect?.setValue(OperationType.CHANGE_KLASSE);
    await nextTick();

    expect(document.body.querySelector(`[data-testid="invalid-selection-alert-dialog-layout-card"]`)).not.toBeNull();
    expect(
      document.body.querySelector(`[data-testid="invalid-selection-alert-dialog-layout-card"]`)?.textContent,
    ).toContain('genau eine Schule');
    expect(
      document.body.querySelector(`[data-testid="invalid-selection-alert-dialog-layout-card"]`)?.textContent,
    ).toContain('Schülerrolle');
  });

  test('it sorts Personen correctly when changing sort order', async () => {
    // Find the table header for "Nachname" (last name)
    const nachnameHeader: DOMWrapper<Element> | undefined = wrapper
      ?.findAll('.v-data-table__th')
      .find((th: DOMWrapper<Element>) => th.text().includes('Nachname'));

    // Click to sort descending
    await nachnameHeader?.trigger('click');
    await flushPromises();
    await nextTick();

    expect(personStore.getAllPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: 'familienname',
        sortOrder: 'desc',
      }),
    );

    // Click again to sort ascending
    await nachnameHeader?.trigger('click');
    await flushPromises();

    expect(personStore.getAllPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: 'familienname',
        sortOrder: 'asc',
      }),
    );

    // Find the table header for "Nachname" (last name)
    const vornameHeader: DOMWrapper<Element> | undefined = wrapper
      ?.findAll('.v-data-table__th')
      .find((th: DOMWrapper<Element>) => th.text().includes('Vorname'));

    // Click to sort asc
    await vornameHeader?.trigger('click');
    await flushPromises();
    await nextTick();

    expect(personStore.getAllPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: 'vorname',
        sortOrder: 'asc',
      }),
    );

    // Click again to sort desc
    await vornameHeader?.trigger('click');
    await flushPromises();
    await nextTick();
    expect(personStore.getAllPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: 'vorname',
        sortOrder: 'desc',
      }),
    );
  });
});
