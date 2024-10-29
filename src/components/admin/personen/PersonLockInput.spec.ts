import { describe, it, expect, beforeEach, vi } from 'vitest';
import PersonLockInput from './PersonLockInput.vue'; // Replace with actual component name
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('PersonLockInput', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(PersonLockInput, {
      props: {
        befristungProps: {
          error: false,
          'error-messages': [],
          onBlur: () => vi.fn(),
          onChange: () => vi.fn(),
          onInput: () => vi.fn(),
        },
        befristung: '2024-10-23',
        isUnbefristet: false,
      },
      global: {
        mocks: {
          $t: (key: string) => key, // Mock translation function
        },
      },
    });
  });

  it('renders the radio buttons', () => {
    expect(wrapper.find('[data-testid="unbefristet-radio-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="befristet-radio-button"]').exists()).toBe(true);
  });

  it('handles option changes', async () => {
    const befristetRadioButton: DOMWrapper<HTMLInputElement> = wrapper.find(
      '[data-testid="befristet-radio-button"] input[type="radio"]',
    );
    expect(befristetRadioButton.isVisible()).toBe(true);
    const unbefristetRadioButton: DOMWrapper<HTMLInputElement> = wrapper.find(
      '[data-testid="unbefristet-radio-button"] input[type="radio"]',
    );
    expect(unbefristetRadioButton.isVisible()).toBe(true);
    const radioGroup: DOMWrapper<HTMLInputElement> = wrapper.find('[data-testid="befristung-radio-group"]');
    expect(radioGroup.isVisible()).toBe(true);

    expect(befristetRadioButton.element.checked).toBe(false);
    expect(unbefristetRadioButton.element.checked).toBe(true);

    await befristetRadioButton.trigger('click');
    await nextTick();

    expect(befristetRadioButton.element.checked).toBe(true);
    expect(unbefristetRadioButton.element.checked).toBe(false);

    //TODO: DomWrapper empty, and watcher not called even though Radio-Buttons value changes -> Why?
  });
});
