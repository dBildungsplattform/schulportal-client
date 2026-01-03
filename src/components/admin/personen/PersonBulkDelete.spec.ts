import routes from '@/router/routes';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { test, type MockInstance } from 'vitest';
import { nextTick, type Component } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonBulkDelete from './PersonBulkDelete.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

const personWithZuordnungen: PersonWithZuordnungen = DoFactory.getPersonWithZuordnung();

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
  bulkOperationStore.resetState();

  wrapper = mount(PersonBulkDelete, {
    attachTo: appContainer,
    props: {
      isLoading: false,
      errorCode: '',
      isDialogVisible: true,
      selectedPersonen: new Map([[personWithZuordnungen.id, personWithZuordnungen]]),
    },
    global: {
      components: {
        PersonBulkDelete: PersonBulkDelete as Component,
      },
      plugins: [router],
    },
  });
});

describe('PersonBulkDelete', () => {
  test('renders the dialog when isDialogVisible is true', async () => {
    await nextTick();

    const dialogContent: Element | null = document.body.querySelector('[data-testid="person-delete-layout-card"]');
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

    const bulkPersonenDeleteSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkPersonenDelete');
    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(bulkPersonenDeleteSpy).toHaveBeenCalledTimes(1);
  });

  test('renders form and triggers submit with errors', async () => {
    bulkOperationStore.currentOperation = {
      type: null,
      isRunning: false,
      progress: 0,
      complete: false,
      errors: new Map([['someId', 'Some error message']]),
      data: new Map(),
      successMessage: '',
    };
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

    const bulkPersonenDeleteSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkPersonenDelete');
    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(bulkPersonenDeleteSpy).toHaveBeenCalledTimes(1);

    const errorDialog: Element | null = document.body.querySelector('.v-dialog');
    expect(errorDialog).not.toBeNull();
  });

  test('closes dialog', async () => {
    await nextTick();
    const discardButton: Element | null = document.body.querySelector('[data-testid="person-delete-discard-button"]');
    const dialogContent: Element | null = document.body.querySelector('[data-testid="person-delete-layout-card"]');

    expect(discardButton).not.toBeNull();
    expect(dialogContent).not.toBeNull();

    if (discardButton) {
      discardButton.dispatchEvent(new Event('click'));
    }
  });

  test('shows error dialog when showErrorDialog is true', async () => {
    await nextTick();

    (wrapper?.vm as unknown as { showErrorDialog: boolean }).showErrorDialog = true;

    await nextTick();

    const errorDialog: VueWrapper | undefined = wrapper?.findComponent({ name: 'PersonBulkError' });
    expect(errorDialog?.exists()).toBe(true);
  });
});
