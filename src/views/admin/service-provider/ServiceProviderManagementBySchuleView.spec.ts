import { mount, VueWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import routes from '@/router/routes';
import ServiceProviderManagementBySchuleView from './ServiceProviderManagementBySchuleView.vue';
import { type Component } from 'vue';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';

let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

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
});
