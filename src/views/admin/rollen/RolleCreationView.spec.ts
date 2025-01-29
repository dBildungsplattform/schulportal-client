import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import {
  RollenMerkmal,
  RollenSystemRecht,
  type RolleResponse,
  type RolleStore,
  useRolleStore,
} from '@/stores/RolleStore';
import { type OrganisationStore, useOrganisationStore } from '@/stores/OrganisationStore';
import {
  ServiceProviderKategorie,
  ServiceProviderTarget,
  type ServiceProviderResponse,
} from '@/api-client/generated/api';

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();
const organisationStore: OrganisationStore = useOrganisationStore();

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

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(RolleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleCreationView,
      },
      plugins: [router],
    },
  });
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
    // reset errorCode after test
    rolleStore.errorCode = '';
  });

  test('it closes the view and navigates back to rolle table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers dirty warning', async () => {
    const orgSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue('1');
    await nextTick();

    const rollenartSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue('LERN');
    await nextTick();

    const rollennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenname-input' });

    expect(rollennameInput?.exists()).toBe(true);
    await rollennameInput?.find('input').setValue('NewRolle');
    await nextTick();

    const merkmaleSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'merkmale-select' });
    merkmaleSelect?.setValue(['1']);
    await nextTick();

    const providerSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'service-provider-select' });
    providerSelect?.setValue(['1']);
    await nextTick();

    const systemrechteSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'systemrechte-select' });
    systemrechteSelect?.setValue(['1']);
    await nextTick();

    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="confirm-unsaved-changes-button"]');
  });

  test('it fills form and triggers submit', async () => {
    const orgSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue('1');
    await nextTick();

    const rollenartSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue('LERN');
    await nextTick();

    const rollennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenname-input' });

    expect(rollennameInput?.exists()).toBe(true);
    await rollennameInput?.find('input').setValue('NewRolle');
    await nextTick();

    const providerSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'service-provider-select' });
    providerSelect?.setValue(['1']);
    await nextTick();

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
    const orgSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue('1');
    await nextTick();

    const rollenartSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue('LERN');
    await nextTick();

    const rollennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenname-input' });

    expect(rollennameInput?.exists()).toBe(true);
    await rollennameInput?.find('input').setValue('NewRolle');
    await nextTick();

    const providerSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'service-provider-select' });
    providerSelect?.setValue(['1']);
    await nextTick();

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
});
