import routes from '@/router/routes';
import { VueWrapper, mount } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { expect, test, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonDelete from './PersonDelete.vue';

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

  wrapper = mount(PersonDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      disabled: false,
      errorCode: '',
      person: DoFactory.getPersonendatensatz(),
    },
    global: {
      components: {
        PersonDelete,
      },
      plugins: [router],
    },
  });
});

describe('PersonDelete', () => {
  test('it opens the dialog', async () => {
    wrapper?.find('[data-testid="open-person-delete-dialog-button"]').trigger('click');
    await nextTick();

    document.querySelector('[data-testid="person-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-delete-confirmation-text"]')).not.toBeNull();
  });

  test('it deletes a person and navigates back to management', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');

    wrapper?.find('[data-testid="open-person-delete-dialog-button"]').trigger('click');
    await nextTick();

    document.querySelector('[data-testid="person-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-delete-confirmation-text"]')).not.toBeNull();

    const personDeleteButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="person-delete-button"]',
    ) as HTMLElement;
    personDeleteButton.click();
    await nextTick();

    document.querySelector('[data-testid="person-delete-success-text"]');
    expect(document.querySelector('[data-testid="person-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="close-person-delete-success-dialog-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
