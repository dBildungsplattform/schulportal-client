import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
  type OrganisationenFilter,
} from '@/stores/OrganisationStore';
import { RollenSystemRecht } from '@/stores/RolleStore';
import { type TranslatedObject } from '@/types.d';
import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import KlasseForm from './KlasseForm.vue';

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();

const schulen: Array<Organisation> = [
  {
    id: '9356495',
    name: 'Albert-Gymnasium',
    typ: OrganisationsTyp.Schule,
  },
  {
    id: '8456571',
    name: 'Hohver-Gymnasium',
    typ: OrganisationsTyp.Schule,
  },
];
const translatedSchulen: Array<TranslatedObject> = schulen.map((schule: Organisation) => ({
  title: schule.name,
  value: schule.id,
}));

vi.useFakeTimers();

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlasseForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      onHandleConfirmUnsavedChanges: () => '',
      onHandleDiscard: () => '',
      onShowDialogChange: (value: boolean | undefined) => value,
      onSubmit: () => '',
      schulen: translatedSchulen,
    },
    global: {
      components: {
        KlasseForm,
      },
    },
  });
  organisationStore.$reset();
});

describe('KlasseForm', () => {
  test('it renders the Klasse form', () => {
    expect(wrapper?.find('[data-testid="klasse-form"]').isVisible()).toBe(true);
  });
});

describe('Schule searchInput', () => {
  const defaultFilter: OrganisationenFilter = {
    includeTyp: OrganisationsTyp.Schule,
    systemrechte: [RollenSystemRecht.KlassenVerwalten],
    limit: 25,
  };
  const spy: MockInstance<OrganisationStore['getFilteredSchulen']> = vi.spyOn(organisationStore, 'getFilteredSchulen');
  let schuleAutoComplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
  beforeEach(() => {
    schuleAutoComplete = wrapper!.findComponent({ ref: 'schule-select' });
    spy.mockClear();
  });

  describe('when schule is autoselected', async () => {
    const schule: TranslatedObject = translatedSchulen[0]!;
    beforeEach(async () => {
      organisationStore.autoselectedSchule = schulen[0]!;
      wrapper!.setProps({
        schulen: [schule],
      });
      await nextTick();
    });

    test('it is readonly', async () => {
      const inputElement: Element | null = document.querySelector('#schule-select');
      await nextTick();

      expect(inputElement).toBeDefined();
      expect(inputElement!.hasAttribute('disabled')).toBeTruthy();
    });

    test('it disables autoselect if more schulen are loaded', async () => {
      let inputElement: Element | null = document.querySelector('#schule-select');
      await nextTick();
      expect(inputElement).toBeDefined();
      expect(inputElement!.hasAttribute('disabled')).toBeTruthy();
      expect(wrapper?.find('[data-testid="schule-select"]').text()).toContain(schule.title);

      organisationStore.autoselectedSchule = null;
      await nextTick();

      inputElement = document.querySelector('#schule-select');
      expect(inputElement).toBeDefined();
      expect(inputElement!.hasAttribute('disabled')).toBeFalsy();
      expect(wrapper?.find('[data-testid="schule-select"]').text()).not.toContain(schule.title);
    });
  });

  describe('when schule is selected', async () => {
    const schule: TranslatedObject = translatedSchulen[0]!;
    beforeEach(async () => {
      wrapper!.setProps({
        selectedSchule: schule.value,
      });
      await nextTick();
    });

    test.each([
      ['selected schule', schule.title],
      ['empty string', ''],
    ])('does nothing, if searching for %s', async (_label: string, searchInput: string) => {
      schuleAutoComplete?.vm.$emit('update:search', searchInput);
      await nextTick();

      vi.runAllTimers();

      expect(spy).not.toHaveBeenCalled();
    });

    test('triggers refresh, if searchValue is set', async () => {
      const searchString: string = 'Gymnasium';
      schuleAutoComplete?.vm.$emit('update:search', searchString);
      await nextTick();

      vi.runAllTimers();

      expect(spy).toHaveBeenLastCalledWith({
        ...defaultFilter,
        searchString,
        organisationIds: [translatedSchulen[0]!.value],
      });
    });

    test('triggers refresh, if searchValue is cleared', async () => {
      schuleAutoComplete?.setValue('');
      schuleAutoComplete?.vm.$emit('update:search');
      await nextTick();

      vi.runAllTimers();

      expect(spy).toHaveBeenLastCalledWith({
        ...defaultFilter,
      });
    });
  });

  describe('when schule is not selected', async () => {
    test('triggers refresh, if searchValue is set', async () => {
      const searchString: string = 'Gymnasium';
      schuleAutoComplete?.vm.$emit('update:search', searchString);
      await nextTick();

      vi.runAllTimers();

      expect(spy).toHaveBeenLastCalledWith({ ...defaultFilter, searchString: 'Gymnasium' });
    });
  });
});
