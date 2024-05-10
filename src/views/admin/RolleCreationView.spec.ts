import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import { type RolleStore, useRolleStore } from '@/stores/RolleStore';
import { type OrganisationStore, useOrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();
const organisationStore: OrganisationStore = useOrganisationStore();

organisationStore.allOrganisationen = [
  {
    id: '1',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
  {
    id: '2',
    name: 'Einstein-Grundschule',
    kennung: '123798465',
    namensergaenzung: 'des Alberts',
    kuerzel: 'EGS',
    typ: 'SCHULE',
    administriertVon: '1',
  },
];

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

  test('it renders the success template and goes back to form', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    rolleStore.createdRolle = {
      id: '3',
      administeredBySchulstrukturknoten: '3',
      merkmale: new Set(),
      name: 'Rolle 3',
      rollenart: 'LERN',
      systemrechte: new Set(),
    };
    rolleStore.errorCode = '';
    await nextTick();
    expect(wrapper?.find('[data-testid="rolle-success-text"]').exists()).toBe(true);
    expect(wrapper?.find('[data-testid="created-rolle-angebote"]').exists()).toBe(true);
    wrapper?.find('[data-testid="back-to-list-button"]').trigger('click');
    await nextTick();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills the rolle creation form', async () => {
    const rollennameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rollenname-input' });
    expect(rollennameInput?.exists()).toBe(false);

    const orgSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue('1');
    await nextTick();

    const rollenartSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue('LERN');
    await nextTick();
    await flushPromises();

    expect(orgSelect?.text()).toEqual('9356494 (Albert-Emil-Hansebrot-Gymnasium)');
    expect(rollenartSelect?.text()).toEqual('Lern');

    // TODO: meaningfully expand this test

    // expect(rollennameInput?.exists()).toBe(true);

    wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    await nextTick();

    // const unsavedChangesDialog: VueWrapper | undefined = wrapper?.findComponent({ ref: 'unsaved-changes-dialog' });
    // console.log('****', unsavedChangesDialog);
  });
});
