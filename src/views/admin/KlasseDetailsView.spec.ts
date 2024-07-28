import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlassenDetailsView from './KlassenDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';
import routes from '@/router/routes';
import { type Router, createRouter, createWebHistory } from 'vue-router';

let wrapper: VueWrapper | null = null;
let router: Router;

beforeEach( async() => {
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

  wrapper = mount(KlassenDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlassenDetailsView,
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

describe('KlassenDetailsView', () => {
  test('it renders the Klasse details view', () => {
    expect(wrapper?.find('[data-testid="klasse-details-card"]').isVisible()).toBe(true);
  });
});