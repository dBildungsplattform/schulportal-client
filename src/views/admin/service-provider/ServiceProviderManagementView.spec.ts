import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';

import routes from '@/router/routes';
import ServiceProviderManagementView from './ServiceProviderManagementView.vue';
import type { MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';

let router: Router;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

function mountComponent(): VueWrapper<InstanceType<typeof ServiceProviderManagementView>> {
  return mount(ServiceProviderManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderManagementView: ServiceProviderManagementView as Component,
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
    DoFactory.getManageableServiceProviderListEntryResponse({isDeleteAuthorized: true}),
    DoFactory.getManageableServiceProviderListEntryResponse({isDeleteAuthorized: false}),
  ];
});

describe('ServiceProviderManagementView', () => {
  it('should render', () => {
    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    expect(wrapper.exists()).toBe(true);
  });

  it('routes to service provider details page', async () => {
    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    const push: MockInstance = vi.spyOn(router, 'push');

    await wrapper.find('.v-data-table__tr').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });

  describe('ServiceProviderDelete', () => {
    it('renders ServiceProviderDelete button for each row', async () => {
      const wrapper: VueWrapper = mountComponent() as VueWrapper;
      // Find all delete icons (activators)
      const deleteIcons = wrapper.findAll('[data-testid="open-service-provider-delete-dialog-icon"]');
      expect(deleteIcons.length).toBe(serviceProviderStore.manageableServiceProviders.filter(sp => sp.isDeleteAuthorized).length);
    });

    it('opens and confirms delete dialog, calls store method', async () => {
      const wrapper: VueWrapper = mountComponent() as VueWrapper;
      // Find first delete icon and click it
      const deleteIcon = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
      await deleteIcon.trigger('click');
      await nextTick();

      // Find and click the confirm delete button
      const confirmBtn = document.querySelector('[data-testid="service-provider-delete-button"]');
      expect(confirmBtn).toBeTruthy();

      // Spy on the store method
      const deleteSpy = vi.spyOn(serviceProviderStore, 'deleteServiceProvider').mockResolvedValue();
      // Click confirm
      if (confirmBtn) {
        (confirmBtn as HTMLElement).click();
        await nextTick();
        expect(deleteSpy).toHaveBeenCalled();
      }
      deleteSpy.mockRestore();
    });

    it('closes the delete dialog and resets error code', async () => {
      const wrapper: VueWrapper = mountComponent() as VueWrapper;
      // Open dialog
      const deleteIcon = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
      await deleteIcon.trigger('click');
      await nextTick();

      const confirmBtn: HTMLElement | null = document.querySelector('[data-testid="service-provider-delete-button"]');
      expect(confirmBtn).toBeTruthy();
      confirmBtn!.click();

      // Simulate error code
      serviceProviderStore.errorCode = 'SOME_ERROR';
      await nextTick();

      // Find and click cancel button
      const cancelBtn: HTMLElement | null = document.querySelector(
        '[data-testid="close-service-provider-delete-error-dialog-button"]',
      );
      expect(cancelBtn).toBeTruthy();
      if (cancelBtn) {
        (cancelBtn as HTMLElement).click();
        await nextTick();
        await flushPromises();
        expect(serviceProviderStore.errorCode).toBe('');
      }
    });
  });
});
