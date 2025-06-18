import routes from '@/router/routes';
import { OperationType, useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { Person } from '@/stores/types/Person';
import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import type { Zuordnung } from '@/stores/types/Zuordnung';
import { download } from '@/utils/file';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonBulkPasswordReset from './PersonBulkPasswordReset.vue';

let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

type Props = {
  isDialogVisible: boolean;
  selectedSchuleKennung?: string;
  selectedPersonen: Map<string, PersonWithZuordnungen>;
};

const mockPerson: Person = DoFactory.getPerson();

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const selectedSchuleKennung: string = '1234567';
  const zuordnung: Zuordnung = DoFactory.getZuordnung({
    sskDstNr: selectedSchuleKennung,
  });
  const props: Props = {
    isDialogVisible: true,
    selectedSchuleKennung,
    selectedPersonen: new Map([[mockPerson.id, DoFactory.getPersonWithZuordnung(mockPerson, [zuordnung])]]),
    ...partialProps,
  };

  return mount(PersonBulkPasswordReset, {
    attachTo: document.getElementById('app') || '',
    props,
    global: {
      plugins: [router],
    },
  });
}

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

  await router.push('/');
  await router.isReady();

  bulkOperationStore.$reset();
  bulkOperationStore.resetState();
  vi.restoreAllMocks();
});

describe('PersonBulkPasswordReset', () => {
  test.each([[true], [false]])('renders the dialog when isDialogVisible=%s', async (isDialogVisible: boolean) => {
    mountComponent({ isDialogVisible });
    await nextTick();
    const layoutCard: Element | null = document.body.querySelector('[data-testid="password-reset-layout-card"]');
    if (isDialogVisible) expect(layoutCard).not.toBeNull();
    else expect(layoutCard).toBeNull();
  });

  test('when state changes, it switches to next template', async () => {
    mountComponent();
    bulkOperationStore.currentOperation = {
      type: OperationType.DELETE_PERSON,
      isRunning: true,
      progress: 0.5,
      complete: false,
      errors: new Map(),
      data: new Map(),
      successMessage: '',
    };
    await nextTick();

    {
      const notice: Element | null = document.body.querySelector('[data-testid="password-reset-progressing-notice"]');
      const progressbar: Element | null = document.body.querySelector('[data-testid="password-reset-progressbar"]');
      const successMessage: Element | null = document.body.querySelector('[data-testid="password-reset-success-text"]');
      expect(notice).not.toBeNull();
      expect(progressbar).not.toBeNull();
      expect(successMessage).toBeNull();
    }

    bulkOperationStore.currentOperation.progress = 1;
    bulkOperationStore.currentOperation.complete = true;
    bulkOperationStore.currentOperation.isRunning = false;
    await nextTick();

    {
      const notice: Element | null = document.body.querySelector('[data-testid="password-reset-progressing-notice"]');
      const progressbar: Element | null = document.body.querySelector('[data-testid="password-reset-progressbar"]');
      const successMessage: Element | null = document.body.querySelector('[data-testid="password-reset-success-text"]');
      expect(notice).toBeNull();
      expect(progressbar).toBeNull();
      expect(successMessage).not.toBeNull();
    }
  });

  test('cancel button closes dialog and resets store', async () => {
    const wrapper: VueWrapper = mountComponent();
    await nextTick();

    const cancelButton: Element | null = document.body.querySelector('[data-testid="password-reset-discard-button"]');
    expect(cancelButton).not.toBeNull();

    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    cancelButton!.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(wrapper.emitted('update:dialogExit')).toEqual([[false]]);
    expect(bulkOperationStore.currentOperation).toEqual({
      complete: false,
      data: new Map(),
      errors: new Map(),
      isRunning: false,
      progress: 0,
      type: null,
    });
  });

  test('close button triggers confirmation and closing dialog resets store', async () => {
    bulkOperationStore.currentOperation = {
      type: OperationType.DELETE_PERSON,
      isRunning: false,
      progress: 1,
      complete: true,
      errors: new Map(),
      data: new Map(),
      successMessage: '',
    };
    const wrapper: VueWrapper = mountComponent();
    await nextTick();

    const closeButton: Element | null = document.body.querySelector('[data-testid="password-reset-close-button"]');
    expect(closeButton).not.toBeNull();

    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    closeButton!.dispatchEvent(new Event('click')); // opens confirmation dialog
    await flushPromises();

    const confirmationButton: Element | null = document.body.querySelector(
      '[data-testid="password-reset-download-confirmation-button"]',
    );
    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    expect(confirmationButton).not.toBeNull();
    confirmationButton!.dispatchEvent(new Event('click')); // closes confirmation dialog
    await flushPromises();

    closeButton!.dispatchEvent(new Event('click')); // closes dialog
    await flushPromises();

    expect(wrapper.emitted('update:dialogExit')).toEqual([[true]]);
  });

  test('clicking the reset button starts processing', async () => {
    const spy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkResetPassword').mockResolvedValue();

    mountComponent();
    await nextTick();

    const submitButton: Element | null = document.body.querySelector('[data-testid="password-reset-submit-button"]');
    expect(submitButton).not.toBeNull();

    submitButton!.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(spy).toHaveBeenCalledWith([mockPerson.id]);
  });

  test('download is enabled after operation', async () => {
    bulkOperationStore.currentOperation = {
      type: OperationType.DELETE_PERSON,
      isRunning: false,
      progress: 1,
      complete: true,
      errors: new Map(),
      data: new Map([['test', 'neuesPasswort']]),
      successMessage: '',
    };
    mountComponent();
    await nextTick();

    const downloadButton: Element | null = document.body.querySelector('[data-testid="download-result-button"]');
    expect(downloadButton).not.toBeNull();

    downloadButton!.dispatchEvent(new Event('click'));
    await flushPromises();
  });

  test.each([['1234567'], [undefined]])(
    'file is correctly named and can be downloaded, when selectedSchuleKennung=%s',
    async (selectedSchuleKennung: string | undefined) => {
      vi.mock('@/utils/file', () => ({
        buildCSV: vi.fn(() => new Blob()),
        download: vi.fn(),
      }));

      const filename: string = selectedSchuleKennung ? `PW_${selectedSchuleKennung}.txt` : 'PW.txt';

      bulkOperationStore.currentOperation = {
        type: OperationType.DELETE_PERSON,
        isRunning: false,
        progress: 1,
        complete: true,
        errors: new Map(),
        data: new Map([['test', 'neuesPasswort']]),
        successMessage: '',
      };

      mountComponent({ selectedSchuleKennung });
      await nextTick();

      const downloadButton: Element | null = document.body.querySelector('[data-testid="download-result-button"]');
      downloadButton!.dispatchEvent(new Event('click'));
      await flushPromises();

      expect(download).toHaveBeenCalledWith(filename, expect.any(Blob));
    },
  );

  test('shows error dialog when showErrorDialog is true', async () => {
    const wrapper: VueWrapper | undefined = mountComponent();
    await nextTick();

    // Manually set showErrorDialog to true
    (wrapper.vm as unknown as { showErrorDialog: boolean }).showErrorDialog = true;

    await nextTick();

    const errorDialog: VueWrapper | undefined = wrapper.findComponent({ name: 'PersonBulkError' });
    expect(errorDialog.exists()).toBe(true);
  });
});
