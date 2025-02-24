import { RollenSystemRecht, TraegerschaftTyp, type PersonenkontextRolleFieldsResponse } from '@/api-client/generated';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
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
      const tempSchule: PersonenkontextRolleFieldsResponse['organisation'] = {
        id: 'auto-selected-schule-id',
        kennung: '23314',
        name: 'Siegbert-Schwafel-Schule',
        typ: OrganisationsTyp.Schule,
        administriertVon: null,
        namensergaenzung: null,
        kuerzel: '',
        // eslint-disable-next-line no-underscore-dangle
        traegerschaft: TraegerschaftTyp._01,
        itslearningEnabled: true,
        version: 1,
      };
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
        beforeEach(() => {
          authStore.currentUser = {
            sub: 'blaaaah',
            name: null,
            given_name: null,
            family_name: null,
            middle_name: null,
            nickname: null,
            preferred_username: null,
            profile: null,
            picture: null,
            website: null,
            email: null,
            email_verified: null,
            gender: null,
            birthdate: null,
            zoneinfo: null,
            locale: null,
            phone_number: null,
            updated_at: null,
            personId: null,
            personenkontexte: autoSelectedSchule
              ? [
                  {
                    organisation: autoSelectedSchule,
                    rolle: {
                      systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
                      serviceProviderIds: ['some-sp-id'],
                    },
                  },
                ]
              : [
                  {
                    organisation: tempSchule,
                    rolle: {
                      systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
                      serviceProviderIds: ['some-sp-id'],
                    },
                  },
                  {
                    organisation: tempSchule,
                    rolle: {
                      systemrechte: [RollenSystemRecht.KlassenVerwalten, RollenSystemRecht.SchulenVerwalten],
                      serviceProviderIds: ['some-sp-id'],
                    },
                  },
                ],
            password_updated_at: null,
          };
        });
        type InitialIdsTestData = {
          label: string;
          initialIds?: Props['initialIds'];
        };
        describe.each([{ label: 'given', initialIds: 'initial-id-1234' }, { label: 'not given' }])(
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
                  if (autoSelectedSchule) return [autoSelectedSchule.id];
                  return [];
                })();
              const expectedFilter: OrganisationenFilter = {
                ...defaultFilter,
                systemrechte: systemrechteForSearch,
                organisationIds: expectedIdsInFilter,
              };

              test('it correctly initializes input', async () => {
                const expected: Array<string> | string = multiple
                  ? (expectedIdsInFilter ?? [])
                  : (expectedIdsInFilter?.at(0) ?? '');
                const wrapper: VueWrapper = mountComponent({ ...defaultProps, initialIds, systemrechteForSearch });
                expect(wrapper.find('[data-testid="schule-select"]').text()).toBe(expected);
              });

              test('it correctly sets disabled-attribute on input', async () => {
                const autoselected: boolean = autoSelectedSchule != null;
                const wrapper: VueWrapper = mountComponent({ ...defaultProps, initialIds, systemrechteForSearch });
                expectInputDisabledAttrToBe(readonly || autoselected);
                wrapper.setProps({ readonly: !readonly });
                await nextTick();
                // TODO: flips for some reason
                expectInputDisabledAttrToBe(!readonly || autoselected);
              });

              test('it initializes store', async () => {
                const resetSpy: MockInstance = vi.spyOn(organisationStore, 'resetSchulFilter');
                const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                const wrapper: VueWrapper = mountComponent({
                  ...defaultProps,
                  initialIds,
                  systemrechteForSearch,
                });
                expect(wrapper.find('[data-testid="schule-select"]').isVisible()).toBe(true);
                await nextTick();
                expect(resetSpy).toHaveBeenCalledOnce();
                expect(loadSpy).toHaveBeenCalledOnce();
                expect(loadSpy).toHaveBeenLastCalledWith(expectedFilter);
              });

              describe.each([[''], ['string']])('when searching for %s', (searchString: string) => {
                test('it triggers search', async () => {
                  const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                  const wrapper: VueWrapper = mountComponent({
                    ...defaultProps,
                    initialIds,
                    systemrechteForSearch,
                  });
                  const schuleSearchInput: ReturnType<VueWrapper['findComponent']> = wrapper.find('#schule-select');
                  await schuleSearchInput.setValue(searchString);
                  vi.runAllTimers();
                  await flushPromises();
                  if (readonly || autoSelectedSchule !== null) {
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

              describe.each([[''], ['753-21064aeu-075wmvou']])('when selecting %s', (selectedSchuleId: string) => {
                function getExpectedIds(): Array<string> {
                  const ids: Array<string> = [...(expectedIdsInFilter ?? [])];
                  if (selectedSchuleId) ids.push(selectedSchuleId);
                  return ids;
                }

                test('it triggers search', async () => {
                  const loadSpy: MockInstance = vi.spyOn(organisationStore, 'loadSchulenForFilter');
                  const wrapper: VueWrapper = mountComponent({
                    ...defaultProps,
                    initialIds,
                    systemrechteForSearch,
                  });
                  const schuleAutoComplete: ReturnType<VueWrapper['findComponent']> = wrapper.findComponent({
                    name: 'v-autocomplete',
                  });
                  await schuleAutoComplete.setValue(selectedSchuleId);
                  vi.runAllTimers();
                  await flushPromises();
                  if (readonly || autoSelectedSchule !== null) {
                    expect(loadSpy).not.toHaveBeenLastCalledWith({
                      ...expectedFilter,
                      searchString: selectedSchuleId,
                    });
                  } else {
                    const expected: OrganisationenFilter = {
                      ...expectedFilter,
                      organisationIds: getExpectedIds(),
                    };
                    expect(loadSpy).toHaveBeenLastCalledWith(expected);
                  }
                });
              });
            });
          },
        );
      });
    });
  });
});
