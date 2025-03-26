import { expect, test, type Mock, type MockInstance } from 'vitest';
import { DOMWrapper, VueWrapper, flushPromises, mount } from '@vue/test-utils';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type Router,
} from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { MeldungStatus, useMeldungStore, type MeldungStore } from '@/stores/MeldungStore';
import HinweiseManagementView from './HinweiseCreationView.vue';
import type Module from 'module';

let wrapper: VueWrapper | null = null;
let router: Router;
let meldungStore: MeldungStore;

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
  return mount(HinweiseManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        HinweiseManagementView,
      },
      plugins: [router],
    },
  });
}

describe('HinweiseCreationView', () => {
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

    meldungStore = useMeldungStore();
    meldungStore.meldungen = [
      {
        id: '1',
        text: 'Initial Hinweis',
        status: MeldungStatus.NICHT_VEROEFFENTLICHT,
      },
    ];
    meldungStore.errorCode = '';

    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    router.push({ name: 'hinweise-creation' });
    await router.isReady();

    wrapper = mountComponent();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    wrapper?.unmount();
    meldungStore.$reset();
  });

  test('it renders the Hinweise form', () => {
    expect(wrapper?.find('[data-testid="newsbox-text"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
  });

  test('it navigates back to previous page', async () => {
    const goBack: MockInstance = vi.spyOn(window.history, 'go');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(goBack).toHaveBeenCalledWith(-1);
  });

  test('it fills form and triggers submit', async () => {
    wrapper = mountComponent();
    meldungStore.createOrUpdateMeldung = vi.fn().mockResolvedValue(undefined);
    meldungStore.getAllMeldungen = vi.fn().mockResolvedValue(undefined);

    meldungStore.meldungen = [
      {
        id: '1',
        text: 'Initial Hinweis',
        status: MeldungStatus.NICHT_VEROEFFENTLICHT,
      },
    ];
    await flushPromises();

    const meldungTextInput: VueWrapper | undefined = wrapper.findComponent({ ref: 'newsbox-text' });
    await meldungTextInput.setValue('Updated Hinweis');

    const submitButton: DOMWrapper<Element> | undefined = wrapper.find('[data-testid="submit-newsbox"]');
    expect(submitButton).toBeDefined();
    await submitButton.trigger('click');

    await flushPromises();

    expect(meldungStore.createOrUpdateMeldung).toHaveBeenCalled();
  });

  test('it shows error message', async () => {
    meldungStore.errorCode = 'MELDUNG_ERROR';
    await nextTick();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
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
      const meldungTextInput: VueWrapper | undefined = wrapper.findComponent({ ref: 'newsbox-text' });
      await meldungTextInput.setValue('Hinweis');
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
