import routes from '@/router/routes';
import { VueWrapper, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import ServiceProviderDetailsView from './ServiceProviderDetailsView.vue';
import {
  useServiceProviderStore,
  type ManageableServiceProviderListEntry,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';
import type { MockInstance } from 'vitest';

let wrapper: VueWrapper | null = null;
let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

const mockServiceProvider: ManageableServiceProviderListEntry =
  DoFactory.getManageableServiceProviderListEntryResponse();

beforeEach(async () => {
  setActivePinia(createPinia());
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

  wrapper = mount(ServiceProviderDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderDetailsView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
      plugins: [router],
    },
  });
  serviceProviderStore.currentServiceProvider = mockServiceProvider;
});

describe('ServiceProviderDetailsView', () => {
  test('it renders the service provider details page and shows its data', async () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="service-provider-details-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="service-provider-name"]').text()).toBe(mockServiceProvider.name);
    expect(wrapper?.find('[data-testid="service-provider-administrationsebene"]').text()).toBe(
      mockServiceProvider.administrationsebene.name,
    );
    expect(wrapper?.find('[data-testid="service-provider-requires-2fa"]').text()).toBe(
      mockServiceProvider.requires2fa ? 'Ja' : 'Nein',
    );
    expect(wrapper?.find('[data-testid="service-provider-kategorie"]').text()).toBe(
      mockServiceProvider.kategorie.toLowerCase(),
    );
    expect(wrapper?.find('[data-testid="service-provider-link"]').text()).toBe(
      mockServiceProvider.url ? mockServiceProvider.url : 'fehlt',
    );
  });

  test('it navigates back to service providers table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });
});
