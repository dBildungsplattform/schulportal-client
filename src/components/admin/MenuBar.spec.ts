import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import { h, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VApp } from 'vuetify/components';
import { useDisplay } from 'vuetify';
import MenuBar from './MenuBar.vue';

let wrapper: VueWrapper | null = null;
const authStore: AuthStore = useAuthStore();

authStore.currentUser = {
  middle_name: null,
  nickname: null,
  profile: null,
  picture: null,
  website: null,
  gender: null,
  birthdate: null,
  zoneinfo: null,
  locale: null,
  phone_number: null,
  updated_at: null,
  personId: null,
  email: 'albert@test.de',
  email_verified: true,
  family_name: 'Test',
  given_name: 'Albert',
  name: 'Albert Test',
  preferred_username: 'albert',
  sub: 'c71be903-d0ec-4207-b653-40c114680b63',
  personenkontexte: [
    {
      organisationsId: '123456',
      rolle: {
        systemrechte: ['ROLLEN_VERWALTEN', 'SCHULEN_VERWALTEN'],
        serviceProviderIds: ['789897798'],
      },
    },
  ],
  password_updated_at: null,
};

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/',
  })),
  useRouter: vi.fn(() => ({
    push: (): void => {},
    go: (): void => {},
  })),
}));
vi.mock('vuetify', () => ({
  useDisplay: vi.fn(() => ({
    mobile: false,
  })),
}));

function mountComponent(): VueWrapper {
  return mount(VApp, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        MenuBar,
      },
      stubs: ['router-link', 'router-view'],
    },
    slots: {
      default: h(MenuBar),
    },
  });
}

function setPermissions(hasPermission: boolean): void {
  authStore.hasPersonenverwaltungPermission = hasPermission;
  authStore.hasImportPermission = hasPermission;
  authStore.hasKlassenverwaltungPermission = hasPermission;
  authStore.hasRollenverwaltungPermission = hasPermission;
  authStore.hasSchulverwaltungPermission = hasPermission;
  authStore.hasSchultraegerverwaltungPermission = hasPermission;
  authStore.hasPersonenAnlegenPermission = hasPermission;
}

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mountComponent();
  setPermissions(true);
});

describe('MenuBar', () => {
  test('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
  });

  test.each([[true], [false]])(
    'it renders available menu links, when permissions are %s',
    async (hasPermission: boolean) => {
      setPermissions(hasPermission);
      await nextTick();
      expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
      expect(wrapper?.find('[data-testid="back-to-start-link"]').isVisible()).toBe(true);

      expect(wrapper?.find('[data-testid="person-management-title"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="person-management-menu-item"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="person-creation-menu-item"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="person-import-menu-item"]').exists()).toBe(hasPermission);

      expect(wrapper?.find('[data-testid="klasse-management-title"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="klassen-management-menu-item"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="klasse-creation-menu-item"]').exists()).toBe(hasPermission);

      expect(wrapper?.find('[data-testid="rolle-management-title"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="rolle-management-menu-item"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="rolle-creation-menu-item"]').exists()).toBe(hasPermission);

      expect(wrapper?.find('[data-testid="schule-management-title"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="schule-management-menu-item"]').exists()).toBe(hasPermission);
      expect(wrapper?.find('[data-testid="schule-creation-menu-item"]').exists()).toBe(hasPermission);

      expect(wrapper?.find('[data-testid="schultraeger-management-title"]').exists()).toBe(hasPermission);
    },
  );

  test('hides elements when permissions are false', async () => {
    // Reset permissions to false
    authStore.hasPersonenAnlegenPermission = false;
    await nextTick();

    expect(wrapper?.find('[data-testid="person-creation-menu-item"]').exists()).toBe(false);
  });

  test('it handles menu item click', async () => {
    const push: MockInstance = vi.fn();
    (useRouter as Mock).mockImplementation(() => {
      return { push };
    });
    wrapper = mountComponent();

    await wrapper.find('[data-testid="person-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-testid="person-import-menu-item"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-testid="klassen-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-testid="rolle-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper.find('[data-testid="schule-management-menu-item"]').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(5);
  });

  test('it refreshes when navigating to current route', async () => {
    const push: MockInstance = vi.fn(() => Promise.resolve());
    const go: MockInstance = vi.fn();
    (useRouter as Mock).mockImplementation(() => {
      return { push, go };
    });
    (useRoute as Mock).mockImplementation(() => {
      return { path: '/admin/personen/import' };
    });
    wrapper = mountComponent();

    await wrapper.find('[data-testid="person-import-menu-item"]').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledOnce();
    expect(go).toHaveBeenCalledOnce();
  });

  describe('on mobile', async () => {
    beforeAll(() => {
      (useDisplay as Mock).mockImplementation(() => {
        return { mobile: { value: true } };
      });
    });
    afterAll(() => {
      (useDisplay as Mock).mockRestore();
    });

    test('it opens and closes', async () => {
      wrapper = mountComponent();
      expect(wrapper.find('[data-testid="open-mobile-menu-button"]').isVisible()).toBeTruthy();
      await wrapper.find('[data-testid="open-mobile-menu-button"]').trigger('click');
      await vi.waitUntil(() => wrapper!.find('[data-testid="close-mobile-menu-button"]').exists());

      await wrapper.find('[data-testid="close-mobile-menu-button"]').trigger('click');
      await vi.waitUntil(() => !wrapper!.find('[data-testid="close-mobile-menu-button"]').exists());
    });

    test('it closes on navigation', async () => {
      wrapper = mountComponent();
      await wrapper.find('[data-testid="person-management-menu-item"]').trigger('click');
      await nextTick();

      await vi.waitUntil(() => !wrapper!.find('[data-testid="close-mobile-menu-button"]').exists());

      expect(wrapper.find('[data-testid="open-mobile-menu-button"]').isVisible()).toBeTruthy();
      expect(wrapper.find('[data-testid="close-mobile-menu-button"]').exists()).toBeFalsy();
    });
  });
});
