import {
  RollenSystemRecht,
  type PersonenkontextRolleFieldsResponse,
  type RollenSystemRechtServiceProviderIDResponse,
} from '@/api-client/generated';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationenFilter,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { DoFactory } from '@/testing/DoFactory';
import { getDisplayNameForOrg } from '@/utils/formatting';
import { faker } from '@faker-js/faker';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import type { BaseFieldProps } from 'vee-validate';
import type { MockInstance } from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import SchulenFilter from './SchulenFilter.vue';

type Props = {
  includeTraeger?: boolean;
  systemrechteForSearch?: Array<RollenSystemRecht>;
  multiple: boolean;
  readonly?: boolean;
  initialIds?: Array<string> | string;
  selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
  highlightSelection?: boolean;
  texts?: {
    placeholder?: string;
  };
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
const authStore: AuthStore = useAuthStore();
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
  authStore.$reset();
  vi.restoreAllMocks();
  vi.clearAllTimers();
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
        autoSelectedSchule: PersonenkontextRolleFieldsResponse['organisation'] | null;
      };
      const tempSchule: PersonenkontextRolleFieldsResponse['organisation'] = DoFactory.getOrganisationResponse({
        id: 'auto-selected-schule-id',
      });
      describe.each([
        {
          label: 'auto-selected',
          autoSelectedSchule: tempSchule,
        },
        {
          label: 'not auto-selected',
          autoSelectedSchule: null,
        },
      ])('when schule is $label', ({ autoSelectedSchule }: AutoselectTestData) => {
        const rolle: RollenSystemRechtServiceProviderIDResponse =
          DoFactory.getRollenSystemRechtServiceProviderIDResponse({
            systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
          });
        beforeEach(() => {
          authStore.currentUser = DoFactory.getUserinfoResponse({
            personenkontexte: autoSelectedSchule
              ? [
                  DoFactory.getPersonenkontextRolleFieldsResponse({
                    organisation: autoSelectedSchule,
                    rolle,
                  }),
                ]
              : [
                  DoFactory.getPersonenkontextRolleFieldsResponse({
                    rolle,
                  }),
                  DoFactory.getPersonenkontextRolleFieldsResponse({
                    rolle,
                  }),
                  {
                    organisation: tempSchule,
                    rolle,
                  },
                ],
          });
        });

        test('it correctly sets disabled-attribute on input', async () => {
          const autoselected: boolean = autoSelectedSchule != null;
          const wrapper: VueWrapper = mountComponent({ ...defaultProps });
          expectInputDisabledAttrToBe(readonly || autoselected);
          wrapper.setProps({ readonly: !readonly });
          await nextTick();
          expectInputDisabledAttrToBe(!readonly || autoselected);
        });

        describe.each([
          [[RollenSystemRecht.KlassenVerwalten]],
          [[RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten]],
          [[]],
          [undefined],
        ])('when systemrechteForSearch are %s', (systemrechteForSearch: Array<RollenSystemRecht> | undefined) => {
          const expectedIdsInFilter: OrganisationenFilter['organisationIds'] =
            ((): OrganisationenFilter['organisationIds'] => {
              if (autoSelectedSchule) return [autoSelectedSchule.id];
              return [];
            })();
          const expectedFilter: OrganisationenFilter = {
            ...defaultFilter,
            systemrechte: systemrechteForSearch,
            organisationIds: expectedIdsInFilter,
          };

          test('it initializes store', async () => {
            const spy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
            mountComponent({
              ...defaultProps,
              systemrechteForSearch,
            });
            vi.runAllTimers();
            if (autoSelectedSchule != null) {
              expect(spy).not.toHaveBeenCalled();
            } else {
              expect(spy).toHaveBeenCalledOnce();
              expect(spy).toHaveBeenLastCalledWith(expectedFilter);
            }
          });

          describe.each([[''], ['string']])('when searching for %s', (searchString: string) => {
            test.runIf(readonly)('it does not trigger search', async () => {
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              // clear initial loading from mock
              vi.runAllTimers();
              loadSpy.mockClear();

              const schuleSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find('#schule-select');
              await schuleSearchInput.setValue(searchString);
              vi.runAllTimers();
              await flushPromises();
              expect(loadSpy).not.toHaveBeenCalled();
            });
            test.runIf(!readonly && !autoSelectedSchule)('it triggers search', async () => {
              const expected: OrganisationenFilter = {
                ...expectedFilter,
              };
              if (searchString.length > 0) expected.searchString = searchString;
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              const schuleSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find('#schule-select');
              await schuleSearchInput.setValue(searchString);
              vi.runAllTimers();
              await flushPromises();
              expect(loadSpy).toHaveBeenLastCalledWith(expected);
            });
          });

          describe.runIf(!readonly && !autoSelectedSchule)('when selecting', () => {
            async function setup(): Promise<VueWrapper> {
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              vi.runAllTimers();
              await flushPromises();
              return wrapper;
            }
            async function selectSchule(wrapper: VueWrapper, id: string | undefined): Promise<void> {
              const schuleAutoComplete: ReturnType<VueWrapper['findComponent']> = wrapper.findComponent({
                name: 'v-autocomplete',
              });
              await schuleAutoComplete.setValue(id);
              vi.runAllTimers();
              await flushPromises();
            }

            test('it triggers search', async () => {
              const selectedSchuleId: string = faker.string.uuid();
              const wrapper: VueWrapper = await setup();
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
              await selectSchule(wrapper, selectedSchuleId);
              const expected: OrganisationenFilter = {
                ...expectedFilter,
                organisationIds: [...(expectedIdsInFilter ?? []), selectedSchuleId],
              };
              expect(loadSpy).toHaveBeenLastCalledWith(expected);
            });

            describe('and clearing selection', async () => {
              test('it triggers search', async () => {
                const wrapper: VueWrapper = await setup();
                await selectSchule(wrapper, faker.string.uuid());
                const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                await selectSchule(wrapper, undefined);
                const expected: OrganisationenFilter = {
                  ...expectedFilter,
                  organisationIds: [...(expectedIdsInFilter ?? [])],
                };
                expect(loadSpy).toHaveBeenLastCalledWith(expected);
              });
            });
          });
        });

        describe.each([
          {
            label: 'overrides',
            id: faker.string.uuid(),
          },
          {
            label: 'does not override',
          },
        ])('when the parent $label the selection', ({ id }: { id?: string }) => {
          test('it correctly initializes input', async () => {
            const mockSchule: Organisation = DoFactory.getSchule({ id });
            organisationStore.loadSchulenForFilter = vi.fn(async () => {
              organisationStore.schulenFilter.filterResult = [mockSchule];
            });
            const selectionRef: Ref<string | undefined> = ref(id);
            const wrapper: VueWrapper = mountComponent({ ...defaultProps });
            vi.runAllTimers();
            await wrapper.setProps({ selectedSchulen: selectionRef });
            vi.runAllTimers();
            await nextTick();
            const actualText: string = wrapper.find('[data-testid="schule-select"]').text();
            if (id) expect(actualText).toContain(getDisplayNameForOrg(mockSchule));
            else if (autoSelectedSchule) expect(actualText).toContain(getDisplayNameForOrg(autoSelectedSchule));
            else expect(actualText).toBe('');
          });
        });

        describe.each([[true], [false]])('when highlightSelection is %s', async (highlightSelection: boolean) => {
          test('it correctly displays highlight', async () => {
            const selectedSchuleId: string = faker.string.uuid();
            const wrapper: VueWrapper = mountComponent({
              ...defaultProps,
              highlightSelection,
            });
            await wrapper
              .findComponent({
                name: 'v-autocomplete',
              })
              .setValue(selectedSchuleId);

            const classes: Array<string> = wrapper.findComponent({ ref: 'schule-select' }).classes();
            if (highlightSelection || autoSelectedSchule) {
              expect(classes).toContain('selected');
            } else {
              expect(classes).not.toContain('selected');
            }
          });
        });
      });
    });
  });
});
