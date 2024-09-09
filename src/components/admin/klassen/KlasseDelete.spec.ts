import { expect, type MockInstance, test } from 'vitest';
import { nextTick } from 'vue';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseDelete from './KlasseDelete.vue';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
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

  wrapper = mount(KlasseDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      klassenId: '1',
      klassenname: '1A',
      schulname: 'schule',
      useIconActivator: false,
    },
    global: {
      components: {
        KlasseDelete,
      },
      plugins: [router],
    },
  });
});

describe('KlasseDelete', () => {
  test('it opens and closes the dialog', async () => {
    wrapper?.setProps({ useIconActivator: false });
    wrapper?.find('[data-testid="open-klasse-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-klasse-delete-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="close-klasse-delete-dialog-button"]')).toBeNull();
  });

  test('it opens the dialog with the icon activator', async () => {
    wrapper?.setProps({ useIconActivator: true });
    await nextTick();

    wrapper?.find('[data-testid="open-klasse-delete-dialog-icon"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();
  });

  test('it deletes a klasse and navigates back to management', async () => {
    wrapper?.setProps({ useIconActivator: false });
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );

    wrapper?.find('[data-testid="open-klasse-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const klasseDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="klasse-delete-button"]',
    )[0];
    klasseDeleteButton?.click();
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-success-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="close-klasse-delete-success-dialog-button"]',
    )[0];
    closeDialogButton?.click();
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
