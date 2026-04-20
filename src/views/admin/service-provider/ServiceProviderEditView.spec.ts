import routes from '@/router/routes';
import {
  useServiceProviderStore,
  type ManageableServiceProviderDetail,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import ServiceProviderEditView from '@/views/admin/service-provider/ServiceProviderEditView.vue';
import { mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import type { Mock } from 'vitest';
import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

describe('ServiceProviderEditView', () => {
  let router: ReturnType<typeof createRouter>;
  let wrapper: VueWrapper | null = null;

  beforeEach(async () => {
    document.body.innerHTML = `
      <div>
        <div id=\"app\"></div>
      </div>
    `;
    router = createRouter({
      history: createWebHistory(),
      routes,
    });
    const testServiceProvider: ManageableServiceProviderDetail = DoFactory.getManageableServiceProviderDetail();
    serviceProviderStore.currentServiceProvider = testServiceProvider;
    router.push({ name: 'angebot-details', params: { id: testServiceProvider.id } });
    await router.isReady();

    wrapper = mount(ServiceProviderEditView, {
      attachTo: document.getElementById('app') || '',
      global: {
        components: {
          ServiceProviderEditView: ServiceProviderEditView as Component,
        },
        plugins: [router],
      },
    });
  });

  it('renders the headline and form', () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').exists()).toBe(true);
    expect(wrapper?.findComponent({ name: 'ServiceProviderForm' }).exists()).toBe(true);
  });

  it('edits and saves a service provider, calling the store', async () => {
    const spy: Mock = vi.spyOn(serviceProviderStore, 'updateServiceProvider').mockResolvedValue();
    const validEdit: Parameters<typeof serviceProviderStore.updateServiceProvider>[1] = {
      name: 'Neuer Name',
      url: 'https://neue-url.de',
      logo: '',
      kategorie: serviceProviderStore.currentServiceProvider?.kategorie,
      merkmale: serviceProviderStore.currentServiceProvider?.merkmale || [],
      requires2fa: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await (wrapper as VueWrapper).findComponent({ name: 'ServiceProviderForm' }).vm.$emit('click:submit', validEdit);
    expect(spy).toHaveBeenCalledWith(serviceProviderStore.currentServiceProvider?.id, validEdit);
    spy.mockRestore();
  });
});
