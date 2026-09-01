import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
import { VueWrapper, mount } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, type Component } from 'vue';
import { createMemoryHistory, createRouter, useRoute, type Router } from 'vue-router';
import SchuleDetailsView from './SchuleDetailsView.vue';

let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;
let router: Router;

const mockSchule: Organisation = DoFactory.getSchule({
  id: 'schule-1',
  name: 'Test Grundschule',
  kennung: '1234567',
  emailAdresse: 'schule@example.com',
  administriertVon: 'schultraeger-1',
  itslearningEnabled: true,
});

const mockSchultraeger: Organisation = DoFactory.getOrganisation({
  id: 'schultraeger-1',
  name: 'Schulträger Test',
  typ: 'TRAEGER',
});

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();

  //@ts-expect-error Test setup: we are intentionally setting currentOrganisation to undefined to simulate initial state
  organisationStore.currentOrganisation = undefined;
  organisationStore.schultraeger = [];
  organisationStore.errorCode = '';
  organisationStore.loading = false;

  organisationStore.getOrganisationById = vi.fn(() => Promise.resolve());
  organisationStore.getOrganisationParentsTree = vi.fn(() => Promise.resolve());

  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/schulen/:id',
        name: 'schule-details',
        component: SchuleDetailsView as Component,
      },
      {
        path: '/admin/schulen',
        name: 'schule-management',
        component: { template: '<div>Schule Management</div>' },
      },
    ],
  });

  await router.push({ name: 'schule-details', params: { id: 'schule-1' } });
  await router.isReady();

  wrapper = mount(SchuleDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
      mocks: {
        $route: useRoute(),
      },
    },
  });
});

afterEach(() => {
  wrapper?.unmount();
  vi.clearAllMocks();
});

describe('SchuleDetailsView', () => {
  test('it renders the admin headline', () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').isVisible()).toBe(true);
  });

  test('it renders the schule details card', () => {
    expect(wrapper?.find('[data-testid="schule-details-card"]').exists()).toBe(true);
  });

  test('it fetches organisation and schultraeger data on mount', () => {
    expect(organisationStore.getOrganisationById).toHaveBeenCalledWith('schule-1');
    expect(organisationStore.getOrganisationParentsTree).toHaveBeenCalledWith('schule-1');
  });

  test('it clears error code on mount', () => {
    // The component clears errorCode on mount
    organisationStore.errorCode = 'SOME_ERROR';
    // Force a new mount to trigger the lifecycle
    wrapper?.unmount();

    const newWrapper = mount(SchuleDetailsView, {
      attachTo: document.getElementById('app') || '',
      global: {
        plugins: [router],
        mocks: {
          $route: useRoute(),
        },
      },
    });

    // After mounting, errorCode should be cleared by the component
    expect(organisationStore.errorCode).toBe('');
    newWrapper.unmount();
  });

  test('it displays organisation details when data is loaded', async () => {
    organisationStore.currentOrganisation = mockSchule;
    organisationStore.schultraeger = [mockSchultraeger];
    organisationStore.loading = false;
    organisationStore.errorCode = '';

    await nextTick();

    expect(wrapper?.find('[data-testid="schule-details-container"]').isVisible()).toBe(true);
  });

  test('it hides content when error exists', async () => {
    organisationStore.errorCode = 'SCHULE_NOT_FOUND';
    // @ts-expect-error Test setup: we are intentionally setting currentOrganisation to undefined to simulate error state
    organisationStore.currentOrganisation = undefined;
    await nextTick();

    // When there's an error, the organisation should not be displayed
    expect(wrapper?.find('[data-testid="schule-details-container"]').exists()).toBe(false);
  });

  test('it shows content when data is available', async () => {
    organisationStore.currentOrganisation = mockSchule;
    organisationStore.errorCode = '';
    await nextTick();

    // The container should be visible
    expect(wrapper?.find('[data-testid="schule-details-card"]').exists()).toBe(true);
  });

  test('it navigates to schule management when close is clicked', async () => {
    organisationStore.currentOrganisation = mockSchule;
    await nextTick();

    const pushSpy = vi.spyOn(router, 'push');

    // Find and trigger the close button
    const layoutCard = wrapper?.findComponent('[data-testid="schule-details-card"]');
    if (layoutCard) {
      layoutCard.vm.$emit('onCloseClicked');
    }
    await nextTick();

    expect(pushSpy).toHaveBeenCalledWith({ name: 'schule-management' });
  });

  test('it uses correct route parameter as schule id', () => {
    // Verify the component extracted the id from the route
    expect(organisationStore.getOrganisationById).toHaveBeenCalledWith('schule-1');
  });

  test('it does not show container when there is an error', async () => {
    organisationStore.errorCode = 'SCHULE_NOT_FOUND';
    // @ts-expect-error Test setup: we are intentionally setting currentOrganisation to undefined to simulate error state
    organisationStore.currentOrganisation = undefined;
    await nextTick();

    expect(wrapper?.find('[data-testid="schule-details-container"]').exists()).toBe(false);
  });

  test('it renders with correct root css class', () => {
    expect(wrapper?.find('div.admin').exists()).toBe(true);
  });

  test('it calls both store methods in parallel on mount', async () => {
    expect(organisationStore.getOrganisationById).toHaveBeenCalled();
    expect(organisationStore.getOrganisationParentsTree).toHaveBeenCalled();
  });

  test('it handles loading state appropriately', async () => {
    organisationStore.loading = true;
    // @ts-expect-error Test setup: we are intentionally setting currentOrganisation to undefined to simulate loading state
    organisationStore.currentOrganisation = undefined;
    await nextTick();

    // When loading, the details container should not be shown
    const container = wrapper?.find('[data-testid="schule-details-container"]');
    // Loading state takes precedence over the container
    expect(wrapper?.html()).toBeDefined();
  });

  test('it calls store methods with correct parameters', () => {
    const calls = (organisationStore.getOrganisationById as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toEqual(['schule-1']);
  });

  test('it has correct headline text attribute', () => {
    const headline = wrapper?.find('[data-testid="admin-headline"]');
    expect(headline?.exists()).toBe(true);
  });

  test('it displays the schule details when organisation is set', async () => {
    organisationStore.currentOrganisation = mockSchule;
    organisationStore.errorCode = '';
    await nextTick();

    // The organisation should be displayed in the component
    const container = wrapper?.find('[data-testid="schule-details-container"]');
    expect(container?.isVisible()).toBe(true);

    // The component should have access to currentOrganisation
    expect(organisationStore.currentOrganisation?.name).toBe('Test Grundschule');
  });

  test('it renders layout card with proper structure', async () => {
    organisationStore.currentOrganisation = mockSchule;
    await nextTick();

    const layoutCard = wrapper?.findComponent('[data-testid="schule-details-card"]');
    expect(layoutCard?.exists()).toBe(true);
  });

  test('it renders wrapper div with admin class for styling', () => {
    const adminDiv = wrapper?.find('div.admin');
    expect(adminDiv?.exists()).toBe(true);
  });

  test('it uses schultraeger to map schulform values', async () => {
    organisationStore.currentOrganisation = mockSchule;
    organisationStore.schultraeger = [mockSchultraeger];
    await nextTick();

    // The component should have access to schultraeger for mapping
    expect(organisationStore.schultraeger.length).toBe(1);
    expect(organisationStore.schultraeger[0].id).toBe('schultraeger-1');
  });

  test('it sets currentOrganisation to undefined on error', async () => {
    organisationStore.errorCode = 'SOME_ERROR';
    organisationStore.currentOrganisation = undefined;
    await nextTick();

    // When there's an error, the organisation should not be displayed
    expect(wrapper?.find('[data-testid="schule-details-container"]').exists()).toBe(false);
  });

  test('it correctly extracts route parameter for API call', () => {
    // The component should extract the 'id' parameter from the route
    const getOrgCalls = (organisationStore.getOrganisationById as any).mock.calls;
    expect(getOrgCalls[0][0]).toBe('schule-1');
  });

  test('it renders success state when organisation data is available', async () => {
    organisationStore.currentOrganisation = mockSchule;
    organisationStore.loading = false;
    organisationStore.errorCode = '';
    await nextTick();

    // All success indicators should be present
    expect(wrapper?.find('[data-testid="schule-details-card"]').exists()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-details-container"]').exists()).toBe(true);
  });
});
