import { expect, test, type Mock } from 'vitest';
import { DOMWrapper, flushPromises, mount, VueWrapper } from '@vue/test-utils';
import PersonImportView from './PersonImportView.vue';
import { nextTick } from 'vue';
import { useImportStore, type ImportStore } from '@/stores/ImportStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import {
  type RolleStore,
  useRolleStore,
  RollenMerkmal,
  RollenSystemRecht,
  type RolleWithServiceProvidersResponse,
} from '@/stores/RolleStore';
import type { ImportUploadResponse } from '@/api-client/generated';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper | null = null;
let router: Router;

const importStore: ImportStore = useImportStore();
const organisationStore: OrganisationStore = useOrganisationStore();
const rolleStore: RolleStore = useRolleStore();

organisationStore.allSchulen = [
  {
    id: '1133',
    name: 'Schule',
    kennung: '9356494',
    namensergaenzung: '',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
  {
    id: '1',
    name: 'orga',
    kennung: '9356494',
    namensergaenzung: '',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
];

rolleStore.allRollen = [
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LEHR',
    name: 'Lehrer',
    // TODO: remove type casting when generator is fixed
    merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
    systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '1',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
      {
        id: '2',
        name: 'E-Mail',
      },
    ],
    administeredBySchulstrukturknotenName: 'Land SH',
    administeredBySchulstrukturknotenKennung: '',
  },
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LERN',
    name: 'SuS',
    // TODO: remove type casting when generator is fixed
    merkmale: [] as unknown as Set<RollenMerkmal>,
    systemrechte: [] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '2',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
    ],
    administeredBySchulstrukturknotenName: 'Land SH',
    administeredBySchulstrukturknotenKennung: '1234567',
  },
] as RolleWithServiceProvidersResponse[];

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

  wrapper = mount(PersonImportView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonImportView,
      },
      plugins: [router],
    },
  });

  importStore.$reset();
  vi.resetAllMocks();
});

describe('PersonImportView', () => {
  test('it renders the person import view', async () => {
    expect(wrapper?.find('[data-testid="person-import-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="file-input"]').isVisible()).toBe(true);
  });

  test('it shows validation messages', async () => {
    expect(wrapper?.find('#schule-select-messages').text()).toBe('');
    expect(wrapper?.find('#rolle-select-messages').text()).toBe('');
    expect(wrapper?.find('[data-testid="file-input"]').text()).not.toContain('Eine CSV-Datei muss ausgewählt werden.');

    await wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    // wait for transition to happen
    await vi.waitUntil(() => (wrapper?.find('#schule-select-messages').text().length ?? 0) > 0);

    expect(wrapper?.find('#schule-select-messages').text()).toContain('Eine Schule muss ausgewählt werden.');
    expect(wrapper?.find('#rolle-select-messages').text()).toContain('Eine Rolle muss ausgewählt werden.');
    expect(wrapper?.find('[data-testid="file-input"]').text()).toContain('Eine CSV-Datei muss ausgewählt werden.');
  });

  test('it clears selects', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    schuleAutocomplete?.setValue('Schule');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    rolleAutocomplete?.setValue('SuS');
    await nextTick();

    schuleAutocomplete?.find('.v-field__clearable').trigger('click');
    await nextTick();
    // expect(wrapper?.emitted('click:clear')).toBe(true);

    wrapper?.find('[data-testid="rolle-select"] .v-field__clearable').trigger('click');
    await nextTick();
    // expect(wrapper?.emitted('click:clear')).toBe(true);
  });

  test('it uploads a file', async () => {
    const mockFile: File = new File([''], 'personen.csv', { type: 'text/csv' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');

    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await nextTick();

    const uploadResponse: ImportUploadResponse = (importStore.uploadResponse = {
      importvorgangId: '1234567890',
      isValid: true,
      totalImportDataItems: 2,
      totalInvalidImportDataItems: 0,
      invalidImportDataItems: [],
    });

    wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    await nextTick();

    expect(importStore.uploadResponse).toStrictEqual(uploadResponse);
    expect(wrapper?.find('[data-testid="person-upload-success-text"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="open-confirmation-dialog-button"]').isVisible()).toBe(true);
  });

  test('it shows invalid data', async () => {
    const uploadResponse: ImportUploadResponse = (importStore.uploadResponse = {
      importvorgangId: '1234567890',
      isValid: false,
      totalImportDataItems: 2,
      totalInvalidImportDataItems: 2,
      invalidImportDataItems: [
        {
          nachname: '',
          vorname: 'Maria',
          klasse: '1a',
          validationErrors: ['IMPORT_DATA_ITEM_NACHNAME_IS_TOO_SHORT'],
        },
        {
          nachname: 'Meier',
          vorname: '',
          klasse: '2b',
          validationErrors: ['IMPORT_DATA_ITEM_VORNAME_IS_TOO_SHORT', 'IMPORT_DATA_ITEM_KLASSE_NOT_FOUND'],
        },
      ],
    });

    wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    await nextTick();

    expect(importStore.uploadResponse).toStrictEqual(uploadResponse);

    const invalidDataItems: DOMWrapper<Element>[] | undefined = wrapper?.findAll('[data-testid^="invalid-item-row"]');
    expect(invalidDataItems?.length).toBe(2);
  });

  test('it executes the import and returns to form', async () => {
    const mockFile: File = new File([''], 'personen.csv', { type: 'text/csv' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');
    importStore.executePersonenImport = vi.fn();
    importStore.startImportStatusPolling = vi.fn();

    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await nextTick();

    const uploadResponse: ImportUploadResponse = (importStore.uploadResponse = {
      importvorgangId: '1234567890',
      isValid: true,
      totalImportDataItems: 2,
      totalInvalidImportDataItems: 0,
      invalidImportDataItems: [],
    });

    wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    await nextTick();

    expect(importStore.uploadResponse).toStrictEqual(uploadResponse);
    expect(wrapper?.find('[data-testid="person-upload-success-text"]').isVisible()).toBe(true);

    importStore.importedData = new File([''], 'personen.txt', { type: 'text/plain' });

    wrapper?.find('[data-testid="open-confirmation-dialog-button"]').trigger('click');
    await nextTick();

    const importConfirmationText: Element = document.querySelector(
      '[data-testid="person-import-confirmation-text"]',
    ) as Element;
    const executeImportButton: HTMLInputElement = document.querySelector(
      '[data-testid="execute-import-button"]',
    ) as HTMLInputElement;

    expect(importConfirmationText).not.toBeNull();
    expect(executeImportButton).not.toBeNull();

    executeImportButton.click();
    await nextTick();

    expect(importStore.executePersonenImport).toHaveBeenCalledOnce();
    expect(importStore.startImportStatusPolling).toHaveBeenCalledOnce();
    expect(document.querySelector('[data-testid="person-import-confirmation-text"]')).toBeNull();
  });

  test('it downloads an imported file', async () => {
    global.URL.createObjectURL = vi.fn();
    importStore.importProgress = 100;
    await nextTick();

    const downloadButton: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="download-file-button"]');
    downloadButton?.trigger('click');
  });

  test('it shows loading bar', async () => {
    importStore.importProgress = 5;
    importStore.errorCode = null;
    await flushPromises();

    expect(wrapper?.find('[data-testid="import-progress-bar"]').isVisible()).toBe(true);
  });

  test('it resets the form for another upload', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');
    const mockFile: File = new File([''], 'personen.csv', { type: 'text/csv' });

    importStore.importProgress = 100;
    schuleAutocomplete?.setValue('Schule');
    rolleAutocomplete?.setValue('SuS');
    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await nextTick();

    const anotherImportButton: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="another-import-button"]');
    anotherImportButton?.trigger('click');
    await nextTick();

    expect(schuleAutocomplete?.text()).toBe('');
    expect(rolleAutocomplete?.text()).toBe('');
    expect(fileInput?.text()).toBe('');
  });

  test('it resets the store and navigates when discarding', async () => {
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');
    const mockFile: File = new File([''], 'personen.csv', { type: 'text/csv' });

    importStore.errorCode = 'dummy';
    importStore.uploadResponse = {} as ImportStore['uploadResponse'];
    importStore.importedData = {} as ImportStore['importedData'];
    importStore.importProgress = 100;
    schuleAutocomplete?.setValue('Schule');
    rolleAutocomplete?.setValue('SuS');
    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await nextTick();

    const closeDialogButton: DOMWrapper<Element> | undefined = wrapper?.find(
      '[data-testid="close-layout-card-button"]',
    );
    closeDialogButton?.trigger('click');
    await nextTick();

    expect(importStore.errorCode).toBeNull();
    expect(importStore.uploadResponse).toBeNull();
    expect(importStore.importedData).toBeNull();
    expect(importStore.importProgress).toBe(0);
    expect(schuleAutocomplete?.text()).toBe('');
    expect(rolleAutocomplete?.text()).toBe('');
    expect(fileInput?.text()).toBe('');
  });

  test.each([['utf-8']])('it reads files with %s encoding', async (_encoding: string) => {
    const totalImportDataItems: number = 1234;
    const schuleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');
    const mockFile: File = new File(['test'], 'personen.csv', { type: 'text/csv' });
    schuleAutocomplete?.setValue('Schule');
    rolleAutocomplete?.setValue('SuS');
    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await fileInput?.trigger('change');
    await nextTick();
    const mockFunction: Mock = vi.fn(async () => {
      importStore.importedData = null;
      importStore.uploadIsLoading = false;
      importStore.importIsLoading = false;
      importStore.errorCode = null;
      importStore.importProgress = 0;
      await nextTick();
      importStore.uploadResponse = {
        isValid: true,
        importvorgangId: '7561564',
        totalImportDataItems,
        totalInvalidImportDataItems: 0,
        invalidImportDataItems: [],
      };
    });
    importStore.uploadPersonenImportFile = mockFunction;
    await wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    await vi.waitUntil(() => mockFunction.mock.calls.length > 0);
    expect(mockFunction).toHaveBeenCalledOnce();
    await vi.waitUntil(() => wrapper?.find('[data-testid="person-upload-success-text"]').exists());
    expect(wrapper?.find('[data-testid="person-upload-success-text"]').text()).toContain('erfolgreich');
    expect(wrapper?.find('[data-testid="person-upload-success-text"]').text()).toContain(
      totalImportDataItems.toString(),
    );
  });
});
