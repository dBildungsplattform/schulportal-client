import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { VApp } from 'vuetify/components';
import MenuBar from './MenuBar.vue';
import { useAuthStore, type AuthStore } from '@/stores/AuthStore';

let wrapper: VueWrapper | null = null;
let router: Router;
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

authStore.hasPersonenverwaltungPermission = true;
authStore.hasImportPermission = true;
authStore.hasKlassenverwaltungPermission = true;
authStore.hasRollenverwaltungPermission = true;
authStore.hasSchulverwaltungPermission = true;
authStore.hasSchultraegerverwaltungPermission = true;

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

  router.push('/admin/personen');
  await router.isReady();

  wrapper = mount(VApp, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        MenuBar,
      },
      plugins: [router],
    },
    slots: {
      default: h(MenuBar),
    },
  });
});

describe('MenuBar', () => {
  test('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
  });

  test('it renders all available menu links', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="back-to-start-link"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="person-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-management-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-creation-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-import-menu-item"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="klasse-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="klassen-management-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="klasse-creation-menu-item"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="rolle-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-management-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-creation-menu-item"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="schule-management-title"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-management-menu-item"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-creation-menu-item"]').isVisible()).toBe(true);

    expect(wrapper?.find('[data-testid="schultraeger-management-title"]').isVisible()).toBe(true);
  });

  test('it handles menu item click', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');

    await wrapper?.find('[data-testid="person-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="person-import-menu-item"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="klassen-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="rolle-management-menu-item"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="schule-management-menu-item"]').trigger('click');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(5);
  });

  // TODO: can we rely on vuetify's mobile breakpoint in tests?
  // the only useful test would be for the different visuals on mobile/desktop
});
