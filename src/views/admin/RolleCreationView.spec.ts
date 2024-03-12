import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper | null = null;
let router: Router;

beforeEach(async () => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(RolleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleCreationView,
      },
      plugins: [router],
    },
  });
});

describe('RolleCreationView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('[data-testid="administrationsebene-select"]').isVisible()).toBe(true);
  });

  test('it navigates back to role table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });
});
