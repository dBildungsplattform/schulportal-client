import { expect, test, type Mock } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PasswordOutput from './PasswordOutput.vue';

const writeText: Mock = vi.fn(async () => {});
const mountComponent = (props: Record<string, unknown> = {}): VueWrapper => {
  return mount(PasswordOutput, {
    attachTo: document.getElementById('app') || '',
    props: {
      password: 'password',
      ...props,
    },
    global: {
      components: {
        PasswordOutput,
      },
    },
  });
};

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
      const wrapper: VueWrapper = mountComponent({ showPrintIcon });
      expect(wrapper.find('[data-testid="password-output-field"]').isVisible()).toBe(true);
      expect(wrapper.find('[data-testid="print-password-icon"]').exists()).toBe(showPrintIcon);
    });

    test('it copies the password', () => {
      const wrapper: VueWrapper = mountComponent({ showPrintIcon });
      expect(wrapper.find('[data-testid="copy-password-icon"]').trigger('click'));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });
});
