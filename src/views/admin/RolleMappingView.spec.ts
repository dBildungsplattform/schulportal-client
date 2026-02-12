import { createTestingPinia, type TestingPinia } from '@pinia/testing';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router';

import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
import { RollenArt, useRolleStore, type Rolle, type RolleStore } from '@/stores/RolleStore';
import {
  useRollenMappingStore,
  type CreateRollenMappingBodyParams,
  type RollenMapping,
  type RollenMappingStore,
} from '@/stores/RollenMappingStore';
import { useRollenartStore, type RollenartStore } from '@/stores/RollenartStore';
import {
  useServiceProviderStore,
  type ServiceProvider,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import RolleMappingView from './RolleMappingView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/admin/rolle/mapping/:name?', name: 'rolle-mapping', component: RolleMappingView },
];

function createRouterInstance(): Router {
  return createRouter({
    history: createWebHistory(),
    routes,
  });
}

function mockI18n(): { $t: (key: string) => string } {
  return {
    $t: (key: string): string => {
      const dict: Record<string, string> = {
        'admin.headline': 'Administrationsbereich',
        'admin.rolle.mapping': 'Rollen-Mapping',
        'admin.Role': 'Rolle',
        'admin.save': 'Speichern',
        noDataFound: 'Keine Daten gefunden',
      };
      return dict[key] || key;
    },
  };
}

function stubLayoutCard(): { template: string } {
  return {
    template: '<div><slot /></div>',
  };
}

interface RolleMappingViewVm {
  chosenServiceProvider: Partial<ServiceProvider> | null;
  existingRollenMapping: Array<RollenMapping>;
  dynamicErWInPortalRoles: Array<Partial<Rolle> & { rolleId?: string }>;
  selectedRoles: (string | null)[];
  saveChosenRolesForMapping: () => Promise<void>;
}

describe('RolleMappingView', () => {
  let organisationStore: OrganisationStore;
  let rollenartStore: RollenartStore;
  let serviceProviderStore: ServiceProviderStore;
  let rolleStore: RolleStore;
  let rollenMappingStore: RollenMappingStore;

  const orgs: Array<Organisation> = [
    {
      id: '1',
      name: 'Albert-Emil-Hansebrot-Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'aehg',
      typ: 'LMS',
      administriertVon: '1',
    },
    {
      id: '2',
      name: 'Zweite Schule',
      kennung: '1234567',
      namensergaenzung: 'Schule',
      kuerzel: 'zs',
      typ: 'LMS',
      administriertVon: '1',
    },
  ];

  const rollenartList: string[] = ['Student', 'Teacher', 'Admin'];

  const dynamicRoles: Array<{ id: string; name: string }> = [
    { id: 'r1', name: 'USER' },
    { id: 'r2', name: 'LERN' },
    { id: 'r3', name: 'LEHR' },
    { id: 'r4', name: 'LEIT' },
    { id: 'r5', name: 'SYSADMIN' },
  ];

  beforeEach(async () => {
    document.body.innerHTML = `<div id="app"></div>`;

    const pinia: ReturnType<typeof createTestingPinia> = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);

    organisationStore = useOrganisationStore();
    rollenartStore = useRollenartStore();
    serviceProviderStore = useServiceProviderStore();
    rolleStore = useRolleStore();
    rollenMappingStore = useRollenMappingStore();

    // Seed stores and stub actions
    organisationStore.retrievedLmsOrganisations = orgs as Array<Organisation>;
    organisationStore.getLmsOrganisations = vi.fn(async () => {
      organisationStore.retrievedLmsOrganisations = orgs as Array<Organisation>;
    });

    rollenartStore.rollenartList = rollenartList as Array<RollenArt>;
    rollenartStore.getAllRollenart = vi.fn(async () => {
      rollenartStore.rollenartList = rollenartList as Array<RollenArt>;
    });

    serviceProviderStore.allServiceProviders = [
      { id: 'sp1', name: orgs[0]!.name },
      { id: 'sp2', name: orgs[1]!.name },
    ] as Array<ServiceProvider>;
    serviceProviderStore.getAllServiceProviders = vi.fn(async () => {});

    rolleStore.rollenRetrievedByServiceProvider = dynamicRoles as Array<Rolle>;
    rolleStore.getRollenByServiceProviderId = vi.fn(async (_spId?: string) => {
      // if no provider, respond with empty
      if (!_spId) {
        rolleStore.rollenRetrievedByServiceProvider = [] as Array<Rolle>;
      } else {
        rolleStore.rollenRetrievedByServiceProvider = dynamicRoles as Array<Rolle>;
      }
    });

    rollenMappingStore.allRollenMappings = [] as Array<RollenMapping>;
    rollenMappingStore.getRollenMappingsForServiceProvider = vi.fn(async (_spId?: string) => {
      // default none
      rollenMappingStore.allRollenMappings = [] as Array<RollenMapping>;
    });
    rollenMappingStore.createRollenMapping = vi.fn<(body: CreateRollenMappingBodyParams) => Promise<RollenMapping>>(
      async (body: CreateRollenMappingBodyParams) => {
        return { id: 'mock-created-mapping', ...body } as unknown as RollenMapping;
      },
    );
    rollenMappingStore.updateRollenMapping = vi.fn<(id: string, mapToLmsRolle: string) => Promise<void>>(
      async (_id: string, _mapToLmsRolle: string) => {
        // simulate async update without return value to match store signature
      },
    );
    rollenMappingStore.deleteRollenMappingById = vi.fn(async () => {});

    router = createRouterInstance();
    await router.push({
      path: `/admin/rolle/mapping/${orgs[0]!.name}`,
      query: { instance: orgs[0]!.name },
    });
    await router.isReady();

    wrapper = mount(RolleMappingView, {
      attachTo: document.getElementById('app') as Element,
      global: {
        plugins: [router, pinia],
        stubs: { LayoutCard: stubLayoutCard() },
        mocks: mockI18n(),
      },
    });

    await flushPromises();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  test('renders headline and table with rows for selected instance', async () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').text()).toBe('Administrationsbereich');
    expect(wrapper?.find('[data-testid="rolle-table"]').exists()).toBe(true);
    const rows: DOMWrapper<Element>[] | undefined = wrapper?.findAll('tbody tr');
    expect(rows?.length).toBe(dynamicRoles.length);
    const expectedRoles: string[] = dynamicRoles.map((r: { id: string; name: string }) => r.name);
    rows?.forEach((row: DOMWrapper<Element>, i: number) => {
      expect(row.find('td:first-child').text()).toBe(expectedRoles[i]);
    });
    expect(wrapper?.find('th:nth-child(3) strong').text()).toBe(orgs[0]!.name);
  });

  test('initializes LMS column header from route query on mount', async () => {
    // remount with second org in route
    await router.push({
      path: `/admin/rolle/mapping/${orgs[1]!.name}`,
      query: { instance: orgs[1]!.name },
    });
    await router.isReady();

    const pinia: TestingPinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);

    const orgStore2: OrganisationStore = useOrganisationStore();
    const rollenart2: RollenartStore = useRollenartStore();
    const spStore2: ServiceProviderStore = useServiceProviderStore();
    const roleStore2: RolleStore = useRolleStore();
    const rmStore2: RollenMappingStore = useRollenMappingStore();

    orgStore2.retrievedLmsOrganisations = orgs as Array<Organisation>;
    orgStore2.getLmsOrganisations = vi.fn(async () => {});
    rollenart2.rollenartList = rollenartList as Array<RollenArt>;
    rollenart2.getAllRollenart = vi.fn(async () => {});
    spStore2.allServiceProviders = [{ id: 'sp2', name: orgs[1]!.name }] as Array<ServiceProvider>;
    spStore2.getAllServiceProviders = vi.fn(async () => {});
    roleStore2.rollenRetrievedByServiceProvider = dynamicRoles as Array<Rolle>;
    roleStore2.getRollenByServiceProviderId = vi.fn(async () => {});
    rmStore2.getRollenMappingsForServiceProvider = vi.fn(async () => {});
    rmStore2.allRollenMappings = [] as Array<RollenMapping>;

    const local: VueWrapper = mount(RolleMappingView, {
      global: {
        plugins: [router, pinia],
        stubs: { LayoutCard: stubLayoutCard() },
        mocks: mockI18n(),
      },
    });
    await flushPromises();

    expect(local.find('th:nth-child(3) strong').text()).toBe(orgs[1]!.name);
    local.unmount();
  });

  test('renders empty select options when instance not found', async () => {
    await router.push({
      path: '/admin/rolle/mapping',
      query: { instance: 'UnknownInstance' },
    });
    await router.isReady();
    await flushPromises();

    const selects: DOMWrapper<Element>[] | undefined = wrapper?.findAll('tbody tr td:nth-child(2) v-select');
    selects?.forEach((select: DOMWrapper<Element>) => {
      expect(select.attributes('items')).toBe('[]');
    });
  });

  test('displays placeholder when no instance selected', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: {} });
    await router.isReady();

    const pinia: TestingPinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(pinia);

    const local: VueWrapper = mount(RolleMappingView, {
      global: {
        plugins: [router, pinia],
        stubs: { LayoutCard: stubLayoutCard() },
        mocks: mockI18n(),
      },
    });
    await flushPromises();

    expect(local.find('th:nth-child(3) strong').text()).toBe('...');
    local.unmount();
  });

  test('saveChosenRolesForMapping deletes and creates mappings appropriately', async () => {
    await router.push({
      path: `/admin/rolle/mapping/${orgs[0]!.name}`,
      query: { instance: orgs[0]!.name },
    });
    await router.isReady();

    rollenMappingStore.allRollenMappings = [
      { id: 'm1', rolleId: 'r1', serviceProviderId: 'sp1', mapToLmsRolle: 'Student' },
    ] as Array<RollenMapping>;
    rollenMappingStore.getRollenMappingsForServiceProvider = vi.fn(async (_spId?: string): Promise<void> => {});
    await flushPromises();

    // Set selected roles: null for first (should delete), 'Admin' for second (should create)

    const vm: RolleMappingViewVm = wrapper!.vm as unknown as RolleMappingViewVm;
    vm.selectedRoles = [null, 'Admin', null, null, null];
    vm.dynamicErWInPortalRoles = dynamicRoles as Array<Rolle>;

    await (wrapper?.vm as unknown as { saveChosenRolesForMapping: () => Promise<void> }).saveChosenRolesForMapping();
    await flushPromises();

    expect(rollenMappingStore.createRollenMapping).toHaveBeenCalledWith({
      rolleId: 'r2',
      serviceProviderId: 'sp1',
      mapToLmsRolle: 'Admin',
    });
  });

  test('saveChosenRolesForMapping updates existing mapping when changed', async () => {
    await router.push({
      path: `/admin/rolle/mapping/${orgs[0]!.name}`,
      query: { instance: orgs[0]!.name },
    });
    await router.isReady();
    await flushPromises();

    serviceProviderStore.allServiceProviders = [{ id: 'sp1', name: orgs[0]!.name }] as Array<ServiceProvider>;

    rollenMappingStore.allRollenMappings = [
      { id: 'm1', rolleId: 'r1', serviceProviderId: 'sp1', mapToLmsRolle: 'Student' },
    ];
    vi.spyOn(rollenMappingStore, 'getRollenMappingsForServiceProvider').mockResolvedValue();

    const updateSpy: MockInstance<(rollenMappingId: string, mapToLmsRolle: string) => Promise<void>> = vi
      .spyOn(rollenMappingStore, 'updateRollenMapping')
      .mockResolvedValue();
    const deleteSpy: MockInstance<(rollenMappingId: string) => Promise<void>> = vi
      .spyOn(rollenMappingStore, 'deleteRollenMappingById')
      .mockResolvedValue();

    const vm: RolleMappingViewVm = wrapper!.vm as unknown as RolleMappingViewVm;
    vm.chosenServiceProvider = { id: 'sp1', name: orgs[0]!.name };
    vm.existingRollenMapping = rollenMappingStore.allRollenMappings;
    vm.dynamicErWInPortalRoles = [{ id: 'r1', rolleId: 'r1', name: 'USER' }];
    vm.selectedRoles = ['Teacher'];

    updateSpy.mockClear();
    deleteSpy.mockClear();

    await vm.saveChosenRolesForMapping();
    await flushPromises();

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith('m1', 'Teacher');
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test('saveChosenRolesForMapping deletes existing mapping when chosenRole is null', async () => {
    await router.push({
      path: `/admin/rolle/mapping/${orgs[0]!.name}`,
      query: { instance: orgs[0]!.name },
    });
    await router.isReady();
    await flushPromises();

    serviceProviderStore.allServiceProviders = [{ id: 'sp1', name: orgs[0]!.name }] as Array<ServiceProvider>;
    rollenMappingStore.allRollenMappings = [
      { id: 'm1', rolleId: 'r1', serviceProviderId: 'sp1', mapToLmsRolle: 'Student' },
    ];
    vi.spyOn(rollenMappingStore, 'getRollenMappingsForServiceProvider').mockResolvedValue();

    const updateSpy: MockInstance<(rollenMappingId: string, mapToLmsRolle: string) => Promise<void>> = vi
      .spyOn(rollenMappingStore, 'updateRollenMapping')
      .mockResolvedValue();
    const deleteSpy: MockInstance<(rollenMappingId: string) => Promise<void>> = vi
      .spyOn(rollenMappingStore, 'deleteRollenMappingById')
      .mockResolvedValue();

    const vm: RolleMappingViewVm = wrapper!.vm as unknown as RolleMappingViewVm;
    vm.chosenServiceProvider = { id: 'sp1', name: orgs[0]!.name };
    vm.existingRollenMapping = rollenMappingStore.allRollenMappings;
    vm.dynamicErWInPortalRoles = [{ id: 'r1', rolleId: 'r1', name: 'USER' }];
    vm.selectedRoles = [null];
    updateSpy.mockClear();
    deleteSpy.mockClear();

    await vm.saveChosenRolesForMapping();
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith('m1');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test('saveChosenRolesForMapping does nothing when no service provider is chosen or service provider id is missing', async () => {
    const vm: RolleMappingViewVm = wrapper!.vm as unknown as RolleMappingViewVm;

    // No service provider chosen
    vm.chosenServiceProvider = null;
    await vm.saveChosenRolesForMapping();
    expect(rollenMappingStore.createRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.updateRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.deleteRollenMappingById).not.toHaveBeenCalled();

    // Service provider without id
    vm.chosenServiceProvider = { name: 'No ID SP' };
    await vm.saveChosenRolesForMapping();
    expect(rollenMappingStore.createRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.updateRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.deleteRollenMappingById).not.toHaveBeenCalled();
  });

  test('saveChosenRolesForMapping does nothing when no erwInPortalRole is chosen', async () => {
    const vm: RolleMappingViewVm = wrapper!.vm as unknown as RolleMappingViewVm;

    vm.chosenServiceProvider = { id: 'sp1', name: orgs[0]!.name };
    vm.dynamicErWInPortalRoles = [];
    await vm.saveChosenRolesForMapping();
    expect(rollenMappingStore.createRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.updateRollenMapping).not.toHaveBeenCalled();
    expect(rollenMappingStore.deleteRollenMappingById).not.toHaveBeenCalled();
  });
});
