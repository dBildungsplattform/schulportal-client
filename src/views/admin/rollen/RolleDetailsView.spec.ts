import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleDetailsView from './RolleDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';
import routes from '@/router/routes';
import { type Router, createRouter, createWebHistory } from 'vue-router';
import { RollenMerkmal, RollenSystemRecht, useRolleStore, type RolleStore } from '@/stores/RolleStore';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const rolleStore: RolleStore = useRolleStore();

rolleStore.currentRolle = {
  administeredBySchulstrukturknoten: '1234',
  rollenart: 'LEHR',
  name: 'Lehrer',
  // TODO: remove type casting when generator is fixed
  merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
  systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
  id: '1',
};

rolleStore.updatedRolle = {
  administeredBySchulstrukturknoten: '1234',
  rollenart: 'LEHR',
  name: 'Updated Lehrer',
  merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
  systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
  createdAt: '2022',
  updatedAt: '2023',
  id: '1',
  serviceProviders: [{ id: 'sp1', name: 'ServiceProvider1' }],
};

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

  wrapper = mount(RolleDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleDetailsView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
      plugins: [router],
    },
  });
});

describe('RolleDetailsView', () => {
  test('it renders the role details view', () => {
    expect(wrapper?.find('[data-testid="rolle-details-card"]').isVisible()).toBe(true);
  });

  test('activates editing mode', async () => {
    rolleStore.updatedRolle = null;
    rolleStore.errorCode = '';

    await nextTick();

    await wrapper?.find('[data-testid="rolle-edit-button"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="rolle-changes-save"]').isVisible()).toBe(true);
  });

  test('Does not cancel editing because of unsaved changes', async () => {
    rolleStore.updatedRolle = null;
    rolleStore.errorCode = '';

    await wrapper?.find('[data-testid="rolle-edit-button"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="rolle-edit-cancel"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="rolle-edit-button"]').exists()).toBe(false);
  });

  test('submits the form and shows the success template', async () => {
    rolleStore.updatedRolle = null;
    rolleStore.errorCode = '';

    await wrapper?.find('[data-testid="rolle-edit-button"]').trigger('click');
    await nextTick();

    const rolleFormWrapper: VueWrapper<never, never> | undefined = wrapper?.findComponent({ name: 'RolleForm' });

    // Set the administrationsebene and rollenart first
    await rolleFormWrapper?.findComponent({ ref: 'administrationsebene-select' }).setValue('1');
    await nextTick();

    await rolleFormWrapper?.findComponent({ ref: 'rollenart-select' }).setValue('LEHR');
    await nextTick();

    await rolleFormWrapper?.findComponent({ ref: 'rollenname-input' }).setValue('Updated Lehrer');
    await nextTick();

    await wrapper?.find('[data-testid="rolle-changes-save"]').trigger('click');
    await nextTick();

    rolleStore.updatedRolle = {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Updated Lehrer',
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2023',
      id: '1',
      serviceProviders: [{ id: 'sp1', name: 'ServiceProvider1' }],
    };
    await nextTick();

    const successTemplate: VueWrapper<never, never> | undefined = wrapper?.findComponent({ name: 'SuccessTemplate' });

    expect(successTemplate?.find('[data-testid="rolle-success-text"]').text()).toBe(
      'Die Rolle wurde erfolgreich geändert.',
    );
  });
});
