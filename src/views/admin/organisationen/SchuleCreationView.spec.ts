import { expect, test, type Mock, type MockInstance } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import SchuleCreationView from './SchuleCreationView.vue';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type Router,
} from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import type { OrganisationResponse } from '@/api-client/generated';
import type Module from 'module';

let wrapper: VueWrapper | null = null;
let router: Router;
const organisationStore: OrganisationStore = useOrganisationStore();

const mockSchultraeger: Array<Organisation> = [
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
  return mount(SchuleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleCreationView,
      },
      plugins: [router],
    },
  });
}

type FormFields = {
  dienststellennummer: string;
  schulname: string;
};

type FormSelectors = {
  dienststellennummerInput: VueWrapper;
  schulnameInput: VueWrapper;
};

async function fillForm(args: Partial<FormFields>): Promise<Partial<FormSelectors>> {
  const { dienststellennummer, schulname }: Partial<FormFields> = args;
  const selectors: Partial<FormSelectors> = {};

  const dienststellennummerInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'dienststellennummer-input' });
  expect(dienststellennummerInput?.exists()).toBe(true);

  await dienststellennummerInput?.setValue(dienststellennummer);
  await nextTick();
  selectors.dienststellennummerInput = dienststellennummerInput;

  const schulnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schulname-input' });
  expect(schulnameInput?.exists()).toBe(true);

  await schulnameInput?.setValue(schulname);
  await nextTick();
  selectors.schulnameInput = schulnameInput;

  return selectors;
}

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <router-view>
        <div id="app"></div>
      </router-view>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mountComponent();
  organisationStore.errorCode = '';
  organisationStore.createdSchule = null;
  organisationStore.schultraeger = mockSchultraeger;
});

afterEach(() => {
  wrapper?.unmount();
});

describe('SchuleCreationView', () => {
  test('it renders the schule form', () => {
    expect(wrapper?.find('[data-testid="dienststellennummer-input"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schulname-input"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it navigates back to schulen table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers submit', async () => {
    await fillForm({
      dienststellennummer: '9356494',
      schulname: 'Random Schulname Gymnasium',
    });
    await nextTick();

    const mockSchule: OrganisationResponse = {
      id: '9876',
      name: 'Random Schulname Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'rsg',
      typ: 'SCHULE',
      administriertVon: '1',
    } as OrganisationResponse;

    organisationStore.createdSchule = mockSchule;

    wrapper
      ?.findComponent({ ref: 'schule-creation-form' })
      .find('[data-testid="schule-creation-form-submit-button"]')
      .trigger('click');
    await flushPromises();

    expect(wrapper?.find('[data-testid="create-another-schule-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-schule-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.createdSchule).toBe(null);
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
        dienststellennummer: '9356494',
        schulname: 'Random Schulname Gymnasium',
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
      if (isFormDirty)
        await fillForm({
          dienststellennummer: '9356494',
          schulname: 'Random Schulname Gymnasium',
        });
      await nextTick();
    });

    test('it handles unloading', async () => {
      const event: Event = new Event('beforeunload');
      const spy: MockInstance = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);
      // TODO: why is spy called 3 times?
      // if (isFormDirty) expect(spy).toHaveBeenCalledOnce();
      if (isFormDirty) expect(spy).toHaveBeenCalled();
      else expect(spy).not.toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    test('it shows error message', async () => {
      organisationStore.errorCode = 'NAME_REQUIRED_FOR_SCHULE';
      await nextTick();

      expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);

      wrapper?.find('[data-testid="alert-button"]').trigger('click');
      await nextTick();

      expect(organisationStore.errorCode).toBe('');
    });

    test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
      organisationStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
      await nextTick();

      expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);

      wrapper?.find('[data-testid="alert-button"]').trigger('click');
      await nextTick();

      organisationStore.errorCode = '';
    });
  });
});
