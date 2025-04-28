import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import PersonBulkError from './PersonBulkError.vue';
import * as fileUtils from '@/utils/file';

let wrapper: VueWrapper | null = null;

const errorsMock: { vorname: string; nachname: string; error: string }[] = [
  { vorname: 'John', nachname: 'Doe', error: 'Invalid email' },
  { vorname: 'Jane', nachname: 'Smith', error: 'Missing field' },
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
        PersonBulkError,
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

    expect(wrapper?.emitted('update:isDialogVisible')).toBeTruthy();
    expect(wrapper?.emitted('update:isDialogVisible')?.[0]).toEqual([false]);
  });

  it('downloads CSV when save button is clicked', async () => {
    const downloadSpy: MockInstance = vi.spyOn(fileUtils, 'download').mockImplementation(() => {});

    await nextTick();

    const saveButton: HTMLElement = document.querySelector(
      '[data-testid="person-bulk-error-save-button"]',
    ) as HTMLElement;
    saveButton.click();
    await nextTick();

    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });
});
