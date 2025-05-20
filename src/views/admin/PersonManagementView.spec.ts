import { EmailAddressStatus, RollenArt, RollenSystemRecht, type FindRollenResponse } from '@/api-client/generated/api';
import routes from '@/router/routes';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import { OrganisationsTyp, useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { useRolleStore, type RolleResponse, type RolleStore, type RollenMerkmal } from '@/stores/RolleStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import { DOMWrapper, VueWrapper, flushPromises, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonManagementView from './PersonManagementView.vue';
import { DoFactory } from '@/testing/DoFactory';

let wrapper: VueWrapper | null = null;
let router: Router;

let organisationStore: OrganisationStore;
let personStore: PersonStore;
let personenkontextStore: PersonenkontextStore;
let rolleStore: RolleStore;
let searchFilterStore: SearchFilterStore;
let authStore: AuthStore;

vi.useFakeTimers();

function mountComponent(): VueWrapper {
  return mount(PersonManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonManagementView,
      },
      plugins: [router],
    },
  });
}

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

  // searchFilterStore.setOrganisationFilterForPersonen = vi.fn(async (ids: Array<string> | null) => {
  //   searchFilterStore.selectedOrganisationen = ids;
  // });
  // searchFilterStore.setKlasseFilterForPersonen = vi.fn(async (ids: Array<string> | null) => {
  //   searchFilterStore.selectedKlassen = ids;
  // });

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
            rollenArt: RollenArt.Lern,
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
            merkmale: [] as unknown as RollenMerkmal,
            befristung: '2024-05-06',
            admins: ['test'],
          },
        ],
      },
    ],
  };

  personStore.personenWithUebersicht = [
    {
      rollen: 'Admin',
      administrationsebenen: 'Level1',
      klassen: 'Class1',
      person: {
        id: '1234',
        name: {
          familienname: 'Vimes',
          vorname: 'Samuel',
        },
        referrer: '123',
        personalnummer: '46465',
        isLocked: false,
        userLock: null,
        revision: '1',
        lastModified: '2024-05-22',
        email: {
          address: 'email',
          status: EmailAddressStatus.Requested,
        },
      },
    },
    {
      rollen: 'User',
      administrationsebenen: 'Level2',
      klassen: 'Class2',
      person: {
        id: '5678',
        name: {
          familienname: 'von Lipwig',
          vorname: 'Moist',
        },
        referrer: '1234',
        personalnummer: '46471',
        isLocked: false,
        userLock: null,
        revision: '1',
        lastModified: '2024-05-22',
        email: {
          address: 'email',
          status: EmailAddressStatus.Requested,
        },
      },
    },
  ];

  personStore.totalPersons = 2;

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

  wrapper = mountComponent();
});

describe('PersonManagementView', () => {
  test('it renders person management table', () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
  });

  test('it renders person management table with active orga filter', () => {
    searchFilterStore.selectedOrganisationen = ['9876'];
    searchFilterStore.selectedRollen = null;
    searchFilterStore.selectedKlassen = null;
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
  });

  test('it renders person management table with active rolle filter', () => {
    searchFilterStore.selectedOrganisationen = null;
    searchFilterStore.selectedRollen = ['10'];
    searchFilterStore.selectedKlassen = null;
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
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

  test('selection is mirrored in the store', async () => {
    const orgId: Array<string> = ['9876'];
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue(orgId);
    organisationAutocomplete?.vm.$emit('update:modelValue', orgId);
    await flushPromises();
    expect(searchFilterStore.setOrganisationFilterForPersonen).toHaveBeenCalledWith(orgId);
    // TODO: the setter does not work
    // expect(searchFilterStore.selectedOrganisationen).toEqual(orgId);
  });

  test('it calls getAllPersons with correct arguments', async () => {
    const getAllPersonsSpy: MockInstance = vi.spyOn(personStore, 'getAllPersons');
    searchFilterStore.selectedOrganisationen = ['9876'];

    searchFilterStore.selectedKlassen = ['123456'];
    const klasseAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-select' })
      .findComponent({ name: 'v-autocomplete' });
    await klasseAutocomplete?.setValue(['123456']);
    klasseAutocomplete?.vm.$emit('update:selectedKlassen', ['123456']);
    await flushPromises();
    expect(searchFilterStore.setKlasseFilterForPersonen).toHaveBeenCalledWith(['123456']);
    expect(searchFilterStore.selectedKlassen).toEqual(['123456']);

    // Check if getAllPersons was called with the correct arguments
    expect(getAllPersonsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationIDs: ['123456'], // This should be the selectedKlassen value
      }),
    );

    searchFilterStore.selectedKlassen = [];
    // Clear selectedKlassen and test again
    await klasseAutocomplete?.setValue([]);
    klasseAutocomplete?.vm.$emit('update:selectedKlassen', []);
    await flushPromises();

    expect(searchFilterStore.selectedKlassen).toEqual([]);

    // Now it should use selectedSchulen
    expect(getAllPersonsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationIDs: ['9876'], // This should be the selectedSchulen value
      }),
    );
  });

  test('it reloads data after changing page', async () => {
    // Mock the getAllPersons method to capture its arguments
    const getAllPersonsSpy: MockInstance = vi.spyOn(personStore, 'getAllPersons');

    expect(wrapper?.find('.v-pagination__next button.v-btn--disabled').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-2');

    personStore.totalPersons = 50;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
    expect(wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').isVisible()).toBe(true);
    await wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('31-50');

    expect(getAllPersonsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        offset: 30,
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
    const klasse: Organisation = DoFactory.getKlasse(undefined, {});
    organisationStore.klassenFilter.filterResult = [klasse];
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    expect(schuleAutocomplete?.text()).toEqual('9356494 (Random Schulname Gymnasium)');

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue(['1']);
    await nextTick();

    expect(rolleAutocomplete?.text()).toEqual('1');

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue([klasse.id]);
    klasseAutocomplete?.vm.$emit('update:selectedKlassen', [klasse.id]);
    await nextTick();
    await flushPromises();

    expect(klasseAutocomplete?.text()).toEqual(klasse.name);

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(schuleAutocomplete?.text()).toBe('');
    expect(rolleAutocomplete?.text()).toBe('');
    expect(klasseAutocomplete?.text()).toBe('');
  });

  test('it updates Organisation search correctly', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    await organisationAutocomplete?.setValue(['org']);
    await nextTick();

    organisationAutocomplete?.vm.$emit('update:search', '2');
    await flushPromises();
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

  test('it checks a checkbox in the table, selects the Rolle zuordnen option and triggers dialog then cancels it', async () => {
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
    benutzerEditSelect?.setValue('MODIFY_ROLLE');
    await nextTick();

    expect(wrapper?.findComponent({ ref: 'personenkontext-create' })).not.toBeNull();
    expect(document.body.querySelector('[data-testid="rolle-modify-layout-card"]')).not.toBeNull();

    const cancelButton: Element | null = document.querySelector('[data-testid="rolle-modify-discard-button"]');
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(document.body.querySelector('[data-testid="rolle-modify-layout-card"]')).toBeNull();
  });

  test('it checks a checkbox in the table, selects the delete person option and triggers dialog then cancels it', async () => {
    authStore.hasPersonenLoeschenPermission = true;
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

    // eslint-disable-next-line @typescript-eslint/dot-notation
    const hasDeletePersonOption: boolean = (benutzerEditSelect?.props() as { items: { value: string }[] }).items.some(
      (item: { value: string }) => item.value === 'DELETE_PERSON',
    );
    expect(hasDeletePersonOption).toBe(true);

    benutzerEditSelect?.setValue('DELETE_PERSON');

    benutzerEditSelect?.vm.$emit('input', 'DELETE_PERSON');
    await nextTick();

    expect(document.body.querySelector('[data-testid="person-delete-layout-card"]')).not.toBeNull();

    const cancelButton: Element | null = document.querySelector('[data-testid="person-delete-discard-button"]');
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(document.body.querySelector('[data-testid="person-delete-layout-card"]')).toBeNull();
  });

  test('it checks a checkbox in the table, selects the unassign org option and triggers dialog then cancels it', async () => {
    authStore.hasPersonenverwaltungPermission = true;
    // Find the first checkbox in the table
    const checkbox: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="person-table"] .v-selection-control',
    );

    // Initial state check (optional)
    expect(checkbox?.classes()).not.toContain('v-selection-control--selected');

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    // Trigger the checkbox click
    await checkbox?.trigger('click');
    await nextTick();

    const benutzerEditSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'benutzer-bulk-edit-select' });

    // eslint-disable-next-line @typescript-eslint/dot-notation
    const hasUnassingOrgOption: boolean = (benutzerEditSelect?.props() as { items: { value: string }[] }).items.some(
      (item: { value: string }) => item.value === 'ORG_UNASSIGN',
    );
    expect(hasUnassingOrgOption).toBe(true);

    benutzerEditSelect?.setValue('ORG_UNASSIGN');

    benutzerEditSelect?.vm.$emit('input', 'ORG_UNASSIGN');
    await nextTick();
    await flushPromises();

    expect(document.body.querySelector('[data-testid="org-unassign-layout-card"]')).not.toBeNull();

    const cancelButton: Element | null = document.querySelector('[data-testid="org-unassign-discard-button"]');
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(document.body.querySelector('[data-testid="org-unassign-layout-card"]')).toBeNull();
  });

  test('it checks a checkbox in the table, selects the reset password option and triggers dialog then cancels it', async () => {
    authStore.hasPersonenverwaltungPermission = true;
    // Find the first checkbox in the table
    const checkbox: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="person-table"] .v-selection-control',
    );

    // Initial state check (optional)
    expect(checkbox?.classes()).not.toContain('v-selection-control--selected');

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue(['9876']);
    await nextTick();

    // Trigger the checkbox click
    await checkbox?.trigger('click');
    await nextTick();

    const benutzerEditSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'benutzer-bulk-edit-select' });

    // eslint-disable-next-line @typescript-eslint/dot-notation
    const hasPasswordResetOption: boolean = (benutzerEditSelect?.props() as { items: { value: string }[] }).items.some(
      (item: { value: string }) => item.value === 'RESET_PASSWORD',
    );
    expect(hasPasswordResetOption).toBe(true);

    benutzerEditSelect?.setValue('RESET_PASSWORD');

    benutzerEditSelect?.vm.$emit('input', 'RESET_PASSWORD');
    await nextTick();

    expect(document.body.querySelector('[data-testid="password-reset-layout-card"]')).not.toBeNull();

    const cancelButton: Element | null = document.querySelector('[data-testid="password-reset-discard-button"]');
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(document.body.querySelector('[data-testid="person-delete-layout-card"]')).toBeNull();
  });

  test('person delete isnt shown if user has no permission', async () => {
    authStore.hasPersonenLoeschenPermission = false;

    wrapper = mountComponent();

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
      expect(item.value).not.toBe('DELETE_PERSON');
    });
  });

  test('password reset isnt shown if user has no permission', async () => {
    authStore.hasPersonenverwaltungPermission = false;

    wrapper = mountComponent();

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
      expect(item.value).not.toBe('RESET_PASSWORD');
    });
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
