import { expect, test, type MockInstance } from 'vitest';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import KlassenManagementView from './KlassenManagementView.vue';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';

function mountComponent(): VueWrapper {
  return mount(KlassenManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlassenManagementView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
}

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();
const authStore: AuthStore = useAuthStore();

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore.allKlassen = [
    {
      id: '1',
      name: '9a',
      kennung: '9356494-9a',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'KLASSE',
      administriertVon: '1',
    },
    {
      id: '2',
      name: '9b',
      kennung: '9356494-9b',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'KLASSE',
      administriertVon: '1',
    },
  ];

  organisationStore.allOrganisationen = [
    {
      id: '1',
      name: '9a',
      kennung: '9356494-9a',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
    {
      id: '1',
      name: '9b',
      kennung: '9356494-9b',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];

  organisationStore.allSchulen = [
    {
      id: '1133',
      name: 'orga',
      kennung: '9356494-9a',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
    {
      id: '1',
      name: '9b',
      kennung: '9356494-9b',
      namensergaenzung: 'Klasse',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];

  organisationStore.totalKlassen = 2;

  authStore.currentUser = {
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
    password_updated_at: null,
  };

  wrapper = mountComponent();
  vi.resetAllMocks();
});

describe('KlassenManagementView', () => {
  test('it renders klasse management view', async () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="klasse-table"]').isVisible()).toBe(true);
    await flushPromises();
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
    await nextTick();

    const tableHeadersText: string | undefined = wrapper?.find('.v-data-table__thead').text();
    const elements: DOMWrapper<Element>[] | undefined = wrapper?.findAll('.v-data-table__th');
    expect(elements?.length).toBe(4);
    expect(tableHeadersText).toContain('Dienststellennummer');
    expect(tableHeadersText).toContain('Klasse');
    expect(tableHeadersText).toContain('Aktion');
  });

  test('it does not render extra table headers, if unnecessary', async () => {
    authStore.currentUser = null;
    wrapper = mountComponent();
    expect(wrapper.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper.find('[data-testid="klasse-table"]').isVisible()).toBe(true);
    await flushPromises();
    expect(wrapper.findAll('.v-data-table__tr').length).toBe(2);
    await nextTick();

    const tableHeadersText: string | undefined = wrapper.find('.v-data-table__thead').text();
    const elements: DOMWrapper<Element>[] | undefined = wrapper.findAll('.v-data-table__th');
    expect(elements.length).toBe(3);
    expect(tableHeadersText).not.toContain('Dienststellennummer');
    expect(tableHeadersText).toContain('Klasse');
    expect(tableHeadersText).toContain('Aktion');
  });

  test('it reloads data after changing page', async () => {
    expect(wrapper?.find('.v-pagination__next button.v-btn--disabled').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-2');

    organisationStore.totalKlassen = 50;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
    expect(wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').isVisible()).toBe(true);
    await wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('31-50');

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();
    await wrapper?.find('.v-pagination__prev button:not(.v-btn--disabled)').trigger('click');

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
  });

  test('it reloads data after changing limit', async () => {
    /* check for both cases, first if total is greater than, afterwards if total is less or equal than chosen limit */
    organisationStore.totalOrganisationen = 51;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__items-per-page').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');

    const itemsPerPageSelection: WrapperLike | undefined = wrapper?.findComponent(
      '.v-data-table-footer__items-per-page .v-select',
    );
    await itemsPerPageSelection?.setValue(50);

    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('50');

    organisationStore.totalOrganisationen = 30;
    await itemsPerPageSelection?.setValue(30);

    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');
    organisationStore.totalOrganisationen = 2;

    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    await itemsPerPageSelection?.setValue(50);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-2');
  });

  test('it calls watchers for selected Schule and klasse with value', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('9a');
  });

  test('it resets field Klasse when Schule is reset after being selected', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    await organisationAutocomplete?.setValue(null);
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('');
  });

  test('it calls watcher for klasse without schule', async () => {
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    await klasseAutocomplete?.setValue('1b');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('1b');
  });

  test('it triggers reset for filters', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('');
  });

  test('it updates Organisation search correctly', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();
    expect(organisationStore.getAllOrganisationen).toHaveBeenCalled();
  });

  test('it does nothing if the oldValue is equal to what is selected on Organisation', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    // Set a value in orga that will match with something given by the props and so the component will calculate the selectedOrganisationTitle
    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    // Set the searchValue to 'orga' which matches the title before
    await organisationAutocomplete?.vm.$emit('update:search', 'orga');
    await nextTick();

    // Set the newValue to '' and the oldValue is in this case 'orga' and so the method should just return
    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('9356494-9a (orga)');
  });

  it('should fetch all Klassen when search string is empty and no Schule is selected', async () => {
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await klasseAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationStore.getAllOrganisationen).toHaveBeenCalled();
  });

  it('should fetch Klassen for selected Schule when search string is empty', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await schuleAutocomplete?.setValue('123');
    await nextTick();

    await klasseAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationStore.getAllOrganisationen).toHaveBeenCalled();
  });

  test('it does nothing if oldValue equals selectedOrganisationTitle', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });

    // Set initial value
    await schuleAutocomplete?.setValue('1133');
    await nextTick();

    const spy: MockInstance = vi.spyOn(organisationStore, 'getAllOrganisationen');
    spy.mockClear(); // Clear any previous calls

    // Simulate the autocomplete behavior
    await schuleAutocomplete?.vm.$emit('update:search', 'orga'); // This should match the title
    await nextTick();

    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 600)); // Wait for debounce

    expect(spy).toHaveBeenCalled();
  });

  test('it fetches initial data when newValue is empty and no Schule is selected', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const spy: MockInstance = vi.spyOn(organisationStore, 'getAllOrganisationen');

    await schuleAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 600)); // Wait for debounce
    await nextTick();

    expect(spy).not.toHaveBeenCalled();
  });

  test('it fetches Schulen when newValue is not empty and different from current title', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const spy: MockInstance = vi.spyOn(organisationStore, 'getAllOrganisationen');

    await schuleAutocomplete?.vm.$emit('update:search', 'New School');

    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 600)); // Wait for debounce
    await nextTick();

    expect(spy).toHaveBeenCalledWith({
      searchString: 'New School',
      includeTyp: OrganisationsTyp.Schule,
      limit: 25,
      systemrechte: ['KLASSEN_VERWALTEN'],
    });
  });

  test('it fetches roles when newValue is not empty and a Schule is selected', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleAutocomplete?.setValue('1133');
    await nextTick();

    const spy: MockInstance = vi.spyOn(organisationStore, 'getAllOrganisationen');

    await schuleAutocomplete?.vm.$emit('update:search', '23');

    await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 600)); // Wait for debounce
    await nextTick();

    expect(spy).toHaveBeenCalledWith({
      searchString: '23',
      includeTyp: OrganisationsTyp.Schule,
      limit: 25,
      systemrechte: ['KLASSEN_VERWALTEN'],
    });
  });

  test.each([
    ['UNSPECIFIED_ERROR', 'Fehler beim Laden der Klassen', 'Es konnten keine Klassendaten geladen werden.'],
    ['KLASSE_ERROR', 'Fehler bei Änderung der Klasse.', 'Die Klasse konnte nicht geändert werden.'],
  ])(
    'if there is an error, it displays correct text for %s',
    async (errorCode: string, expectedTitle: string, expectedText: string) => {
      organisationStore.errorCode = errorCode;
      await nextTick();

      const actualTitle: string | undefined = wrapper?.find('[data-testid=alert-title]').text();
      const actualText: string | undefined = wrapper?.find('[data-testid=alert-text]').text();

      expect(actualTitle).toBe(expectedTitle);
      expect(actualText).toBe(expectedText);
    },
  );
});
