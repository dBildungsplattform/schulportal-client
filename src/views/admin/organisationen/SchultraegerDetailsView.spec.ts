import { expect, test, type Mock, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
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
import SchultraegerDetailsView from './SchultraegerDetailsView.vue';
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

type FormFields = {
  schultraegerName: string;
};

type FormSelectors = {
  schultraegerNameInput: VueWrapper;
};

async function fillForm(args: Partial<FormFields>): Promise<Partial<FormSelectors>> {
  const { schultraegerName }: Partial<FormFields> = args;
  const selectors: Partial<FormSelectors> = {};

  const schultraegerNameInput: VueWrapper | undefined = wrapper
    ?.findComponent({ ref: 'schultraeger-edit-form' })
    .findComponent({ ref: 'schultraegername-input' });
  expect(schultraegerNameInput?.exists()).toBe(true);

  await schultraegerNameInput?.setValue(schultraegerName);
  await nextTick();
  selectors.schultraegerNameInput = schultraegerNameInput;

  return selectors;
}

function mountComponent(): VueWrapper {
  return mount(SchultraegerDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchultraegerDetailsView,
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
      name: 'Öffentliches Land',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
    {
      id: '3',
      name: 'Ersatz Land',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
  ];

  organisationStore.currentOrganisation = {
    id: '4',
    name: 'Öffentlicher Träger',
    namensergaenzung: 'Ergänzung',
    kennung: null,
    kuerzel: '',
    typ: OrganisationsTyp.Traeger,
    zugehoerigZu: '2',
    administriertVon: '2',
  };

  organisationStore.schulenWithoutTraeger = [
    {
      id: '10',
      name: 'Öffentliche Schule A',
      namensergaenzung: 'Ergänzung',
      kennung: '123456',
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '2',
      administriertVon: '2',
    },
    {
      id: '11',
      name: 'Öffentliche Schule B',
      namensergaenzung: 'Ergänzung',
      kennung: '465456',
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '2',
      administriertVon: '2',
    },
    {
      id: '12',
      name: 'Ersatzschule B',
      namensergaenzung: 'Ergänzung',
      kennung: '12345678',
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '3',
      administriertVon: '3',
    },
  ];

  organisationStore.schulenFromTraeger = [
    {
      id: '9',
      name: 'Zugeordnete Schule A',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '4',
      administriertVon: '4',
    },
    {
      id: '13',
      name: 'Zugeordnete Schule B',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '4',
      administriertVon: '4',
    },
  ];

  organisationStore.errorCode = '';
  organisationStore.updatedOrganisation = null;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push({ name: 'schultraeger-details', params: { id: '2' } });
  await router.isReady();

  wrapper = mountComponent();
});

afterEach(() => {
  vi.restoreAllMocks();
  wrapper?.unmount();
});

describe('SchultraegerDetailsView', () => {
  test('it renders all child components', async () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SchultraegerForm' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'RelationshipAssign' })).toBeTruthy();

    organisationStore.updatedOrganisation = {
      id: '2',
      name: 'Öffentlicher Träger',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    };
    await nextTick();

    expect(wrapper?.getComponent({ name: 'SchultraegerSuccessTemplate' })).toBeTruthy();

    organisationStore.updatedOrganisation = null;
    await nextTick();
  });

  test('it navigates back to Schultraeger management', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
    expect(wrapper?.findComponent({ ref: 'result-table' }).exists());
  });

  test('it closes the alert', async () => {
    organisationStore.errorCode = 'MOCK_ERROR';
    await nextTick();

    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });

  describe('navigation interception', () => {
    afterEach(() => {
      vi.unmock('vue-router');
    });

    test('it triggers if form is dirty', async () => {
      const expectedCallsToNext: number = 0;
      vi.mock('vue-router', async (importOriginal: () => Promise<Module>) => {
        const mod: Module = await importOriginal();
        return {
          ...mod,
          onBeforeRouteLeave: vi.fn((actualCallback: OnBeforeRouteLeaveCallback) => {
            storedBeforeRouteLeaveCallback = actualCallback;
          }),
        };
      });

      wrapper = mountComponent();
      await fillForm({
        schultraegerName: 'Traeger 1',
      });
      await nextTick();

      const spy: Mock = vi.fn();
      storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
      expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
      await nextTick();

      const confirmButton: Element | null = document.querySelector('[data-testid="confirm-unsaved-changes-button"]');
      expect(confirmButton).not.toBeNull();
      confirmButton!.dispatchEvent(new Event('click'));
      expect(spy).toHaveBeenCalledOnce();
    });

    test('it does not trigger if form is not dirty', async () => {
      const expectedCallsToNext: number = 1;
      vi.mock('vue-router', async (importOriginal: () => Promise<Module>) => {
        const mod: Module = await importOriginal();
        return {
          ...mod,
          onBeforeRouteLeave: vi.fn((actualCallback: OnBeforeRouteLeaveCallback) => {
            storedBeforeRouteLeaveCallback = actualCallback;
          }),
        };
      });
      wrapper = mountComponent();
      const spy: Mock = vi.fn();
      storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);
      expect(spy).toHaveBeenCalledTimes(expectedCallsToNext);
    });
  });

  describe.each([[true], [false]])('when form is dirty:%s', async (isFormDirty: boolean) => {
    beforeEach(async () => {
      await fillForm({
        schultraegerName: 'Traeger 1',
      });
      await nextTick();
    });

    test('it handles unloading', async () => {
      const event: Event = new Event('beforeunload');
      const spy: MockInstance = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      if (isFormDirty) expect(spy).toHaveBeenCalled();
      else expect(spy).not.toHaveBeenCalledOnce();
    });
  });
});
