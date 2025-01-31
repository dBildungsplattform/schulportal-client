import { test, type MockInstance } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import PersonBulkDelete from './PersonBulkDelete.vue';
import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
import { nextTick } from 'vue';

let router: Router;
const personStore: PersonStore = usePersonStore();

beforeEach(async () => {
  // Create a container for the app and append it to the document body
  const appContainer: HTMLDivElement = document.createElement('div');
  appContainer.id = 'app';
  document.body.appendChild(appContainer);

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  await router.push('/');
  await router.isReady();

  mount(PersonBulkDelete, {
    attachTo: appContainer,
    props: {
      isLoading: false,
      errorCode: '',
      isDialogVisible: true,
      personIDs: ['person1', 'person2'],
    },
    global: {
      components: {
        PersonBulkDelete,
      },
      plugins: [router],
    },
  });
});

describe('PersonBulkDelete', () => {
  test('renders the dialog when isDialogVisible is true', async () => {
    await nextTick();

    const dialogContent: Element | null = document.body.querySelector('[data-testid="layout-card"]');
    const discardButton: Element | null = document.body.querySelector('[data-testid="person-delete-discard-button"]');
    const submitButton: Element | null = document.body.querySelector('[data-testid="person-delete-submit-button"]');

    expect(dialogContent).not.toBeNull();
    expect(discardButton).not.toBeNull();
    expect(submitButton).not.toBeNull();
  });

  test('renders form and triggers submit', async () => {
    await nextTick();
    const confirmation: Element | null = document.body.querySelector('[data-testid="person-delete-confirmation-text"]');
    const submitButton: Element | null = document.body.querySelector('[data-testid="person-delete-submit-button"]');
    const success: Element | null = document.body.querySelector('[data-testid="person-delete-success-text"]');

    await nextTick();
    await nextTick();
    expect(confirmation).not.toBeNull();
    expect(submitButton).not.toBeNull();
    expect(success).toBeNull();
    await nextTick();

    const deletePersonByIdSpy: MockInstance = vi.spyOn(personStore, 'deletePersonById');
    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(deletePersonByIdSpy).toHaveBeenCalledTimes(2);
  });

  test('closes dialog', async () => {
    await nextTick();
    const discardButton: Element | null = document.body.querySelector('[data-testid="person-delete-discard-button"]');
    const dialogContent: Element | null = document.body.querySelector('[data-testid="layout-card"]');

    expect(discardButton).not.toBeNull();
    expect(dialogContent).not.toBeNull();

    if (discardButton) {
      discardButton.dispatchEvent(new Event('click'));
    }
  });
});
