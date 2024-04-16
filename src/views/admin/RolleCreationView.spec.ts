import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import { RolleStore, useRolleStore } from '@/stores/RolleStore'

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();

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

  router.push('/');
  await router.isReady();

  wrapper = mount(RolleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleCreationView,
      },
      plugins: [
        createTestingPinia({
          initialState: {
            rolleStore: {
              createdRolle: null,
              allRollen: [
                {
                  id: '1',
                  administeredBySchulstrukturknoten: '1',
                  merkmale: new Set(),
                  name: 'Rolle 1',
                  rollenart: 'SYSADMIN',
                },
                {
                  id: '2',
                  administeredBySchulstrukturknoten: '2',
                  merkmale: new Set(),
                  name: 'Rolle 2',
                  rollenart: 'LEHR',
                },
              ],
              errorCode: '',
              loading: false,
            },
          }
        }),
      router
    ],
    },
  });
});

afterEach(() => {
  wrapper?.unmount()
})

describe('RolleCreationView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('[data-testid="administrationsebene-select"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy()
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy()
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy()
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy()
  });

  test('it navigates back to role table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it renders the success template', () => {
    rolleStore.createdRolle = {
      id: '3',
      createdAt: '2022-02-26T16:37:48.244Z',
      updatedAt: '2022-02-26T16:37:48.244Z',
      administeredBySchulstrukturknoten: '3',
      merkmale: new Set(),
      name: 'Rolle 3',
      rollenart: 'LERN',
      systemrechte: new Set(),
    };
    rolleStore.errorCode = '';
    expect(wrapper?.find('[data-testid="rolle-success-text"]').isVisible()).toBe(true);
  });
});
