import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import BefristungInput from './BefristungInput.vue';

let wrapper: VueWrapper;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  wrapper = mount(BefristungInput, {
    attachTo: document.getElementById('app') || '',
    props: {
      befristungProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      befristungOptionProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      isUnbefristetDisabled: false,
      isBefristungRequired: false,
      nextSchuljahresende: '31.07.2024',
      befristung: undefined,
      befristungOption: undefined,
    },
    global: {
      components: {
        BefristungInput,
      },
    },
  });
});

describe('befristung', () => {
  it('renders the befristung component', () => {
    expect(wrapper.find('[data-testid="befristung-input"]').isVisible()).toBe(true);
  });
});
