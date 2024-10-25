import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { VApp } from 'vuetify/components';
import { h } from 'vue';
import TheFooter from './TheFooter.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper | null = null;
let router: Router;

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

  wrapper = mount(VApp, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        TheFooter,
      },
      plugins: [router],
    },
    slots: {
      default: h(TheFooter),
    },
  });
});

describe('TheFooter', () => {
  test('it renders the footer', () => {
    expect(wrapper?.find('[data-testid="footer"]').isVisible()).toBe(true);
  });
});
