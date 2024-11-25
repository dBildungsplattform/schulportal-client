import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonDelete from './PersonDelete.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { EmailAddressStatus } from '@/api-client/generated';

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
      person: {
        person: {
          id: '2',
          name: {
            vorname: 'Albert',
            familienname: 'Test',
          },
          referrer: 'atest',
          personalnummer: null,
          isLocked: null,
          userLock: null,
          revision: '1',
          lastModified: '2024-05-22',
          email: {
            address: 'email',
            status: EmailAddressStatus.Requested,
          },
        },
      },
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

    await document.querySelector('[data-testid="person-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-delete-confirmation-text"]')).not.toBeNull();
  });

  test('it deletes a person and navigates back to management', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');

    wrapper?.find('[data-testid="open-person-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="person-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-delete-confirmation-text"]')).not.toBeNull();

    const personDeleteButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="person-delete-button"]',
    ) as HTMLElement;
    personDeleteButton.click();
    await nextTick();

    await document.querySelector('[data-testid="person-delete-success-text"]');
    expect(document.querySelector('[data-testid="person-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="close-person-delete-success-dialog-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
