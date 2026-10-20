import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { type Component } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import ServiceNotAvailableView from './ServiceNotAvailableView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;

async function mountServiceNotAvailableView(serviceName: string): Promise<void> {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/service-not-available/:serviceName',
        component: ServiceNotAvailableView as Component,
      },
      {
        path: '/not-found',
        component: { template: '<div />' },
      },
    ],
  });

  await router.push(`/service-not-available/${serviceName}`);
  await router.isReady();
  document.body.innerHTML = '<div><div id="app"></div></div>';

  wrapper = mount(ServiceNotAvailableView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
      mocks: {
        $t: (key: string): string => key,
      },
    },
  });

  await flushPromises();
}

beforeEach(() => {
  wrapper = null;
});

afterEach(() => {
  wrapper?.unmount();
});

describe('ServiceNotAvailableView', () => {
  test('shows the 2FA connection failure message', async () => {
    await mountServiceNotAvailableView('2FA');

    expect(wrapper?.find('[data-testid="spsh-alert-title"]').text()).toBe(
      'admin.person.twoFactorAuthentication.header',
    );
    expect(wrapper?.find('[data-testid="spsh-alert-text"]').text()).toBe(
      'admin.person.twoFactorAuthentication.errors.connectionFailure',
    );
    expect(router.currentRoute.value.path).toBe('/service-not-available/2FA');
  });

  test('redirects to not found for an unsupported service', async () => {
    await mountServiceNotAvailableView('unsupported');

    expect(router.currentRoute.value.path).toBe('/not-found');
  });
});
