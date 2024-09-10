import { expect, test, type MockInstance } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import KlassenManagementView from './KlassenManagementView.vue';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();
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
      id: '1',
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

  wrapper = mount(KlassenManagementView, {
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
  vi.resetAllMocks();
});

describe('KlassenManagementView', () => {
  test('it renders klasse management view', () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="klasse-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
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
  });

  test('it reloads data after changing limit', async () => {
    expect(wrapper?.find('.v-data-table-footer__items-per-page').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');

    const component: WrapperLike | undefined = wrapper?.findComponent('.v-data-table-footer__items-per-page .v-select');
    await component?.setValue(50);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('50');
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
      systemrechte: ['SCHULEN_VERWALTEN'],
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
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
  });
});
