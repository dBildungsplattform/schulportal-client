import { RollenSystemRecht } from '@/api-client/generated';
import { useAuthStore, type AuthStore, type UserInfo } from '@/stores/AuthStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationenFilter,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import { DoFactory } from '@/testing/DoFactory';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import KlassenManagementView from './KlassenManagementView.vue';

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
const searchFilterStore: SearchFilterStore = useSearchFilterStore();
const authStore: AuthStore = useAuthStore();

/**
 *
 * @param schule org to solect, null to clear selection
 * @returns selected org or nothing, if cleared
 */
async function selectSchule(schule?: Partial<Organisation> | null): Promise<Organisation | undefined> {
  const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' }).findComponent({
    name: 'v-autocomplete',
  });

  if (schule === null) {
    await schuleAutocomplete?.setValue(schule);
    return;
  }

  const schuleWithDefaults: Organisation = DoFactory.getSchule(schule);
  organisationStore.schulenFilter.filterResult = [schuleWithDefaults];
  await schuleAutocomplete?.setValue(schuleWithDefaults.id);
  return schuleWithDefaults;
}

const schule1: Organisation = DoFactory.getSchule();
const schule2: Organisation = DoFactory.getSchule();
const personenkontexte: UserInfo['personenkontexte'] = [
  {
    organisation: {
      ...DoFactory.getOrganisationResponse({
        administriertVon: '1',
        kennung: schule1.kennung ?? '',
      }),
      ...schule1,
    },
    rolle: DoFactory.getRollenSystemRechtServiceProviderIDResponse({
      systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
    }),
  },
  {
    organisation: {
      ...DoFactory.getOrganisationResponse({
        administriertVon: '1',
        kennung: schule2.kennung ?? '',
      }),
      ...schule2,
    },
    rolle: DoFactory.getRollenSystemRechtServiceProviderIDResponse({
      systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
    }),
  },
];
const authUser: UserInfo = DoFactory.getUserinfoResponse();

describe('KlassenManagementView', () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

    organisationStore.$reset();
    organisationStore.allKlassen = [
      DoFactory.getKlasse(schule1, { name: '9a' }),
      DoFactory.getKlasse(schule2, { name: '9b' }),
    ];

    organisationStore.allOrganisationen = [schule1, schule2];

    organisationStore.allSchulen = [schule1, schule2];

    organisationStore.totalKlassen = 2;

    authStore.currentUser = authUser;

    wrapper = mountComponent();
    vi.resetAllMocks();
  });
  type AutoselectTestcase = {
    label: string;
    isSchuleAutoselected: boolean;
  };
  const autoselectTestcases: Array<AutoselectTestcase> = [
    {
      label: 'not autoselected',
      isSchuleAutoselected: false,
    },
    {
      label: 'autoselected',
      isSchuleAutoselected: true,
    },
  ];
  describe.each(autoselectTestcases)('when Schule is $label', ({ isSchuleAutoselected }: AutoselectTestcase) => {
    beforeEach(() => {
      authStore.currentUser = {
        ...authUser,
        personenkontexte: isSchuleAutoselected ? personenkontexte.slice(0, 1) : personenkontexte,
      };
    });

    test('it renders klasse management view', async () => {
      wrapper = mountComponent();
      expect(wrapper.getComponent({ name: 'ResultTable' })).toBeTruthy();
      expect(wrapper.find('[data-testid="klasse-table"]').isVisible()).toBe(true);
      await flushPromises();
      const numberOfRows: number = wrapper.findAll('.v-data-table__tr').length;
      expect(numberOfRows).toBe(organisationStore.allKlassen.length);
      await nextTick();

      const tableHeadersText: string | undefined = wrapper.find('.v-data-table__thead').text();
      const elements: DOMWrapper<Element>[] | undefined = wrapper.findAll('.v-data-table__th');
      if (isSchuleAutoselected) {
        expect(elements.length).toBe(3);
        expect(tableHeadersText).not.toContain('Dienststellennummer');
      } else {
        expect(elements.length).toBe(4);
        expect(tableHeadersText).toContain('Dienststellennummer');
      }
      expect(tableHeadersText).toContain('Klasse');
      expect(tableHeadersText).toContain('Aktion');
    });
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
    selectSchule();
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    selectSchule(null);
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('');
  });

  test('it triggers reset for filters', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    selectSchule();
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('');
    expect(klasseAutocomplete?.text()).toEqual('');
  });

  it('should fetch all Klassen when search string is empty and no Schule is selected', async () => {
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await klasseAutocomplete?.vm.$emit('update:search', '');
    await flushPromises();

    expect(organisationStore.getAllOrganisationen).toHaveBeenCalledWith({
      offset: 0,
      limit: searchFilterStore.klassenPerPage,
      includeTyp: OrganisationsTyp.Klasse,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
    });
  });

  it('should fetch Klassen for selected Schule when search string is empty', async () => {
    const schule: Organisation = (await selectSchule())!;
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await klasseAutocomplete?.vm.$emit('update:search', '');
    await flushPromises();
    const expectedFilter: OrganisationenFilter = {
      administriertVon: [schule.id],
      includeTyp: 'KLASSE',
      limit: searchFilterStore.klassenPerPage,
      offset: 0,
      searchString: '',
      systemrechte: ['KLASSEN_VERWALTEN'],
    };
    expect(organisationStore.getAllOrganisationen).toHaveBeenLastCalledWith(expectedFilter);
  });

  test('it does nothing if same schule is selected again', async () => {
    selectSchule();

    const allSpy: MockInstance = vi.spyOn(organisationStore, 'getAllOrganisationen');
    allSpy.mockClear();

    selectSchule();
    await flushPromises();

    expect(allSpy).not.toHaveBeenCalled();
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
