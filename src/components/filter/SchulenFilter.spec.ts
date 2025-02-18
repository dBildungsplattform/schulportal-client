import { RollenSystemRecht } from '@/api-client/generated';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationenFilter,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import type { BaseFieldProps } from 'vee-validate';
import type { MockInstance } from 'vitest';
import { nextTick } from 'vue';
import SchulenFilter from './SchulenFilter.vue';

type Props = {
  includeTraeger?: boolean;
  systemrechteForSearch?: Array<RollenSystemRecht>;
  multiple: boolean;
  readonly?: boolean;
  initialIds?: Array<string> | string;
  selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
};

function mountComponent(props: Partial<Props> = {}): VueWrapper {
  return mount(SchulenFilter, {
    attachTo: document.getElementById('app') || '',
    props: {
      multiple: false,
      ...props,
    },
  });
}

function expectInputDisabledAttrToBe(expected: boolean): void {
  const inputElement: Element | null = document.querySelector('#schule-select');
  expect(inputElement).not.toBeNull();
  expect(inputElement!.hasAttribute('disabled')).toBe(expected);
}

const organisationStore: OrganisationStore = useOrganisationStore();
vi.useFakeTimers();

const defaultFilter: OrganisationenFilter = {
  includeTyp: OrganisationsTyp.Schule,
  systemrechte: [RollenSystemRecht.KlassenVerwalten],
  organisationIds: [],
  limit: 25,
};

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  organisationStore.$reset();
});

describe('SchulenFilter', async () => {
  describe.each([[false]])('when multiple is %s', (multiple: boolean) => {
    describe.each([[true], [false]])('when readonly is %s', (readonly: boolean) => {
      const defaultProps: Props = { multiple, readonly };

      test('it renders', () => {
        const wrapper: VueWrapper = mountComponent(defaultProps);
        expect(wrapper.find('[data-testid="schule-select"]').isVisible()).toBe(true);
      });

      type AutoselectTestData = {
        label: string;
        schule: Organisation | null;
      };
      describe.each([
        {
          label: 'auto-selected',
          schule: {
            id: '12334',
            kennung: '23314',
            name: 'Siegbert-Schwafel-Schule',
            typ: OrganisationsTyp.Schule,
          },
        },
        {
          label: 'not auto-selected',
          schule: null,
        },
      ])('when schule is $label', ({ schule }: AutoselectTestData) => {
        beforeEach(() => {
          organisationStore.autoselectedSchule = schule;
        });

        type InitialIdsTestData = {
          label: string;
          initialIds?: Props['initialIds'];
        };
        describe.each([{ label: 'given', initialIds: '734564' }, { label: 'not given' }])(
          'when initialIds are $initialIds',
          ({ initialIds }: InitialIdsTestData) => {
            describe.each([
              [[RollenSystemRecht.KlassenVerwalten]],
              [[RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten]],
              [[]],
              [undefined],
            ])('when systemrechteForSearch are %s', (systemrechteForSearch: Array<RollenSystemRecht> | undefined) => {
              const expectedIdsInFilter: OrganisationenFilter['organisationIds'] =
                ((): OrganisationenFilter['organisationIds'] => {
                  if (Array.isArray(initialIds)) return initialIds;
                  if (initialIds) return [initialIds];
                  return [];
                })();
              const expectedFilter: OrganisationenFilter = {
                ...defaultFilter,
                systemrechte: systemrechteForSearch,
                organisationIds: expectedIdsInFilter,
              };

              test('it correctly populates input', async () => {
                const expected: Array<string> | string = initialIds ?? '';
                const wrapper: VueWrapper = mountComponent({ ...defaultProps, initialIds, systemrechteForSearch });
                expect(wrapper.find('[data-testid="schule-select"]').text()).toBe(expected);
              });

              test('it correctly sets disabled-attribute on input', async () => {
                const autoselected: boolean = schule != null;
                const wrapper: VueWrapper = mountComponent({ ...defaultProps, initialIds, systemrechteForSearch });
                expectInputDisabledAttrToBe(readonly || autoselected);
                wrapper.setProps({ readonly: !readonly });
                await nextTick();
                expectInputDisabledAttrToBe(!readonly || autoselected);
              });

              test('it initializes store', async () => {
                const resetSpy: MockInstance = vi.spyOn(organisationStore, 'resetSchulFilter');
                const autoselectSpy: MockInstance = vi.spyOn(organisationStore, 'getAutoselectedSchule');
                const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                const wrapper: VueWrapper = mountComponent({
                  ...defaultProps,
                  initialIds,
                  systemrechteForSearch,
                });
                expect(wrapper.find('[data-testid="schule-select"]').isVisible()).toBe(true);
                await nextTick();
                expect(resetSpy).toHaveBeenCalledOnce();
                expect(autoselectSpy).toHaveBeenCalledOnce();
                expect(loadSpy).toHaveBeenCalledOnce();
                expect(loadSpy).toHaveBeenLastCalledWith(expectedFilter);
              });

              test.each([[''], ['string']])('it searches for %s', async (searchString: string) => {
                const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                const wrapper: VueWrapper = mountComponent({
                  ...defaultProps,
                  initialIds,
                  systemrechteForSearch,
                });
                const schuleAutoComplete: ReturnType<VueWrapper['find']> | undefined = wrapper.find('#schule-select');
                await schuleAutoComplete.setValue(searchString);
                vi.runAllTimers();
                await flushPromises();
                if (readonly || schule !== null) {
                  expect(loadSpy).not.toHaveBeenLastCalledWith({
                    ...expectedFilter,
                    searchString,
                  });
                } else {
                  expect(loadSpy).toHaveBeenLastCalledWith({
                    ...expectedFilter,
                    searchString,
                  });
                }
              });
            });
          },
        );
      });
    });
  });
});

// describe('Schule searchInput', () => {
//   const spy: Mock<OrganisationStore['getAllOrganisationen']> = vi.fn<OrganisationStore['getAllOrganisationen']>();
//   let schuleAutoComplete: ReturnType<VueWrapper['find']> | undefined = wrapper?.find('[data-testid="schule-select"]');
//   beforeEach(() => {
//     schuleAutoComplete = wrapper!.find('[data-testid="schule-select"]');
//     organisationStore.getAllOrganisationen = spy;
//     spy.mockClear();
//   });
// });
//   describe('when schule is selected', async () => {
//     const schule: TranslatedObject = schulen[0]!;
//     beforeEach(async () => {
//       wrapper!.setProps({
//         selectedSchule: schule.value,
//       });
//       await nextTick();
//     });

//     test.each([
//       ['selected schule', schule.title],
//       ['empty string', ''],
//     ])('does nothing, if searching for %s', async (_label: string, searchInput: string) => {
//       schuleAutoComplete?.vm.$emit('update:search', searchInput);
//       await nextTick();

//       vi.runAllTimers();

//       expect(spy).not.toHaveBeenCalled();
//     });

//     test('triggers refresh, if searchValue is set', async () => {
//       const searchString: string = 'Gymnasium';
//       schuleAutoComplete?.vm.$emit('update:search', searchString);
//       await nextTick();

//       vi.runAllTimers();

//       expect(spy).toHaveBeenCalledWith({
//         ...defaultFilter,
//         searchString,
//         organisationIds: [schulen[0]!.value],
//       });
//     });

//     test('triggers refresh, if searchValue is cleared', async () => {
//       schuleAutoComplete?.setValue('');
//       schuleAutoComplete?.vm.$emit('update:search');
//       await nextTick();

//       vi.runAllTimers();

//       expect(spy).toHaveBeenCalledWith({
//         ...defaultFilter,
//       });
//     });
//   });

//   describe('when schule is not selected', async () => {
//     test('triggers refresh, if searchValue is set', async () => {
//       const searchString: string = 'Gymnasium';
//       schuleAutoComplete?.vm.$emit('update:search', searchString);
//       await nextTick();

//       vi.runAllTimers();

//       expect(spy).toHaveBeenCalledWith({ ...defaultFilter, searchString: 'Gymnasium' });
//     });
//   });
// });
