import routes from '@/router/routes';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import ServiceProviderEditView from '@/views/admin/service-provider/ServiceProviderEditView.vue';
import { mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { type Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

describe('ServiceProviderEditView', () => {
  let router: ReturnType<typeof createRouter>;
  let wrapper: VueWrapper | null = null;

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

    serviceProviderStore.currentServiceProvider = DoFactory.getManageableServiceProviderDetail();

    wrapper = mount(ServiceProviderEditView, {
      attachTo: document.getElementById('app') || '',
      global: {
        components: {
          ServiceProviderEditView: ServiceProviderEditView as Component,
        },
        mocks: {
          route: {
            fullPath: `angebot/${serviceProviderStore.currentServiceProvider?.id}/edit`,
          },
        },
        plugins: [router],
      },
    });
  });

  it('renders the headline and form', async () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').exists()).toBe(true);
    expect(wrapper?.findComponent({ name: 'ServiceProviderForm' }).exists()).toBe(true);
  });
});
