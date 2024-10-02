import { describe, it, expect, beforeEach } from 'vitest';
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils';
import BefristungInput from './BefristungInput.vue';
// import { nextTick } from 'vue';

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

  it('handles option changes', async () => {
    const schuljahresendeRadioButton: DOMWrapper<HTMLInputElement> = wrapper.find(
      '[data-testid="schuljahresende-radio-button"] input[type="radio"]',
    );
    // const unbefristetRadioButton: DOMWrapper<HTMLInputElement> = wrapper.find('[data-testid="unbefristet-radio-button"] input[type="radio"]');
    // const befristungInput: DOMWrapper<HTMLInputElement> = wrapper.find('[data-testid="befristung-input"] input[type="text"]');

    // console.log(wrapper.props());

    expect(schuljahresendeRadioButton.element.checked).toBe(false);
    // expect(unbefristetRadioButton?.element.checked).toBe(true);

    // await schuljahresendeRadioButton.trigger('click');
    // await nextTick();

    // expect(schuljahresendeRadioButton?.element.checked).toBe(true);
    // expect(unbefristetRadioButton?.element.checked).toBe(false);

    // await befristungInput.setValue('31.07.2024');

    // expect(schuljahresendeRadioButton?.element.checked).toBe(false);
    // expect(unbefristetRadioButton?.element.checked).toBe(false);
  });
});
