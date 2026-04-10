import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { nextTick, type Component } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';

import routes from '@/router/routes';
import { type Organisation } from '@/stores/OrganisationStore';
import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
import {
  useServiceProviderStore,
  type ManageableServiceProviderListEntry,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { DoFactory } from 'test/DoFactory';
import type { Mock, MockInstance } from 'vitest';
import ServiceProviderManagementBySchuleView from './ServiceProviderManagementBySchuleView.vue';

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

  serviceProviderStore.manageableServiceProvidersForOrganisation = [
    DoFactory.getManageableServiceProviderListEntryResponse({ isDeleteAuthorized: true }),
    DoFactory.getManageableServiceProviderListEntryResponse({ isDeleteAuthorized: false }),
  ];
});

describe('ServiceProviderManagementBySchuleView', () => {
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

  test('it routes to Service Provider details page', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    const wrapper: VueWrapper = mountComponent() as VueWrapper;
    await nextTick();

    const schule: Organisation = DoFactory.getSchule();

    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
    schuleAutocomplete?.vm.$emit('update:selectedSchulen', schule.id);
    await nextTick();

    await flushPromises();

    await wrapper?.find('.v-data-table__tr').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });

  describe('ServiceProviderDelete', () => {
    it('renders ServiceProviderDelete button for each row', (): void => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> = mountComponent();
      // Find all delete icons (activators)
      const deleteIcons: DOMWrapper<Element>[] = wrapper.findAll(
        '[data-testid="open-service-provider-delete-dialog-icon"]',
      );
      expect(deleteIcons.length).toBe(
        serviceProviderStore.manageableServiceProvidersForOrganisation.filter(
          (sp: { isDeleteAuthorized: boolean }) => sp.isDeleteAuthorized,
        ).length,
      );
    });

    it('opens and confirms delete dialog, calls store method', async (): Promise<void> => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> = mountComponent();
      // Find first delete icon and click it
      const deleteIcon: DOMWrapper<Element> = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
      await deleteIcon.trigger('click');
      await nextTick();

      // Find and click the confirm delete button
      const confirmBtn: HTMLElement | null = document.querySelector('[data-testid="service-provider-delete-button"]');
      expect(confirmBtn).toBeTruthy();

      // Spy on the store method
      const deleteSpy: Mock<(id: string) => Promise<void>> = vi
        .spyOn(serviceProviderStore, 'deleteServiceProvider')
        .mockResolvedValue();
      // Click confirm
      if (confirmBtn) {
        confirmBtn.click();
        await nextTick();
        expect(deleteSpy).toHaveBeenCalled();
      }
      deleteSpy.mockRestore();
    });

    describe('onCloseDeleteDialog', () => {
      it('removes provider and reloads list if successful', async () => {
        const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> = mountComponent();
        const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
        schuleAutocomplete?.vm.$emit('update:selectedSchulen', 'some-id');

        const remainingProvider: ManageableServiceProviderListEntry =
          serviceProviderStore.manageableServiceProvidersForOrganisation[1]!;

        const reloadSpy: Mock<ServiceProviderStore['getManageableServiceProvidersForOrganisation']> = vi
          .spyOn(serviceProviderStore, 'getManageableServiceProvidersForOrganisation')
          .mockResolvedValue();

        const deleteIcon: DOMWrapper<Element> = wrapper.find(
          '[data-testid="open-service-provider-delete-dialog-icon"]',
        );
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

        expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toEqual([
          expect.objectContaining(remainingProvider),
        ]);
        expect(reloadSpy).toHaveBeenCalled();
        reloadSpy.mockRestore();
      });
    });

    it('renders SpshAlert when errorCode is set', async () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> = mountComponent();
      serviceProviderStore.errorCode = 'UNSPECIFIED_ERROR';
      await nextTick();
      const alert: DOMWrapper<Element> = wrapper.find(
        '[data-testid="service-provider-management-by-schule-error-alert"]',
      );
      expect(alert.exists()).toBe(true);
    });

    it('clears error and reloads data when alert button is clicked', async () => {
      const wrapper: VueWrapper<InstanceType<typeof ServiceProviderManagementBySchuleView>> = mountComponent();
      const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
      schuleAutocomplete?.vm.$emit('update:selectedSchulen', 'some-id');

      serviceProviderStore.errorCode = 'UNSPECIFIED_ERROR';
      await nextTick();
      const reloadSpy: Mock<ServiceProviderStore['getManageableServiceProvidersForOrganisation']> = vi
        .spyOn(serviceProviderStore, 'getManageableServiceProvidersForOrganisation')
        .mockResolvedValue();
      const btn: DOMWrapper<Element> = wrapper.find(
        '[data-testid="service-provider-management-by-schule-error-alert"] button',
      );
      expect(btn.exists()).toBe(true);
      await btn.trigger('click');
      await nextTick();
      expect(serviceProviderStore.errorCode).toBe('');
      expect(reloadSpy).toHaveBeenCalled();
      reloadSpy.mockRestore();
    });
  });
});
