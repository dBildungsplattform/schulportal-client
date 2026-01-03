import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test, type Mock, type MockInstance } from 'vitest';
import PasswordOutput from './PasswordOutput.vue';
import * as print from '@/utils/print';
import type { Component } from 'vue';

const writeText: Mock = vi.fn();
const mountComponent = (props: Record<string, unknown> = {}): ReturnType<typeof mount<typeof PasswordOutput>> => {
  return mount(PasswordOutput, {
    attachTo: document.getElementById('app') || '',
    props: {
      password: 'password',
      ...props,
    },
    global: {
      components: {
        PasswordOutput: PasswordOutput as Component,
      },
    },
  });
};

vi.mock('@/utils/print', () => ({
  print: vi.fn(),
}));
Object.assign(navigator, {
  clipboard: {
    writeText,
  },
});

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  vi.clearAllMocks();
});

describe('PasswordOutput', () => {
  describe.each([[true], [false]])('when showPrintIcon is %s', (showPrintIcon: boolean) => {
    test('it renders the password output', () => {
      const wrapper: VueWrapper = mountComponent({ showPrintIcon }) as VueWrapper;
      expect(wrapper.find('[data-testid="password-output-field"]').isVisible()).toBe(true);
      expect(wrapper.find('[data-testid="print-password-icon"]').exists()).toBe(showPrintIcon);
    });

    test('it copies the password', () => {
      const wrapper: VueWrapper = mountComponent({ showPrintIcon }) as VueWrapper;
      expect(wrapper.find('[data-testid="copy-password-icon"]').trigger('click'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });

  test('it calls print, when the icon is clicked', async () => {
    const mockFunction: MockInstance = vi.spyOn(print, 'print');
    const fakePassword: string = 'fake-password';
    const wrapper: VueWrapper = mountComponent({ password: fakePassword, showPrintIcon: true }) as VueWrapper;
    await wrapper.find('[data-testid="print-password-icon"]').trigger('click');
    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith('admin.person.password', fakePassword);
  });
});
