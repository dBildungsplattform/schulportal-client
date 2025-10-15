import { RollenSystemRechtEnum } from '@/api-client/generated';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationenFilter,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { faker } from '@faker-js/faker';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import type { BaseFieldProps } from 'vee-validate';
import type { MockInstance } from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import KlassenFilter from './KlassenFilter.vue';

type Props = {
  hideDetails?: boolean;
  systemrechteForSearch?: Array<RollenSystemRechtEnum>;
  multiple: boolean;
  readonly?: boolean;
  selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
  highlightSelection?: boolean;
  placeholderText?: string;
  administriertVon?: string[];
  parentId?: string;
};

function mountComponent(props: Partial<Props> = {}): VueWrapper {
  return mount(KlassenFilter, {
    attachTo: document.getElementById('app') || '',
    props: {
      multiple: false,
      ...props,
    },
  });
}

const organisationStore: OrganisationStore = useOrganisationStore();
const authStore: AuthStore = useAuthStore();
vi.useFakeTimers();

const defaultFilter: OrganisationenFilter = {
  includeTyp: OrganisationsTyp.Klasse,
  systemrechte: [RollenSystemRechtEnum.KlassenVerwalten],
  organisationIds: [],
  limit: 200,
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

describe('KlassenFilter', async () => {
  describe.each([[undefined], ['test-component']])('when storeKey is %s', (storeKey: string | undefined) => {
    describe.each([[true], [false]])('when multiple is %s', (multiple: boolean) => {
      describe.each([[true], [false]])('when readonly is %s', (readonly: boolean) => {
        const defaultProps: Props = { multiple, readonly, parentId: storeKey };
        const testId: string = storeKey ? `${storeKey}-klasse-select` : 'klasse-select';

        test('it renders', () => {
          const wrapper: VueWrapper = mountComponent(defaultProps);
          expect(wrapper.exists()).toBe(true);
          expect(wrapper.find(`[data-testid="${testId}"]`).isVisible()).toBe(true);
        });

        test('it displays the correct placeholder', async () => {
          const mockKlasse: Organisation = DoFactory.getKlasse();
          const selectionRef: Ref<Array<string> | string | undefined> = ref(multiple ? [mockKlasse.id] : mockKlasse.id);

          const wrapper: VueWrapper = mountComponent({ ...defaultProps });
          await wrapper.setProps({ selectedKlassen: selectionRef });
          // no timers are run, so this is before fetching data
          const actualText: string = wrapper.find(`[data-testid="${testId}"]`).text();
          expect(actualText).toContain('...');
        });

        describe.each([
          [[RollenSystemRechtEnum.KlassenVerwalten]],
          [[RollenSystemRechtEnum.KlassenVerwalten, RollenSystemRechtEnum.KlassenVerwalten]],
          [[]],
          [undefined],
        ])('when systemrechteForSearch are %s', (systemrechteForSearch: Array<RollenSystemRechtEnum> | undefined) => {
          const expectedIdsInFilter: OrganisationenFilter['organisationIds'] =
            ((): OrganisationenFilter['organisationIds'] => {
              return [];
            })();
          const expectedFilter: OrganisationenFilter = {
            ...defaultFilter,
            systemrechte: systemrechteForSearch,
            organisationIds: expectedIdsInFilter,
          };

          test('it initializes store', async () => {
            const spy: MockInstance = vi.spyOn(organisationStore, 'loadKlassenForFilter');
            mountComponent({
              ...defaultProps,
              systemrechteForSearch,
            });
            vi.runAllTimers();

            expect(spy).toHaveBeenCalledOnce();
            expect(spy).toHaveBeenLastCalledWith(expect.objectContaining(expectedFilter), storeKey);
          });

          describe.each([[''], ['string']])('when searching for %s', (searchString: string) => {
            test.runIf(readonly)('it does not trigger search', async () => {
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadKlassenForFilter');
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              // clear initial loading from mock
              vi.runAllTimers();
              loadSpy.mockClear();

              const klasseSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find(`#${testId}`);
              await klasseSearchInput.setValue(searchString);
              vi.runAllTimers();
              await flushPromises();
              expect(loadSpy).not.toHaveBeenCalled();
            });

            test.runIf(!readonly)('it triggers search', async () => {
              const expected: OrganisationenFilter = {
                ...expectedFilter,
              };
              if (searchString.length > 0) expected.searchString = searchString;
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadKlassenForFilter');
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              const klasseSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find(`#${testId}`);
              await klasseSearchInput.setValue(searchString);
              vi.runAllTimers();
              await flushPromises();
              expect(loadSpy).toHaveBeenLastCalledWith(expected, storeKey);
            });
          });

          describe.runIf(!readonly)('when selecting', () => {
            async function setup(): Promise<VueWrapper> {
              const wrapper: VueWrapper = mountComponent({
                ...defaultProps,
                systemrechteForSearch,
              });
              vi.runAllTimers();
              await flushPromises();
              return wrapper;
            }
            async function selectKlasse(wrapper: VueWrapper, id: string | undefined): Promise<void> {
              const klasseAutoComplete: ReturnType<VueWrapper['findComponent']> = wrapper.findComponent({
                name: 'v-autocomplete',
              });
              await klasseAutoComplete.setValue(id);
              vi.runAllTimers();
              await flushPromises();
            }

            test('it triggers search', async () => {
              const selectedKlasseId: string = faker.string.uuid();
              const wrapper: VueWrapper = await setup();
              const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadKlassenForFilter');
              await selectKlasse(wrapper, selectedKlasseId);
              const expected: OrganisationenFilter = {
                ...expectedFilter,
                organisationIds: [...(expectedIdsInFilter ?? []), selectedKlasseId],
              };
              expect(loadSpy).toHaveBeenLastCalledWith(expect.objectContaining(expected), storeKey);
            });

            describe('and clearing selection', async () => {
              test('it triggers search', async () => {
                const wrapper: VueWrapper = await setup();
                await selectKlasse(wrapper, faker.string.uuid());
                const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadKlassenForFilter');
                await selectKlasse(wrapper, undefined);
                const expected: OrganisationenFilter = {
                  ...expectedFilter,
                  organisationIds: [...(expectedIdsInFilter ?? [])],
                };
                expect(loadSpy).toHaveBeenLastCalledWith(expect.objectContaining(expected), storeKey);
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
            const mockKlasse: Organisation = DoFactory.getKlasse();
            const selectionRef: Ref<Array<string> | undefined> = ref(undefined);
            if (id) mockKlasse.id = id;
            organisationStore.loadKlassenForFilter = vi.fn(async () => {
              if (!organisationStore.klassenFilters.has(storeKey ?? ''))
                organisationStore.klassenFilters.set(storeKey ?? '', {
                  filterResult: [],
                  total: 0,
                  loading: false,
                });
              organisationStore.klassenFilters.get(storeKey ?? '')!.filterResult = [mockKlasse];
              selectionRef.value = id ? [id] : [];
            });
            const wrapper: VueWrapper = mountComponent({ ...defaultProps });
            vi.runAllTimers();
            await wrapper.setProps({ selectedKlassen: selectionRef });
            vi.runAllTimers();
            await nextTick();
            const actualText: string = wrapper.find(`[data-testid="${testId}"]`).text();
            if (id) expect(actualText).toContain(mockKlasse.name);
            else expect(actualText).toBe('');
          });
        });

        describe.each([[true], [false]])('when highlightSelection is %s', async (highlightSelection: boolean) => {
          test('it correctly displays highlight', async () => {
            const selectedKlasseId: string = faker.string.uuid();
            const wrapper: VueWrapper = mountComponent({
              ...defaultProps,
              highlightSelection,
            });
            await wrapper
              .findComponent({
                name: 'v-autocomplete',
              })
              .setValue(selectedKlasseId);

            const classes: Array<string> = wrapper.findComponent({ ref: testId }).classes();
            if (highlightSelection) {
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
