import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import { nextTick, type Component } from 'vue';
import routes from '@/router/routes';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { RollenArt, useRolleStore, type RolleStore } from '@/stores/RolleStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import { DoFactory } from 'test/DoFactory';
import type { Mock } from 'vitest';
import MptRollenManagementView from './MptRollenManagementView.vue';

type MptRollenManagementViewVm = {
  selectedOrganisationId: string;
};

let router: Router;
let rolleStore: RolleStore;
let organisationStore: OrganisationStore;
let searchFilterStore: SearchFilterStore;

function mountComponent(): VueWrapper<InstanceType<typeof MptRollenManagementView>> {
  return mount(MptRollenManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        MptRollenManagementView: MptRollenManagementView as Component,
      },
      plugins: [router],
    },
  });
}

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

  router.push('/admin/rollen/mpt');
  await router.isReady();

  rolleStore = useRolleStore();
  organisationStore = useOrganisationStore();
  searchFilterStore = useSearchFilterStore();

  rolleStore.$reset();
  organisationStore.$reset();
  searchFilterStore.$reset();

  vi.spyOn(rolleStore, 'getAllRollen').mockResolvedValue();
  vi.spyOn(organisationStore, 'getOrganisationById').mockResolvedValue();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MptRollenManagementView', () => {
  it('renders hint text when no school is selected', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Bitte wählen Sie zunächst im Filter eine Schule aus');
    expect(rolleStore.getAllRollen).not.toHaveBeenCalled();
  });

  it('loads rollen with MPT systemrecht when schule is selected', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    const schuleId: string = DoFactory.getSchule().id;
    const schuleFilter: VueWrapper = wrapper.findComponent({ name: 'SchulenFilter' });

    schuleFilter.vm.$emit('update:selectedSchulen', schuleId);
    await nextTick();
    await flushPromises();

    expect(rolleStore.getAllRollen).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: schuleId,
        systemrechte: [expect.stringMatching('MPT_ROLLEN_VERWALTEN')],
      }),
    );
  });

  it('renders only rollenname and rollenart table headers', async () => {
    rolleStore.allRollen = [
      DoFactory.getRolleWithServiceProviders({ name: 'Nichtlehrrolle', rollenart: RollenArt.Nlehr }),
      DoFactory.getRolleWithServiceProviders({ name: 'Schulbegleitung', rollenart: RollenArt.Schb }),
    ];
    rolleStore.totalRollen = 2;

    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    await nextTick();

    expect(wrapper.text()).toContain('Rollenname');
    expect(wrapper.text()).toContain('Rollenart');
    expect(wrapper.find('[data-testid="rolle-management-title"]').exists()).toBe(false);
  });

  it('sorts by rollenart and then by rollenname', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    await flushPromises();

    rolleStore.allRollen = [
      DoFactory.getRolleWithServiceProviders({ name: 'Nichtlehrrolle', rollenart: RollenArt.Nlehr }),
      DoFactory.getRolleWithServiceProviders({ name: 'Schulbegleitung', rollenart: RollenArt.Schb }),
    ];
    rolleStore.totalRollen = 2;
    await nextTick();

    const resultTable: VueWrapper = wrapper.findComponent({ name: 'ResultTable' });
    const tableItems: Array<{ name: string }> = (
      resultTable as unknown as { props: (key: string) => Array<{ name: string }> }
    ).props('items');
    expect(tableItems[0]!.name).toBe('Nichtlehrrolle');
    expect(tableItems[1]!.name).toBe('Schulbegleitung');
  });

  it('loads page 2 with updated offset', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    const schuleId: string = DoFactory.getSchule().id;
    const schuleFilter: VueWrapper = wrapper.findComponent({ name: 'SchulenFilter' });
    const getAllRollenMock: Mock = rolleStore.getAllRollen as unknown as Mock;

    schuleFilter.vm.$emit('update:selectedSchulen', schuleId);
    await nextTick();
    await flushPromises();

    getAllRollenMock.mockClear();
    rolleStore.totalRollen = 50;
    await nextTick();

    await wrapper.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    await flushPromises();
    const latestCallArgs: unknown = getAllRollenMock.mock.calls.at(-1)?.[0];

    expect(latestCallArgs).toEqual(
      expect.objectContaining({
        organisationId: schuleId,
        offset: 30,
      }),
    );
  });

  it('updates limit and reloads data', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    const schuleId: string = DoFactory.getSchule().id;
    const schuleFilter: VueWrapper = wrapper.findComponent({ name: 'SchulenFilter' });

    schuleFilter.vm.$emit('update:selectedSchulen', schuleId);
    await nextTick();
    await flushPromises();

    const resultTable: VueWrapper = wrapper.findComponent({ name: 'ResultTable' });
    resultTable.vm.$emit('onItemsPerPageUpdate', 50);
    await nextTick();

    const getAllRollenMock: Mock = rolleStore.getAllRollen as unknown as Mock;
    const latestCallArgs: unknown = getAllRollenMock.mock.calls.at(-1)?.[0];

    expect(latestCallArgs).toEqual(
      expect.objectContaining({
        organisationId: schuleId,
        limit: 50,
      }),
    );
  });

  it('resets school filter and table state', async () => {
    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    const schuleId: string = DoFactory.getSchule().id;
    const schuleFilter: VueWrapper = wrapper.findComponent({ name: 'SchulenFilter' });

    rolleStore.allRollen = [DoFactory.getRolleWithServiceProviders()];
    rolleStore.totalRollen = 1;

    schuleFilter.vm.$emit('update:selectedSchulen', schuleId);
    await nextTick();

    await wrapper.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(rolleStore.allRollen).toEqual([]);
    expect(rolleStore.totalRollen).toBe(0);
    expect(searchFilterStore.selectedSchuleForMptRollen).toBe(null);
  });

  it('restores selected school from search filter store on mount', async () => {
    const schuleId: string = DoFactory.getSchule().id;
    searchFilterStore.selectedSchuleForMptRollen = schuleId;

    const wrapper: VueWrapper<InstanceType<typeof MptRollenManagementView>> = mountComponent();
    await flushPromises();

    expect((wrapper.vm as unknown as MptRollenManagementViewVm).selectedOrganisationId).toBe(schuleId);
    expect(rolleStore.getAllRollen).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: schuleId,
      }),
    );
  });
});
