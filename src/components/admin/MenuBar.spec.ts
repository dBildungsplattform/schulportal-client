import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import MenuBar from './MenuBar.vue';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
const authStore: AuthStore = useAuthStore();

let wrapper: VueWrapper | null = null;

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
};

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(MenuBar, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        MenuBar,
      },
    },
  });
});

// We are currently skipping these tests, because rendering the navigation drawer fails due to a missing
// vuetify layout that needs to be injected and cannot be provided inside the test environment.
// Providing it manually is hacky, since the needed layout cannot be imported from vuetify.
// Hopefully this will be fixed in an upcoming vuetify release.

describe('MenuBar', () => {
  test.skip('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
  });

  test.skip('it renders rolle and schule management links', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-creation-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-management-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-creation-menu-item"]').isVisible()).toBe(true);
  });

  // TODO: can we rely on vuetify's mobile breakpoint in tests?
  // the only useful test would be for the different visuals on mobile/desktop
});
