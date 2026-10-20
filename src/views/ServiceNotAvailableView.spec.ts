import { ServiceIdentifierEnum } from '@/router/service-identifier.enum.js';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
  document.body.innerHTML = '<div><div id="app"></div></div>';
  wrapper = null;
});

afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
});

describe('ServiceNotAvailableView', () => {
  test('shows the 2FA connection failure message', async () => {
    await mountServiceNotAvailableView(ServiceIdentifierEnum.TWO_FACTOR_AUTHENTICATION);

    expect(wrapper?.find('[data-testid="spsh-alert-title"]').text()).toBe(
      'admin.person.twoFactorAuthentication.header',
    );
    expect(wrapper?.find('[data-testid="spsh-alert-text"]').text()).toBe(
      'admin.person.twoFactorAuthentication.errors.connectionFailure',
    );
    expect(router.currentRoute.value.path).toBe(
      `/service-not-available/${ServiceIdentifierEnum.TWO_FACTOR_AUTHENTICATION}`,
    );
  });

  test('redirects to not found for an unsupported service', async () => {
    await mountServiceNotAvailableView('unsupported');

    expect(router.currentRoute.value.path).toBe('/not-found');
  });

  test('navigates to start when the return button is clicked', async () => {
    const locationMock: { href: string } = { href: '' };
    vi.stubGlobal('location', locationMock);

    await mountServiceNotAvailableView(ServiceIdentifierEnum.TWO_FACTOR_AUTHENTICATION);
    await wrapper?.find('[data-testid="spsh-alert-button"]').trigger('click');

    expect(locationMock.href).toBe('/start');
  });
});
