import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { VApp } from 'vuetify/components';
import { h, type Component } from 'vue';
import TheHeader from './TheHeader.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

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
        TheHeader: TheHeader as Component,
      },
      plugins: [router],
    },
    slots: {
      default: h(TheHeader),
    },
  });
});

describe('TheHeader', () => {
  test('it renders the header', () => {
    expect(wrapper?.find('[data-testid="header"]').isVisible()).toBe(true);
  });
});
