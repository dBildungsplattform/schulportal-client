import { expect, test, type Mock, type MockInstance } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type Router,
} from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type { OrganisationResponse } from '@/api-client/generated';
import SchultraegerCreationView from './SchultraegerCreationView.vue';
import type Module from 'module';

let wrapper: VueWrapper | null = null;
let router: Router;
let organisationStore: OrganisationStore;

type OnBeforeRouteLeaveCallback = (
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  _next: NavigationGuardNext,
) => void;
let { storedBeforeRouteLeaveCallback }: { storedBeforeRouteLeaveCallback: OnBeforeRouteLeaveCallback } = vi.hoisted(
  () => {
    return {
      storedBeforeRouteLeaveCallback: (
        _to: RouteLocationNormalized,
        _from: RouteLocationNormalized,
        _next: NavigationGuardNext,
      ): void => {},
    };
  },
);

function mountComponent(): VueWrapper {
  return mount(SchultraegerCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchultraegerCreationView,
      },
      plugins: [router],
    },
  });
}

beforeEach(async () => {
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
      reload: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, 'history', {
    value: {
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    writable: true,
  });
  document.body.innerHTML = `
    <div>
        <router-view>
            <div id="app"></div>
         </router-view>
    </div>
  `;

  organisationStore = useOrganisationStore();
  organisationStore.schultraeger = [
    {
      id: '2',
      name: 'Öffentliche Schulen',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Land,
      administriertVon: '1',
    },
    {
      id: '3',
      name: 'Ersatzschulen Schulen',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Land,
      administriertVon: '1',
    },
  ];
  organisationStore.errorCode = '';

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push({ name: 'create-schultraeger' });
  await router.isReady();

  wrapper = mountComponent();
});

afterEach(() => {
  vi.restoreAllMocks();
  wrapper?.unmount();
});

describe('SchultraegerView', () => {
  test('it renders the Schultraeger form', () => {
    expect(wrapper?.find('[data-testid="schultraegername-input"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it navigates back to schultraeger table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');

    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers submit', async () => {
    const schulnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schultraegername-input' });
    await schulnameInput?.setValue('Random Schultraegername');
    await nextTick();
    const mockSchule: OrganisationResponse = {
      id: '2',
      name: 'Random Schulname Gymnasium',
      kennung: '',
      namensergaenzung: 'Traeger',
      kuerzel: 'rsg',
      typ: OrganisationsTyp.Traeger,
      administriertVon: '1',
    } as OrganisationResponse;

    organisationStore.createdSchultraeger = mockSchule;

    wrapper?.find('[data-testid="schultraeger-creation-form-submit-button"]').trigger('click');
    await flushPromises();

    expect(wrapper?.find('[data-testid="create-another-schultraeger-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-schultraeger-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.createdSchultraeger).toBe(null);
  });

  test('it shows error message', async () => {
    organisationStore.errorCode = 'TRAEGER_IN_TRAEGER';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
    organisationStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });

  describe('navigation interception', () => {
    afterEach(() => {
      vi.unmock('vue-router');
    });

    test('triggers unsaved changes dialog when form is dirty', async () => {
      const expectedCallsToNext: number = 0;
      // Mock onBeforeRouteLeave to capture the callback
      vi.mock('vue-router', async (importOriginal: () => Promise<Module>) => {
        const mod: Module = await importOriginal();
        return {
          ...mod,
          onBeforeRouteLeave: vi.fn((actualCallback: OnBeforeRouteLeaveCallback) => {
            storedBeforeRouteLeaveCallback = actualCallback;
          }),
        };
      });

      // Remount the component to make sure the form is empty at first
      wrapper = mountComponent();
      await nextTick();

      // Fill the form to make it dirty
      const schulnameInput: VueWrapper | undefined = wrapper.findComponent({ ref: 'schultraegername-input' });
      await schulnameInput.setValue('Random Schultraegername');
      await nextTick();

      const spy: Mock = vi.fn();
      storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
      expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
      await nextTick();

      // Simulate user confirming the navigation
      const confirmButton: Element | null = document.querySelector('[data-testid="confirm-unsaved-changes-button"]');
      expect(confirmButton).not.toBeNull();
      confirmButton?.dispatchEvent(new Event('click'));
      await nextTick();

      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
