import routes from '@/router/routes';
import { RollenSystemRecht } from '@/stores/RolleStore';
import {
  ServiceProviderKategorie,
  useServiceProviderStore,
  type ManageableServiceProviderDetail,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import ServiceProviderEditView from '@/views/admin/service-provider/ServiceProviderEditView.vue';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import type { Mock, MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';

let wrapper: VueWrapper | null = null;
let router: ReturnType<typeof createRouter>;
const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

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
      ): void => {
        // intentionally left blank for test hoisting
      },
    };
  },
);

async function mountComponent(): Promise<ReturnType<typeof mount<typeof ServiceProviderEditView>>> {
  await vi.dynamicImportSettled();
  return mount(ServiceProviderEditView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ServiceProviderEditView: ServiceProviderEditView as Component,
      },
      plugins: [router],
    },
  });
}

type FormFields = {
  organisation: string;
  name: string;
  url: string;
  kategorie: ServiceProviderKategorie;
  nachtraeglichZuweisbar: boolean;
  verfuegbarFuerRollenerweiterung: boolean;
  requires2fa: boolean;
};

type FormSelectors = {
  orgSelect: VueWrapper;
  nameInput: DOMWrapper<Element>;
  urlInput: DOMWrapper<Element>;
  kategorieSelect: DOMWrapper<Element>;
  nachtraeglichZuweisbarSelect: DOMWrapper<Element>;
  verfuegbarFuerRollenerweiterungSelect: DOMWrapper<Element>;
  requires2faSelect: DOMWrapper<Element>;
};

async function fillForm(args: Partial<FormFields>): Promise<Partial<FormSelectors>> {
  const {
    organisation,
    name,
    url,
    kategorie,
    nachtraeglichZuweisbar,
    verfuegbarFuerRollenerweiterung,
    requires2fa,
  }: Partial<FormFields> = args;
  const selectors: Partial<FormSelectors> = {};

  if (organisation) {
    const orgSelect: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
    await orgSelect?.setValue(organisation);
    const schulenFilterComponent: VueWrapper | undefined = wrapper?.findComponent({ name: 'SchulenFilter' });
    (schulenFilterComponent?.vm as unknown as { $emit: (event: string, ...args: unknown[]) => void }).$emit(
      'update:selectedSchulen',
      organisation,
    );
    await nextTick();
    selectors.orgSelect = orgSelect;
  }

  if (name) {
    const nameInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="name-input"]');
    expect(nameInput?.exists()).toBe(true);
    await nameInput?.find('input').setValue(name);
    await nextTick();
    selectors.nameInput = nameInput;
  }

  if (url) {
    const urlInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="url-input"]');
    expect(urlInput?.exists()).toBe(true);
    await urlInput?.find('input').setValue(url);
    await nextTick();
    selectors.urlInput = urlInput;
  }

  if (kategorie) {
    const kategorieSelect: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kategorie-select"]');
    kategorieSelect?.setValue(kategorie);
    await nextTick();
    selectors.kategorieSelect = kategorieSelect;
  }

  if (nachtraeglichZuweisbar !== undefined) {
    const nachtraeglichZuweisbarSelect: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="nachtraeglich-zuweisbar-select"]',
    );
    nachtraeglichZuweisbarSelect?.setValue(nachtraeglichZuweisbar);
    await nextTick();
    selectors.nachtraeglichZuweisbarSelect = nachtraeglichZuweisbarSelect;
  }

  if (verfuegbarFuerRollenerweiterung !== undefined) {
    const verfuegbarFuerRollenerweiterungSelect: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="verfuegbar-fuer-rollenerweiterung-select"]',
    );
    verfuegbarFuerRollenerweiterungSelect?.setValue(verfuegbarFuerRollenerweiterung);
    await nextTick();
    selectors.verfuegbarFuerRollenerweiterungSelect = verfuegbarFuerRollenerweiterungSelect;
  }

  if (requires2fa !== undefined) {
    const requires2faSelect: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="requires2fa-select"]');
    requires2faSelect?.setValue(requires2fa);
    await nextTick();
    selectors.requires2faSelect = requires2faSelect;
  }

  return selectors;
}

describe('ServiceProviderEditView', () => {
  beforeEach(async () => {
    await vi.dynamicImportSettled();
    document.body.innerHTML = `
      <div>
        <div id="app"></div>
      </div>
    `;
    router = createRouter({
      history: createWebHistory(),
      routes,
    });
    const testServiceProvider: ManageableServiceProviderDetail = DoFactory.getManageableServiceProviderDetail({
      relevantSystemrechte: [RollenSystemRecht.AngeboteVerwalten],
    });
    serviceProviderStore.currentServiceProvider = testServiceProvider;
    router.push({ name: 'angebot-details', params: { id: testServiceProvider.id } });
    await router.isReady();

    wrapper = await mountComponent();
  });

  afterEach(() => {
    vi.resetAllMocks();
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
    const form: VueWrapper = wrapper!.findComponent({ name: 'ServiceProviderForm' });
    form.vm.$emit('click:submit', validEdit);
    await flushPromises();
    expect(spy).toHaveBeenCalledWith(serviceProviderStore.currentServiceProvider?.id, validEdit);
    spy.mockRestore();
  });

  test('it closes the view and navigates back to service provider table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('calls router.push with correct arguments when dismissing the success dialog', async () => {
    const pushSpy: Mock = vi.spyOn(router, 'push').mockResolvedValue();
    const form: VueWrapper = wrapper!.findComponent({ name: 'ServiceProviderForm' });
    const validEdit: Parameters<typeof serviceProviderStore.updateServiceProvider>[1] = {
      name: 'Neuer Name',
      url: 'https://neue-url.de',
      logo: '',
      kategorie: serviceProviderStore.currentServiceProvider?.kategorie,
      merkmale: serviceProviderStore.currentServiceProvider?.merkmale || [],
      requires2fa: false,
    };
    form.vm.$emit('click:submit', validEdit);
    await flushPromises();

    const closeButton: HTMLElement | null = document.querySelector(
      '[data-testid="close-service-provider-success-dialog-button"]',
    );
    expect(closeButton).not.toBeNull();
    (closeButton as HTMLElement).click();
    await nextTick();
    expect(pushSpy).toHaveBeenCalledWith({
      name: 'angebot-details',
      params: { id: serviceProviderStore.currentServiceProvider?.id },
    });
    pushSpy.mockRestore();
  });

  describe.each([[false], [true]])('when form is dirty:%s', (isFormDirty: boolean) => {
    test('it handles unloading', async () => {
      wrapper = await mountComponent();
      if (isFormDirty) {
        await fillForm({
          organisation: DoFactory.getOrganisation().id,
          name: 'Test Service Provider',
          url: 'https://test.example.com',
        });
        await flushPromises();
      }
      const event: Event = new Event('beforeunload');
      const spy: MockInstance = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);
      if (isFormDirty) {
        expect(spy).toHaveBeenCalledOnce();
      } else {
        expect(spy).not.toHaveBeenCalledOnce();
      }
    });
  });
});

describe('ServiceProviderEditView navigation guard', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <div id="app"></div>
      </div>
    `;
    const testServiceProvider: ManageableServiceProviderDetail = DoFactory.getManageableServiceProviderDetail({
      relevantSystemrechte: [RollenSystemRecht.AngeboteVerwalten],
    });
    serviceProviderStore.currentServiceProvider = testServiceProvider;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('triggers, if form is dirty', async () => {
    const expectedCallsToNext: number = 0;
    vi.mock('vue-router', async (importOriginal: () => Promise<object>) => {
      const mod: object = await importOriginal();
      return {
        ...mod,
        useRoute: (): RouteLocationNormalizedLoadedGeneric => ({
          params: { id: serviceProviderStore.currentServiceProvider?.id ?? '' },
          matched: [],
          name: '',
          fullPath: '',
          hash: '',
          query: {},
          redirectedFrom: undefined,
          meta: {},
          path: '',
        }),
        onBeforeRouteLeave: vi.fn((actualCallback: OnBeforeRouteLeaveCallback) => {
          storedBeforeRouteLeaveCallback = actualCallback;
        }),
      };
    });
    wrapper = await mountComponent();
    await fillForm({
      name: 'Test Service Provider',
      url: 'https://test.example.com',
    });

    const spy: Mock = vi.fn();
    storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
    expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
    await nextTick();

    const confirmButton: Element | null = document.querySelector('[data-testid="confirm-unsaved-changes-button"]');
    expect(confirmButton).not.toBeNull();
    confirmButton!.dispatchEvent(new Event('click'));
    expect(spy).toHaveBeenCalledOnce();
  });

  test('does not trigger, if form is not dirty', async () => {
    const expectedCallsToNext: number = 1;
    vi.mock('vue-router', async (importOriginal: () => Promise<object>) => {
      const mod: object = await importOriginal();
      return {
        ...mod,
        onBeforeRouteLeave: vi.fn((actualCallback: OnBeforeRouteLeaveCallback) => {
          storedBeforeRouteLeaveCallback = actualCallback;
        }),
      };
    });
    wrapper = await mountComponent();
    const spy: Mock = vi.fn();
    storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
    expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
  });
});
