import { RollenSystemRecht } from '@/api-client/generated';
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
import KlassenFilter from './KlassenFilter.vue';

type Props = {
  hideDetails?: boolean;
  systemrechteForSearch?: Array<RollenSystemRecht>;
  multiple: boolean;
  readonly?: boolean;
  selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
  highlightSelection?: boolean;
  placeholderText?: string;
  administriertVon?: string[];
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
  systemrechte: [RollenSystemRecht.KlassenVerwalten],
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
  describe.each([[true], [false]])('when multiple is %s', (multiple: boolean) => {
    describe.each([[true], [false]])('when readonly is %s', (readonly: boolean) => {
      const defaultProps: Props = { multiple, readonly };

      test('it renders', () => {
        const wrapper: VueWrapper = mountComponent(defaultProps);
        expect(wrapper.find('[data-testid="klasse-select"]').isVisible()).toBe(true);
      });

      describe.each([
        [[RollenSystemRecht.KlassenVerwalten]],
        [[RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.KlassenVerwalten]],
        [[]],
        [undefined],
      ])('when systemrechteForSearch are %s', (systemrechteForSearch: Array<RollenSystemRecht> | undefined) => {
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
          expect(spy).toHaveBeenLastCalledWith(expectedFilter);
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

            const klasseSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find('#klasse-select');
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
            const klasseSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find('#klasse-select');
            await klasseSearchInput.setValue(searchString);
            vi.runAllTimers();
            await flushPromises();
            expect(loadSpy).toHaveBeenLastCalledWith(expected);
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
            expect(loadSpy).toHaveBeenLastCalledWith(expected);
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
          const mockKlasse: Organisation = DoFactory.getKlasse();
          const selectionRef: Ref<Array<string> | undefined> = ref(undefined);
          if (id) mockKlasse.id = id;
          organisationStore.loadKlassenForFilter = vi.fn(async () => {
            organisationStore.klassenFilter.filterResult = [mockKlasse];
            selectionRef.value = id ? [id] : [];
          });
          const wrapper: VueWrapper = mountComponent({ ...defaultProps });
          vi.runAllTimers();
          await wrapper.setProps({ selectedKlassen: selectionRef });
          vi.runAllTimers();
          await nextTick();
          const actualText: string = wrapper.find('[data-testid="klasse-select"]').text();
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

          const classes: Array<string> = wrapper.findComponent({ ref: 'klasse-select' }).classes();
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
