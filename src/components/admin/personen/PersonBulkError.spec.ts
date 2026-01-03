import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick, type Component } from 'vue';
import PersonBulkError from './PersonBulkError.vue';
import * as fileUtils from '@/utils/file';

let wrapper: VueWrapper | null = null;

const errorsMock: { vorname: string; nachname: string; username: string; error: string }[] = [
  { vorname: 'John', nachname: 'Doe', username: 'jdoe', error: 'Invalid email' },
  { vorname: 'Jane', nachname: 'Smith', username: 'jsmith', error: 'Missing field' },
];

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonBulkError, {
    attachTo: document.getElementById('app') || undefined,
    props: {
      bulkOperationName: 'John Doe',
      errors: errorsMock,
      isDialogVisible: true,
    },
    global: {
      components: {
        PersonBulkError: PersonBulkError as Component,
      },
    },
  });
});

afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
});

describe('PersonBulkError.vue', () => {
  it('renders the error list correctly', async () => {
    await nextTick();

    const errorItems: NodeListOf<HTMLLIElement> = document.querySelectorAll('li');
    expect(errorItems.length).toBe(errorsMock.length);

    expect(document.body.textContent).toContain('Invalid email');
    expect(document.body.textContent).toContain('Missing field');
  });

  it('closes the dialog when close button is clicked', async () => {
    await nextTick();

    const closeButton: HTMLElement = document.querySelector(
      '[data-testid="person-bulk-error-discard-button"]',
    ) as HTMLElement;
    closeButton.click();
    await nextTick();

    const confirmationCloseButton: HTMLElement = document.querySelector(
      '[data-testid="confirm-close-bulk-error-dialog-button"]',
    ) as HTMLElement;
    confirmationCloseButton.click();
    await nextTick();

    expect(wrapper?.emitted('update:isDialogVisible')).toBeTruthy();
    expect(wrapper?.emitted('update:isDialogVisible')?.[0]).toEqual([false]);
  });

  it('downloads CSV when save button is clicked', async () => {
    const downloadSpy: MockInstance = vi.spyOn(fileUtils, 'download').mockImplementation(() => undefined);

    await nextTick();

    const saveButton: HTMLElement = document.querySelector(
      '[data-testid="person-bulk-error-save-button"]',
    ) as HTMLElement;
    saveButton.click();
    await nextTick();

    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it('downloads passwords blob with custom filename if provided', async () => {
    const mockBlob: Blob = new Blob(['test'], { type: 'text/csv' });
    const customFilename: string = 'my-custom-file.csv';

    const downloadSpy: MockInstance = vi.spyOn(fileUtils, 'download').mockImplementation(() => undefined);

    wrapper = mount(PersonBulkError, {
      attachTo: document.getElementById('app') || undefined,
      props: {
        bulkOperationName: 'Passwort zurücksetzen',
        errors: errorsMock,
        isDialogVisible: true,
        passwords: mockBlob,
        filename: customFilename,
      },
    });

    await nextTick();

    const passwordDownloadButton: HTMLElement = document.querySelector(
      '[data-testid="person-bulk-error-download-passwords-button"]',
    ) as HTMLElement;
    expect(passwordDownloadButton).not.toBeNull();

    passwordDownloadButton.dispatchEvent(new Event('click'));
    await nextTick();

    expect(downloadSpy).toHaveBeenCalledWith(customFilename, mockBlob);
  });
});
