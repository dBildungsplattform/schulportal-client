import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import RolleCreationView from './RolleCreationView.vue';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import {
  RollenMerkmal,
  RollenSystemRecht,
  type RolleResponse,
  type RolleStore,
  useRolleStore,
} from '@/stores/RolleStore';
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
    expect(wrapper?.getComponent({ name: 'RolleForm' })).toBeTruthy();
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

  test('it fills form and triggers submit', async () => {
    const rollennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenname-input' });
    expect(rollennameInput?.exists()).toBe(false);

    const orgSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'administrationsebene-select' });
    await orgSelect?.setValue('1');
    await nextTick();

    const rollenartSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'rolle-creation-form' })
      .findComponent({ ref: 'rollenart-select' });
    rollenartSelect?.setValue('LERN');
    await nextTick();
    await flushPromises();

    expect(orgSelect?.text()).toEqual('9356494 (Albert-Emil-Hansebrot-Gymnasium)');
    expect(rollenartSelect?.text()).toEqual('Lern');

    const mockRolle: RolleResponse = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
    };

    rolleStore.createdRolle = mockRolle;

    wrapper?.find('[data-testid="rolle-form-create-button"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-rolle-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-rolle-button"]').trigger('click');
    await nextTick();

    expect(rolleStore.createdRolle).toBe(null);
  });
});
