import {
  ServiceProviderKategorie,
  ServiceProviderTarget,
  type ServiceProviderResponse,
} from '@/api-client/generated/api';
import routes from '@/router/routes';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import {
  RollenMerkmal,
  RollenSystemRecht,
  useRolleStore,
  type RolleResponse,
  type RolleStore,
} from '@/stores/RolleStore';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import type Module from 'module';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type Router,
} from 'vue-router';
import RolleCreationView from './RolleCreationView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();
const organisationStore: OrganisationStore = useOrganisationStore();

type OnBeforeRouteLeaveCallback = (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  _next: NavigationGuardNext,
) => void;
let { cb }: { cb: OnBeforeRouteLeaveCallback } = vi.hoisted(() => {
  return {
    cb: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, _next: NavigationGuardNext): void => {},
  };
});

organisationStore.allOrganisationen = [
  {
    id: '1',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
  {
    id: '2',
    name: 'Einstein-Grundschule',
    kennung: '123798465',
    namensergaenzung: 'des Alberts',
    kuerzel: 'EGS',
    typ: 'SCHULE',
    administriertVon: '1',
  },
];

function mountComponent(): VueWrapper {
  return mount(RolleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleCreationView,
      },
      plugins: [router],
    },
  });
}

type FormFields = {
  organisation: string;
  rollenart: string;
  rollenname: string;
  merkmale: Array<string>;
  provider: Array<string>;
  systemrechte: Array<string>;
};
type FormSelectors = {
  orgSelect: VueWrapper;
  rollenartSelect: VueWrapper;
  rollennameInput: VueWrapper;
  merkmaleSelect: VueWrapper;
  providerSelect: VueWrapper;
  systemrechteSelect: VueWrapper;
};
async function fillForm(args: Partial<FormFields>): Promise<Partial<FormSelectors>> {
  const { organisation, rollenart, rollenname, merkmale, provider, systemrechte }: Partial<FormFields> = args;
  const selectors: Partial<FormSelectors> = {};
  if (organisation) {
    const orgSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue(organisation);
    await nextTick();
    selectors.orgSelect = orgSelect;
  }

  if (rollenart) {
    const rollenartSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue(rollenart);
    await nextTick();
    selectors.rollenartSelect = rollenartSelect;
  }

  if (rollenname) {
    const rollennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenname-input' });
    expect(rollennameInput?.exists()).toBe(true);
    await rollennameInput?.find('input').setValue(rollenname);
    await nextTick();
    selectors.rollennameInput = rollennameInput;
  }

  if (merkmale) {
    const merkmaleSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'merkmale-select' });
    merkmaleSelect?.setValue(merkmale);
    await nextTick();
    selectors.merkmaleSelect = merkmaleSelect;
  }

  if (provider) {
    const providerSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'service-provider-select' });
    providerSelect?.setValue(provider);
    await nextTick();
    selectors.providerSelect = providerSelect;
  }

  if (systemrechte) {
    const systemrechteSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'systemrechte-select' });
    systemrechteSelect?.setValue(systemrechte);
    await nextTick();
    selectors.systemrechteSelect = systemrechteSelect;
  }
  return selectors;
}

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <router-view>
        <div id="app"></div>
      </router-view>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mountComponent();
  rolleStore.errorCode = '';
});

afterEach(() => {
  wrapper?.unmount();
});

describe('RolleCreationView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('[data-testid="administrationsebene-select"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'RolleForm' })).toBeTruthy();
  });

  test('it renders an error', async () => {
    rolleStore.errorCode = 'ERROR_ERROR';
    await nextTick();
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it closes the view and navigates back to rolle table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers dirty warning', async () => {
    await fillForm({
      organisation: '1',
      rollenart: 'LERN',
      rollenname: 'NewRolle',
      merkmale: ['1'],
      provider: ['1'],
      systemrechte: ['1'],
    });

    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="confirm-unsaved-changes-button"]');
  });

  test('it fills form and triggers submit', async () => {
    const { orgSelect, rollenartSelect }: Partial<FormSelectors> = await fillForm({
      organisation: '1',
      rollenart: 'LERN',
      rollenname: 'NewRolle',
      provider: ['1'],
    });

    expect(orgSelect?.text()).toEqual('9356494 (Albert-Emil-Hansebrot-Gymnasium)');
    expect(rollenartSelect?.text()).toEqual('Lern');

    const mockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    };

    expect(
      wrapper
        ?.findComponent({ ref: 'rolle-creation-form' })
        .find('[data-testid="rolle-form-submit-button"]')
        .isVisible(),
    ).toBe(true);

    wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'form-wrapper' })
      .find('[data-testid="rolle-form-submit-button"]')
      .trigger('click');
    await nextTick();

    await flushPromises();

    rolleStore.createdRolle = mockRolle;
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-rolle-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-rolle-button"]').trigger('click');
    await nextTick();

    expect(rolleStore.createdRolle).toBe(null);
  });

  test('it fills form and triggers submit and uses correct Rolle to add serviceproviders', async () => {
    const { orgSelect, rollenartSelect }: Partial<FormSelectors> = await fillForm({
      organisation: '1',
      rollenart: 'LERN',
      rollenname: 'NewRolle',
      provider: ['1'],
    });

    expect(orgSelect?.text()).toEqual('9356494 (Albert-Emil-Hansebrot-Gymnasium)');
    expect(rollenartSelect?.text()).toEqual('Lern');
    const oldmockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 5,
    };
    rolleStore.createdRolle = oldmockRolle;

    const mockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '2',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    };
    vi.spyOn(rolleStore, 'createRolle').mockResolvedValue(mockRolle);

    expect(
      wrapper
        ?.findComponent({ ref: 'rolle-creation-form' })
        .find('[data-testid="rolle-form-submit-button"]')
        .isVisible(),
    ).toBe(true);

    wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'form-wrapper' })
      .find('[data-testid="rolle-form-submit-button"]')
      .trigger('click');
    await nextTick();

    await flushPromises();
    await flushPromises();

    expect(rolleStore.createRolle).toHaveBeenCalled();
    expect(rolleStore.updateServiceProviderInRolle).toHaveBeenCalledWith(mockRolle.id, {
      serviceProviderIds: ['1'],
      version: mockRolle.version,
    });
    expect(rolleStore.updateServiceProviderInRolle).not.toHaveBeenCalledWith(oldmockRolle.id, {
      serviceProviderIds: ['1'],
      version: oldmockRolle.version,
    });
  });

  test('It display the success template with no systemrechte nor merkmale', async () => {
    const mockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: new Set<RollenMerkmal>(),
      systemrechte: new Set<RollenSystemRecht>(),
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    };

    rolleStore.createdRolle = mockRolle;
    rolleStore.createdRolle.serviceProviders = [];
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-rolle-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-rolle-button"]').trigger('click');
    await nextTick();

    expect(rolleStore.createdRolle).toBe(null);
  });

  test('it displays the success template with service providers', async () => {
    const mockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    };

    rolleStore.createdRolle = mockRolle;

    const testServiceProviders: Array<ServiceProviderResponse> = [
      {
        id: 'sp001',
        name: 'Provider One',
        target: ServiceProviderTarget.Email,
        url: 'https://provider-one.com',
        kategorie: ServiceProviderKategorie.Email,
        hasLogo: true,
        requires2fa: false,
      },
      {
        id: 'sp002',
        name: 'Provider Two',
        target: ServiceProviderTarget.Email,
        url: 'https://provider-three.com',
        kategorie: ServiceProviderKategorie.Email,
        hasLogo: false,
        requires2fa: false,
      },
      {
        id: 'sp003',
        name: 'Provider Three',
        target: ServiceProviderTarget.Email,
        url: 'https://provider-three.com',
        kategorie: ServiceProviderKategorie.Email,
        hasLogo: true,
        requires2fa: false,
      },
    ];
    rolleStore.createdRolle.serviceProviders = testServiceProviders;
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-rolle-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-rolle-button"]').trigger('click');
    await nextTick();

    expect(rolleStore.createdRolle).toBe(null);
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
    rolleStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });

  describe('navigation interception', () => {
    afterEach(() => {
      vi.unmock('vue-router');
    });
    test('triggers, if form is dirty', async () => {
      const expectedCallsToNext: number = 0;
      vi.mock('vue-router', async (importOriginal: () => Promise<Module>) => {
        const mod: Module = await importOriginal();
        return {
          ...mod,
          onBeforeRouteLeave: vi.fn((cbfn: OnBeforeRouteLeaveCallback) => {
            cb = cbfn;
          }),
        };
      });
      wrapper = mountComponent();
      await fillForm({
        organisation: '1',
        rollenart: 'LERN',
        rollenname: 'NewRolle',
        provider: ['1'],
      });

      const spy: Mock = vi.fn();
      cb({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
      expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
    });

    test('does not trigger, if form is not dirty', async () => {
      const expectedCallsToNext: number = 1;
      vi.mock('vue-router', async (importOriginal: () => Promise<Module>) => {
        const mod: Module = await importOriginal();
        return {
          ...mod,
          onBeforeRouteLeave: vi.fn((cbfn: OnBeforeRouteLeaveCallback) => {
            cb = cbfn;
          }),
        };
      });
      wrapper = mountComponent();
      const spy: Mock = vi.fn();
      cb({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
      expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
    });
  });
});
