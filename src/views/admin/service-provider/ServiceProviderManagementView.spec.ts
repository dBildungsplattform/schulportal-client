import { flushPromises, mount, VueWrapper, type DOMWrapper } from '@vue/test-utils';
import { type Router, createRouter, createWebHistory } from 'vue-router';
import routes from '@/router/routes';
import ServiceProviderManagementView from './ServiceProviderManagementView.vue';
import type { MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import {
  useServiceProviderStore,
  type ManageableServiceProviderListEntry,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';

let router: Router;
let serviceProviderStore: ServiceProviderStore;

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

beforeEach(async (): Promise<void> => {
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

  serviceProviderStore = useServiceProviderStore();
  serviceProviderStore.manageableServiceProviders = [
    DoFactory.getManageableServiceProviderListEntryResponse({ isDeleteAuthorized: true }),
    DoFactory.getManageableServiceProviderListEntryResponse({ isDeleteAuthorized: false }),
  ];
});

describe('ServiceProviderManagementView', () => {
  it('should render', () => {
    const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('routes to service provider details page', async () => {
    const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();
    const push: MockInstance = vi.spyOn(router, 'push');

    await wrapper.find('.v-data-table__tr').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });

  describe('ServiceProviderDelete', () => {
    it('renders ServiceProviderDelete button for each row', () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();
      // Find all delete icons (activators)
      const deleteIcons: DOMWrapper<Element>[] = wrapper.findAll(
        '[data-testid="open-service-provider-delete-dialog-icon"]',
      );
      expect(deleteIcons.length).toBe(
        serviceProviderStore.manageableServiceProviders.filter(
          (sp: ManageableServiceProviderListEntry) => sp.isDeleteAuthorized,
        ).length,
      );
    });

    it('opens and confirms delete dialog, calls store method', async () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();
      // Find first delete icon and click it
      const deleteIcon: DOMWrapper<Element> = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
      await deleteIcon.trigger('click');
      await nextTick();

      // Find and click the confirm delete button
      const confirmBtn: HTMLElement | null = document.querySelector('[data-testid="service-provider-delete-button"]');
      expect(confirmBtn).toBeTruthy();

      // Spy on the store method
      const deleteSpy: MockInstance = vi.spyOn(serviceProviderStore, 'deleteServiceProvider').mockResolvedValue();
      // Click confirm
      if (confirmBtn) {
        confirmBtn.click();
        await nextTick();
        expect(deleteSpy).toHaveBeenCalled();
      }
      deleteSpy.mockRestore();
    });

    it('closes the delete dialog and resets error code', async () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();
      // Open dialog
      const deleteIcon: DOMWrapper<Element> = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
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
        cancelBtn.click();
        await nextTick();
        await flushPromises();
        expect(serviceProviderStore.errorCode).toBe('');
      }
    });

    it('closes the delete dialog and removes provider if successful', async () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementView>> = mountComponent();

      const remainingProvider: ManageableServiceProviderListEntry = serviceProviderStore.manageableServiceProviders[1]!;

      const reloadSpy = vi.spyOn(serviceProviderStore, 'getManageableServiceProviders').mockResolvedValue();

      const deleteIcon: DOMWrapper<Element> = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
      await deleteIcon.trigger('click');
      await nextTick();

      const confirmBtn: HTMLElement | null = document.querySelector('[data-testid="service-provider-delete-button"]');
      expect(confirmBtn).toBeTruthy();
      confirmBtn!.click();
      await nextTick();

      const closeBtn: HTMLElement | null = document.querySelector(
        '[data-testid="close-service-provider-delete-success-dialog-button"]',
      );
      expect(closeBtn).toBeTruthy();
      closeBtn!.click();
      await nextTick();

      await flushPromises();

      expect(serviceProviderStore.manageableServiceProviders).toEqual([expect.objectContaining(remainingProvider)]);
      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });
  });
});
