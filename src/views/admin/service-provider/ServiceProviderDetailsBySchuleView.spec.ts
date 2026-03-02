import routes from '@/router/routes';
import { VueWrapper, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import ServiceProviderDetailsBySchuleView from './ServiceProviderDetailsBySchuleView.vue';
import {
  ServiceProviderKategorie,
  useServiceProviderStore,
  type ManageableServiceProviderDetail,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';
import type { MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import type { RollenerweiterungWithExtendedDataResponse } from '@/api-client/generated';

let wrapper: VueWrapper | null = null;
let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
const authStore: AuthStore = useAuthStore();

const mockServiceProvider: ManageableServiceProviderDetail = DoFactory.getManageableServiceProviderDetail({
  kategorie: ServiceProviderKategorie.Hinweise,
  availableForRollenerweiterung: true,
});

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

  wrapper = mount(ServiceProviderDetailsBySchuleView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderDetailsView: ServiceProviderDetailsBySchuleView as Component,
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
  const mockItems: RollenerweiterungWithExtendedDataResponse[] = Array.from({ length: 2 }, () =>
    DoFactory.getRollenerweiterungItem(),
  );
  serviceProviderStore.rollenerweiterungen = DoFactory.getRollenerweiterungenResponse(mockItems);
  serviceProviderStore.rollenerweiterungenUebersicht = DoFactory.buildRollenerweiterungenUebersicht(mockItems);
  authStore.hasRollenerweiternPermission = true;
});

describe('ServiceProviderDetailsBySchuleView', () => {
  test('it renders the service provider details page and shows its data', () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="service-provider-details-by-schule-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="service-provider-name"]').text()).toBe(mockServiceProvider.name);
    expect(wrapper?.find('[data-testid="service-provider-administrationsebene"]').text()).toBe(
      mockServiceProvider.administrationsebene.name,
    );
    expect(wrapper?.find('[data-testid="service-provider-requires-2fa"]').text()).toBe(
      mockServiceProvider.requires2fa ? 'Ja' : 'Nein',
    );
    expect(wrapper?.find('[data-testid="service-provider-kategorie"]').text()).toBe('Hinweise');
    expect(wrapper?.find('[data-testid="service-provider-link"]').text()).toBe(
      mockServiceProvider.url ? mockServiceProvider.url : 'fehlt',
    );
  });

  test('it navigates back to service providers table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it sets errorCode and goes back to list on alert close', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    serviceProviderStore.errorCode = 'error';
    await nextTick();

    await wrapper?.find('[data-testid$="alert-button"]').trigger('click');

    expect(push).toHaveBeenCalledTimes(1);
  });
});
