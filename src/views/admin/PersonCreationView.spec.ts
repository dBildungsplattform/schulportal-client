import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import { nextTick } from 'vue';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let router: Router;
beforeEach(async () => {
  mockadapter.reset();
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: PersonCreationView },
      { path: '/another-route', component: { template: '<div>Another Route</div>' } },
    ],
  });

  wrapper = mount(PersonCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
    },
  });
  router.push('/');
  await router.isReady();
});

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'PersonenkontextCreate' })).toBeTruthy();
  });

  test('It navigates to another route', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );

    await router.push('/another-route');
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
