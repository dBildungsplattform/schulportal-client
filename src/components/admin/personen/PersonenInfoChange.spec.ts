import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonenInfoChange from './PersonenInfoChange.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonenInfoChange, {
    attachTo: document.getElementById('app') || '',
    props: {
      confirmUnsavedChangesAction: () => vi.fn(),
      showUnsavedChangesDialog: false,
      selectedKopersNrPersonInfoProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedKopersNrPersonInfo: '',
    },
    global: {
      components: {
        PersonenInfoChange,
      },
    },
  });
});

describe('PersonenInfoChange', () => {
  test('it renders the component and its child components', async () => {
    expect(wrapper?.find('[data-testid="personen-info-change"]').exists()).toBe(true);
    expect(wrapper?.findComponent({ name: 'KopersInput' }).exists()).toBe(true);
    expect(wrapper?.findComponent({ ref: 'unsaved-changes-dialog' }).exists()).toBe(true);
  });

  test('it shows the correct dialog when unsaved changes exist', async () => {
    wrapper?.setProps({ showUnsavedChangesDialog: true });
    await nextTick();

    const closeDialogButton: HTMLElement = (await document.querySelector(
      '[data-testid="close-unsaved-changes-dialog-button"]',
    )) as HTMLElement;

    await document.querySelector('[data-testid="unsaved-changes-warning-text"]');
    expect(document.querySelector('[data-testid="unsaved-changes-warning-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="confirm-unsaved-changes-button"]')?.textContent).toBe('Ja');
    expect(closeDialogButton.textContent).toBe('Nein');

    await closeDialogButton.click();
    await nextTick();
  });

  test('it handles kopersnr update', async () => {
    wrapper?.findComponent({ name: 'KopersInput' }).find('input').setValue('123456');
    await nextTick();

    expect(wrapper?.emitted('update:selectedKopersNrPersonInfo')).toBeTruthy();
  });
});
