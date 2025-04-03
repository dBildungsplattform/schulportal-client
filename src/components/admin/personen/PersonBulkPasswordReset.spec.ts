import routes from '@/router/routes';
import { usePersonStore, type PersonenWithRolleAndZuordnung, type PersonStore } from '@/stores/PersonStore';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { test } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import PersonBulkPasswordReset from './PersonBulkPasswordReset.vue';
import { buildCSV, download } from '@/utils/file';

let router: Router;
const personStore: PersonStore = usePersonStore();

type Props = {
  isDialogVisible: boolean;
  isSelectionFromSingleSchule: boolean;
  selectedSchuleKennung?: string;
  selectedPersons: PersonenWithRolleAndZuordnung;
};

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const props: Props = {
    isDialogVisible: true,
    isSelectionFromSingleSchule: true,
    selectedSchuleKennung: '1234567',
    selectedPersons: [
      {
        administrationsebenen: '',
        klassen: '1a',
        rollen: '',
        person: {
          id: 'test',
          name: {
            familienname: 'Pan',
            vorname: 'Peter',
          },
          referrer: 'ppan',
          revision: '1',
          email: {
            address: 'ppan@wunderland',
            status: 'ENABLED',
          },
          isLocked: null,
          lastModified: '',
          personalnummer: '1234',
          userLock: null,
        },
      },
    ],
    ...partialProps,
  };

  return mount(PersonBulkPasswordReset, {
    attachTo: document.getElementById('app') || '',
    props,
    global: {
      components: {
        PersonBulkPasswordReset,
      },
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
  personStore.$reset();
  vi.restoreAllMocks();
});

describe('PersonBulkDelete', () => {
  test.each([[true], [false]])('renders the dialog when isDialogVisible=%s', async (isDialogVisible: boolean) => {
    mountComponent({ isDialogVisible });
    await nextTick();
    const layoutCard: Element | null = document.body.querySelector('[data-testid="password-reset-layout-card"]');
    if (isDialogVisible) expect(layoutCard).not.toBeNull();
    else expect(layoutCard).toBeNull();
  });

  test.each([[true], [false]])(
    'switches between error and confirmation text when isSelectionFromSingleSchule=%s',
    async (isSelectionFromSingleSchule: boolean) => {
      mountComponent({ isSelectionFromSingleSchule });
      await nextTick();
      const errorMessage: Element | null = document.body.querySelector('[data-testid="error-text"]');
      const confirmationMessage: Element | null = document.body.querySelector(
        '[data-testid="password-reset-confirmation-text"]',
      );
      if (isSelectionFromSingleSchule) {
        expect(errorMessage).toBeNull();
        expect(confirmationMessage).not.toBeNull();
      } else {
        expect(errorMessage).not.toBeNull();
        expect(confirmationMessage).toBeNull();
      }
    },
  );

  test('when state changes, it switches to next template', async () => {
    type UiElements = {
      notice: Element | null;
      progressbar: Element | null;
      successMessage: Element | null;
    };
    function findElements(): UiElements {
      return {
        notice: document.body.querySelector('[data-testid="password-reset-progressing-notice"]'),
        progressbar: document.body.querySelector('[data-testid="password-reset-progressbar"]'),
        successMessage: document.body.querySelector('[data-testid="password-reset-success-text"]'),
      };
    }

    mountComponent();
    personStore.bulkResetPasswordResult = {
      progress: 0.5,
      complete: false,
      errors: new Map(),
      passwords: new Map(),
    };
    await nextTick();

    {
      const { notice, progressbar, successMessage }: UiElements = findElements();
      expect(notice).not.toBeNull();
      expect(progressbar).not.toBeNull();
      expect(progressbar?.textContent).toContain(personStore.bulkResetPasswordResult.progress * 100);
      expect(successMessage).toBeNull();
    }

    personStore.bulkResetPasswordResult.progress = 1;
    personStore.bulkResetPasswordResult.complete = true;
    await nextTick();

    {
      const { notice, progressbar, successMessage }: UiElements = findElements();
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
    expect(personStore.bulkResetPasswordResult).toBeNull();
  });

  test('close button closes dialog and resets store', async () => {
    personStore.bulkResetPasswordResult = {
      progress: 1,
      complete: true,
      errors: new Map(),
      passwords: new Map(),
    };
    const wrapper: VueWrapper = mountComponent();
    await nextTick();

    const closeButton: Element | null = document.body.querySelector('[data-testid="password-reset-close-button"]');
    expect(closeButton).not.toBeNull();

    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    closeButton!.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(wrapper.emitted('update:dialogExit')).toEqual([[true]]);
    expect(personStore.bulkResetPasswordResult).toBeNull();
  });

  test('clicking the reset button starts processing', async () => {
    mountComponent({});
    await nextTick();

    const submitButton: Element | null = document.body.querySelector('[data-testid="password-reset-submit-button"]');
    expect(submitButton).not.toBeNull();

    submitButton!.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(personStore.bulkResetPassword).toHaveBeenCalledWith(['test']);
  });

  test('download is enabled after operation', async () => {
    personStore.bulkResetPasswordResult = {
      progress: 1,
      complete: true,
      errors: new Map(),
      passwords: new Map([['test', 'neuesPasswort']]),
    };
    mountComponent();
    await nextTick();

    const downloadButton: Element | null = document.body.querySelector('[data-testid="download-result-button"]');
    expect(downloadButton).not.toBeNull();

    downloadButton!.dispatchEvent(new Event('click'));
    await flushPromises();
  });

  test.each([['test'], [undefined]])(
    'file is correctly named and can be downloaded, when kennung=%s',
    async (selectedSchuleKennung: string | undefined) => {
      vi.mock('@/utils/file', () => ({
        buildCSV: vi.fn(() => new Blob()),
        download: vi.fn(),
      }));
      const filename: string = selectedSchuleKennung ? `PW_${selectedSchuleKennung}.txt` : 'PW.txt';
      personStore.bulkResetPasswordResult = {
        progress: 1,
        complete: true,
        errors: new Map(),
        passwords: new Map([['test', 'neuesPasswort']]),
      };
      mountComponent({
        selectedSchuleKennung,
      });
      await nextTick();

      const downloadButton: Element | null = document.body.querySelector('[data-testid="download-result-button"]');
      downloadButton!.dispatchEvent(new Event('click'));
      await flushPromises();
      expect(download).toHaveBeenCalledWith(filename, new Blob());
    },
  );
});
