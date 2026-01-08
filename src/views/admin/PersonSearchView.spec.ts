import routes from '@/router/routes';
import { usePersonStore, type PersonLandesbediensteterSearchResponse, type PersonStore } from '@/stores/PersonStore';
import { DOMWrapper, VueWrapper, flushPromises, mount } from '@vue/test-utils';
import type Module from 'module';
import { DoFactory } from 'test/DoFactory';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type Router,
} from 'vue-router';
import PersonSearchView from './PersonSearchView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
let personStore: PersonStore;

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

function mountComponent(): VueWrapper<InstanceType<typeof PersonSearchView>> {
  return mount(PersonSearchView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonSearchView: PersonSearchView as Component,
      },
      plugins: [router],
    },
  });
}

describe('PersonSearchView', () => {
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

    // Mock addEventListener and removeEventListener for beforeunload
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    });

    document.body.innerHTML = `
      <div>
          <router-view>
              <div id="app"></div>
           </router-view>
      </div>
    `;

    personStore = usePersonStore();
    personStore.allLandesbedienstetePersonen = [];
    personStore.errorCode = '';
    personStore.loading = false;

    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    router.push({ name: 'search-person-limited' });
    await router.isReady();

    wrapper = mountComponent();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    wrapper?.unmount();
    personStore.$reset();
  });

  test('it renders the person search form', () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').isVisible()).toBe(true);
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
  });

  test('it shows KoPers input when KoPers radio is selected', async () => {
    const kopersRadio: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-radio-button"]');
    if (kopersRadio && kopersRadio.element instanceof HTMLInputElement) {
      kopersRadio.element.checked = true;
      await kopersRadio.trigger('change');
    }
    await nextTick();

    expect(wrapper?.find('[data-testid="kopers-input"]').isVisible()).toBe(true);
  });

  test('it shows email input when email radio is selected', async () => {
    const emailRadioButton: HTMLElement = document.querySelector(
      '[data-testid="email-radio-button"] input[type="radio"]',
    ) as HTMLElement;

    expect(emailRadioButton).not.toBeNull();
    emailRadioButton.click();
    emailRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    expect(wrapper?.find('[data-testid="email-input"]').isVisible()).toBe(true);
  });

  test('it shows username input when username radio is selected', async () => {
    const usernameRadioButton: HTMLElement = document.querySelector(
      '[data-testid="username-radio-button"] input[type="radio"]',
    ) as HTMLElement;

    expect(usernameRadioButton).not.toBeNull();
    usernameRadioButton.click();
    usernameRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    expect(wrapper?.find('[data-testid="username-input"]').isVisible()).toBe(true);
  });

  test('it shows name inputs when name radio is selected', async () => {
    const nameRadioButton: HTMLElement = document.querySelector(
      '[data-testid="name-radio-button"] input[type="radio"]',
    ) as HTMLElement;

    expect(nameRadioButton).not.toBeNull();
    nameRadioButton.click();
    nameRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    expect(wrapper?.find('[data-testid="vorname-input"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="nachname-input"]').isVisible()).toBe(true);
  });

  test('it clears other fields when switching search types', async () => {
    // Fill KoPers field
    const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
    await kopersInput?.setValue('12345');

    // Switch to email via data-testid
    const emailRadioButton: HTMLElement = document.querySelector(
      '[data-testid="email-radio-button"] input[type="radio"]',
    ) as HTMLElement;

    expect(emailRadioButton).not.toBeNull();
    emailRadioButton.click();
    emailRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    // KoPers field should be removed
    expect(wrapper?.find('[data-testid="kopers-input"]').exists()).toBe(false);
  });

  test('it performs KoPers search successfully', async () => {
    const mockPerson: PersonLandesbediensteterSearchResponse = DoFactory.getPersonLandesbediensteterSearchResponse();

    personStore.allLandesbedienstetePersonen = [mockPerson];
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue(undefined);

    // Fill KoPers field
    const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
    await kopersInput?.setValue(mockPerson.personalnummer);

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        personalnummer: mockPerson.personalnummer,
      });
    });
  });

  test('it performs email search successfully', async () => {
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue(undefined);

    const emailRadioButton: HTMLElement = document.querySelector(
      '[data-testid="email-radio-button"] input[type="radio"]',
    ) as HTMLElement;
    expect(emailRadioButton).not.toBeNull();
    emailRadioButton.click();
    emailRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    const emailInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="email-input"] input');
    await emailInput?.setValue('test@example.com');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        primaryEmailAddress: 'test@example.com',
      });
    });
  });

  test('it performs username search successfully', async () => {
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue(undefined);

    const usernameRadioButton: HTMLElement = document.querySelector(
      '[data-testid="username-radio-button"] input[type="radio"]',
    ) as HTMLElement;
    expect(usernameRadioButton).not.toBeNull();
    usernameRadioButton.click();
    usernameRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    const usernameInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="username-input"] input');
    await usernameInput?.setValue('testuser');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        username: 'testuser',
      });
    });
  });

  test('it performs name search successfully', async () => {
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue(undefined);

    const nameRadioButton: HTMLElement = document.querySelector(
      '[data-testid="name-radio-button"] input[type="radio"]',
    ) as HTMLElement;
    expect(nameRadioButton).not.toBeNull();
    nameRadioButton.click();
    nameRadioButton.dispatchEvent(new Event('click'));
    await nextTick();

    const vornameInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="vorname-input"] input');
    const nachnameInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="nachname-input"] input');

    await vornameInput?.setValue('John');
    await nachnameInput?.setValue('Doe');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        vorname: 'John',
        nachname: 'Doe',
      });
    });
  });

  describe('errors when submitting', () => {
    beforeEach(async () => {
      // Fill KoPers field
      const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
      await kopersInput?.setValue('1234');
    });

    test.each([['LANDESBEDIENSTETER_SEARCH_NO_PERSON_FOUND'], ['LANDESBEDIENSTETER_SEARCH_MULTIPLE_PERSONS_FOUND']])(
      '%s',
      async (errorCode: string) => {
        personStore.getLandesbedienstetePerson = vi.fn(() => {
          personStore.errorCode = errorCode;
          return Promise.resolve();
        });
        await wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');
        await vi.waitUntil(() => {
          return document.body.querySelector('[data-testid="person-search-error-dialog"]') != null;
        });
        if (errorCode === 'LANDESBEDIENSTETER_SEARCH_NO_PERSON_FOUND') {
          expect(document.body.querySelector('[data-testid="no-person-found-text"]')?.textContent).toContain(
            'kein Treffer',
          );
        } else {
          expect(document.body.querySelector('[data-testid="no-person-found-text"]')?.textContent).toContain(
            'mehr als ein Treffer',
          );
        }
      },
    );

    test('other error', async () => {
      personStore.getLandesbedienstetePerson = vi.fn(() => {
        personStore.errorCode = 'UNSPECIFIED_ERROR';
        return Promise.resolve();
      });
      await wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');
      await vi.waitUntil(() => {
        return document.body.querySelector('[data-testid="spsh-alert"]') != null;
      });
      expect(document.body.querySelector('[data-testid="person-search-error-dialog"]')).toBeNull();
    });
  });

  test('it displays person data when search is successful', async () => {
    const mockPerson: PersonLandesbediensteterSearchResponse = DoFactory.getPersonLandesbediensteterSearchResponse();

    personStore.allLandesbedienstetePersonen = [mockPerson];
    await nextTick();

    // Should display personal data card
    expect(wrapper?.find('[data-testid="layout-card-headline-personal-data"]').exists()).toBe(true);
    expect(wrapper?.text()).toContain(mockPerson.vorname);
    expect(wrapper?.text()).toContain(mockPerson.familienname);
    expect(wrapper?.text()).toContain(mockPerson.username);
    expect(wrapper?.text()).toContain(mockPerson.personalnummer);
    expect(wrapper?.text()).toContain(mockPerson.primaryEmailAddress);
  });

  test('it displays organization data when person has contexts', async () => {
    const mockPerson: PersonLandesbediensteterSearchResponse = DoFactory.getPersonLandesbediensteterSearchResponse();
    mockPerson.personenkontexte.push(
      DoFactory.getPersonLandesbediensteterSearchPersonenkontextResponse(DoFactory.getRolle(), DoFactory.getSchule()),
    );

    personStore.allLandesbedienstetePersonen = [mockPerson];
    await nextTick();

    // Should display organization cards
    expect(wrapper?.find('[data-testid="zuordnung-card-1"]').exists()).toBe(true);
    expect(wrapper?.find('[data-testid="zuordnung-card-2"]').exists()).toBe(true);
    for (const kontext of mockPerson.personenkontexte) {
      expect(wrapper?.text()).toContain(kontext.organisationName);
      expect(wrapper?.text()).toContain(kontext.rolleName);
      expect(wrapper?.text()).toContain(kontext.organisationDstNr);
    }
  });

  test('it shows error dialog when no person is found', async () => {
    personStore.allLandesbedienstetePersonen = [];
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue({
      errorCode: 'LANDESBEDIENSTETER_SEARCH_NO_PERSON_FOUND',
    });

    // Fill form and submit
    const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
    await kopersInput?.setValue('99999');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    // wait for the store to be called
    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        personalnummer: '99999',
      });
    });

    // wait for the error dialog to be shown
    await vi.waitUntil(() => document.body.querySelector('[data-testid="cancel-person-search-error-button"]') != null);

    // Should show error dialog
    expect(document.body.querySelector('[data-testid="person-search-error-dialog"]')).not.toBeNull();
  });

  test('it shows error dialog when multiple persons are found', async () => {
    personStore.allLandesbedienstetePersonen = [];
    personStore.getLandesbedienstetePerson = vi.fn().mockResolvedValue({
      errorCode: 'LANDESBEDIENSTETER_SEARCH_MULTIPLE_PERSONS_FOUND',
    });

    // Fill form and submit
    const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
    await kopersInput?.setValue('12345');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        personalnummer: '12345',
      });
    });

    await vi.waitUntil(() => document.body.querySelector('[data-testid="cancel-person-search-error-button"]') != null);

    // Should show error dialog
    expect(document.body.querySelector('[data-testid="person-search-error-dialog"]')).not.toBeNull();
  });

  test('it closes error dialog when cancel button is clicked', async () => {
    personStore.allLandesbedienstetePersonen = [];

    // Fill form and submit
    const kopersInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="kopers-input"] input');
    await kopersInput?.setValue('99999');

    wrapper?.find('[data-testid="person-search-form-submit-button"]').trigger('click');

    // wait for the store to be called
    await vi.waitFor(() => {
      expect(personStore.getLandesbedienstetePerson).toHaveBeenCalledWith({
        personalnummer: '99999',
      });
    });

    // wait for the error dialog to be shown
    await vi.waitUntil(() => document.body.querySelector('[data-testid="cancel-person-search-error-button"]') != null);

    // Should show error dialog
    expect(document.body.querySelector('[data-testid="person-search-error-dialog"]')).not.toBeNull();

    const cancelButton: Element | null = document.body.querySelector(
      '[data-testid="cancel-person-search-error-button"]',
    );
    if (cancelButton) {
      cancelButton.dispatchEvent(new Event('click'));
    }
    await vi.waitUntil(() => document.body.querySelector('[data-testid="cancel-person-search-error-button"]') === null);

    const dialog: Element | null = document.body.querySelector('[data-testid="person-search-error-dialog"]');
    expect(dialog?.classList.contains('v-dialog--active')).toBe(false);
  });

  test('it navigates back to Benutzerliste when the layout card is closed', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it navigates to PersonCreationView when the button for adding the landesbediensteter is clicked', async () => {
    const mockLandesbedienstetePersonen: PersonLandesbediensteterSearchResponse[] = [
      DoFactory.getPersonLandesbediensteterSearchResponse(),
    ];
    personStore.allLandesbedienstetePersonen = mockLandesbedienstetePersonen;
    await nextTick();
    const push: MockInstance = vi.spyOn(router, 'push');

    await wrapper?.find('[data-testid="add-state-employee-button"]').trigger('click');

    expect(push).toHaveBeenCalledTimes(1);
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

      // Remount the component
      wrapper = mountComponent();
      await nextTick();

      // Fill the form to make it dirty
      const kopersInput: DOMWrapper<Element> = wrapper.find('[data-testid="kopers-input"] input');
      await kopersInput.setValue('12345');
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

    test('allows navigation when form is clean', async () => {
      // Mock onBeforeRouteLeave
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
      await nextTick();

      // Don't fill any form fields
      const spy: Mock = vi.fn();
      storedBeforeRouteLeaveCallback({} as RouteLocationNormalized, {} as RouteLocationNormalized, spy);

      // Should call next immediately since form is clean
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  test('it sets up and removes beforeunload event listener', () => {
    const addEventListener: MockInstance = vi.spyOn(window, 'addEventListener');
    const removeEventListener: MockInstance = vi.spyOn(window, 'removeEventListener');

    wrapper = mountComponent();

    // Should add event listener on mount
    expect(addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    wrapper.unmount();

    // Should remove event listener on unmount
    expect(removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  test('it navigates back correctly for step up error', async () => {
    personStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    const routerPush: MockInstance = vi.spyOn(router, 'push').mockResolvedValue();
    const routerGo: MockInstance = vi.spyOn(router, 'go');

    await nextTick();

    // Click back button (assuming it exists in SpshAlert)
    const backButton: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid$="alert-button"]');
    await backButton?.trigger('click');
    await flushPromises();

    expect(routerPush).toHaveBeenCalledWith({ name: 'search-person-limited' });
    expect(routerGo).toHaveBeenCalledWith(0);
  });
});
