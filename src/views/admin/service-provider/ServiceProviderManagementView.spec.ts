import { mount, VueWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import routes from '@/router/routes';
import ServiceProviderManagementView from './ServiceProviderManagementView.vue';
import type { MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';

let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

function mountComponent(): VueWrapper {
  return mount(ServiceProviderManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderManagementView,
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

  router.push('/');
  await router.isReady();

  serviceProviderStore.manageableServiceProviders = [
    DoFactory.getManageableServiceProviderListEntryResponse(),
    DoFactory.getManageableServiceProviderListEntryResponse(),
  ];
});

describe('ServiceProviderManagementView', () => {
  it('should render', () => {
    const wrapper: VueWrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('it routes to service provider details page', async () => {
    const wrapper: VueWrapper = mountComponent();
    const push: MockInstance = vi.spyOn(router, 'push');

    await wrapper.find('.v-data-table__tr').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
