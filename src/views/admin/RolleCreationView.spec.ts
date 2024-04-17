import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import { type RolleStore, useRolleStore } from '@/stores/RolleStore';
import { type OrganisationStore, useOrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();
const organisationStore: OrganisationStore = useOrganisationStore();

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
      plugins: [router],
    },
  });
});

afterEach(() => {
  wrapper?.unmount();
});

describe('RolleCreationView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('[data-testid="administrationsebene-select"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it renders an error', async () => {
    rolleStore.errorCode = 'ERROR_ERROR';
    await nextTick();
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it closes the view and navigates back to rolle table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it renders the success template', async () => {
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
    await nextTick();
    expect(wrapper?.find('[data-testid="rolle-success-text"]').isVisible()).toBe(true);
  });

  test.skip('it fills the rolle creation form', async () => {
    organisationStore.allOrganisationen = [
      {
        id: '1',
        name: 'Albert-Emil-Hansebrot-Gymnasium',
        kennung: '9356494',
        namensergaenzung: 'Schule',
        kuerzel: 'aehg',
        typ: 'SCHULE',
      },
      {
        id: '2',
        name: 'Einstein-Grundschule',
        kennung: '9356495',
        namensergaenzung: 'des Alberts',
        kuerzel: 'EGS',
        typ: 'SCHULE',
      },
    ];
    await nextTick();
    wrapper?.find('[data-testid="administrationsebene-select"]').trigger('click');
    await nextTick();
  });
});
