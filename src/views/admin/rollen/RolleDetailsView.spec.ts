import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleDetailsView from './RolleDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';
import routes from '@/router/routes';
import { type Router, createRouter, createWebHistory } from 'vue-router';
import { RollenMerkmal, RollenSystemRecht, useRolleStore, type RolleStore } from '@/stores/RolleStore';

let wrapper: VueWrapper | null = null;
let router: Router;
let rolleStore: RolleStore;

beforeEach(async () => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  rolleStore = useRolleStore();

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

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
});
