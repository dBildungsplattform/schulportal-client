import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import InfoDialog from './InfoDialog.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(InfoDialog, {
    props: {
      id: 'test-id',
      isDialogVisible: true,
      header: 'Test Header',
      message: 'Test Message',
    },

    global: {
      components: {
        InfoDialog,
      },
    },
  });
});

describe('InfoDialog', () => {
  test('it renders the dialog when isDialogVisible is true', () => {
    const dialog: VueWrapper | undefined = wrapper?.findComponent({ ref: 'test-id-dialog' });
    expect(dialog?.exists()).toBe(true);
    expect(dialog?.isVisible()).toBe(true);
  });

  test('close button is visible and clickable', async () => {
    const syncPersonButton: HTMLElement = document.querySelector(
      '[data-testid="test-id-cancel-button"]',
    ) as HTMLElement;
    syncPersonButton.click();
    await nextTick();
    expect(wrapper?.emitted('update:dialogExit')).toBeTruthy();
  });

  test('dialog is not rendered when isDialogVisible is false', async () => {
    await wrapper?.setProps({ isDialogVisible: false });
    expect(wrapper?.find('.v-dialog').exists()).toBe(false);
  });
});
