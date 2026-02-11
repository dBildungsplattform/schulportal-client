import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import routes from '@/router/routes';
import ServiceProviderManagementBySchuleView from './ServiceProviderManagementBySchuleView.vue';
import { nextTick, type Component } from 'vue';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';
import type { Organisation } from '@/stores/OrganisationStore';

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

  it('it sets and resets filters', async () => {
    const wrapper: VueWrapper = mountComponent() as VueWrapper;

    const schule: Organisation = DoFactory.getSchule();

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
    const schuleInputElement: DOMWrapper<Element> | undefined = schuleAutocomplete?.find(
      '#service-provider-management-by-schule-organisation-select',
    );

    await schuleInputElement?.setValue([schule.name]);
    await nextTick();
    await flushPromises();

    expect((schuleInputElement?.element as HTMLInputElement).value).toBe(schule.name);

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(schuleAutocomplete?.text()).toBe('');
  });
});
