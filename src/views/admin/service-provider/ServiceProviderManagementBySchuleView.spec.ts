import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import routes from '@/router/routes';
import ServiceProviderManagementBySchuleView from './ServiceProviderManagementBySchuleView.vue';
import { nextTick, type Component } from 'vue';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';
import type { Organisation } from '@/stores/OrganisationStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';

let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
const searchFilterStore: SearchFilterStore = useSearchFilterStore();

function mountComponent(): VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> {
  return mount(ServiceProviderManagementBySchuleView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderManagementBySchuleView: ServiceProviderManagementBySchuleView as Component,
      },
      plugins: [router],
    },
  });
}

interface ServiceProviderManagementBySchuleView {
  selectedOrganisationId: string;
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

  router.push('/');
  await router.isReady();

  serviceProviderStore.manageableServiceProviders = [
    DoFactory.getManageableServiceProviderListEntryResponse(),
    DoFactory.getManageableServiceProviderListEntryResponse(),
  ];
});

describe('ServiceProviderManagementView', () => {
  it('should render', () => {
    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    expect(wrapper.exists()).toBe(true);
  });

  it('it sets and resets filters', async () => {
    const wrapper: VueWrapper = mountComponent() as VueWrapper;

    const schule: Organisation = DoFactory.getSchule();

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });

    schuleAutocomplete?.vm.$emit('update:selectedSchulen', schule.id);
    await nextTick();
    await flushPromises();

    const selectedSchule: string = (wrapper.vm as unknown as ServiceProviderManagementBySchuleView)
      .selectedOrganisationId;

    expect(selectedSchule).toBe(schule.id);

    await wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();
    await flushPromises();

    expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toEqual([]);
  });

  it('should set selectedOrganisationId from searchFilterStore on mount', async () => {
    const schuleId: string = 'test-schule-id';
    searchFilterStore.selectedSchuleForSchulischeServiceProvider = schuleId;

    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    await nextTick();

    const selectedSchule: string = (wrapper.vm as unknown as ServiceProviderManagementBySchuleView)
      .selectedOrganisationId;

    expect(selectedSchule).toBe(schuleId);
  });

  it('should not set selectedOrganisationId when searchFilterStore value is null on mount', async () => {
    searchFilterStore.selectedSchuleForSchulischeServiceProvider = null;

    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    await nextTick();

    const selectedSchule: string = (wrapper.vm as unknown as ServiceProviderManagementBySchuleView)
      .selectedOrganisationId;

    expect(selectedSchule).toBe('');
  });
});
