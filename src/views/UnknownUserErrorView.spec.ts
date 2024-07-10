import routes from '@/router/routes';
import { VueWrapper, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type MockInstance } from 'vitest';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import UnknownUserErrorView from './UnknownUserErrorView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(UnknownUserErrorView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        UnknownUserErrorView,
      },
      plugins: [router],
    },
  });
});

describe('UnknownUserErrorView', () => {
  test('it renders the error card', () => {
    const alertTitle: WrapperLike | undefined = wrapper?.find('[data-testid="alert-title"]');

    expect(alertTitle?.isVisible()).toBe(true);
    expect(alertTitle?.text()).toEqual('Unbekannter Benutzer');
  });

  test('it renders the error description', () => {
    const alertTitle: WrapperLike | undefined = wrapper?.find('[data-testid="alert-text"]');

    expect(alertTitle?.isVisible()).toBe(true);
    expect(alertTitle?.text()).toEqual('Der Benutzer ist im Schulportal SH nicht bekannt.');
  });

  test('it renders the return button', () => {
    const alertTitle: WrapperLike | undefined = wrapper?.find('[data-testid="alert-button"]');

    expect(alertTitle?.isVisible()).toBe(true);
    expect(alertTitle?.text()).toEqual('Zurück zur Startseite');
  });

  test('clicking the button should push replace route', () => {
    const replaceSpy: MockInstance = vi.spyOn(router, 'replace');

    wrapper?.find('[data-testid="alert-button"]').trigger('click');

    expect(replaceSpy).toHaveBeenCalledWith('/');
  });
});
