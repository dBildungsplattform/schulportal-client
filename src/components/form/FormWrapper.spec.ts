import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import FormWrapper from './FormWrapper.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(FormWrapper, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      id: 'test-form-wrapper',
      canCommit: true,
      confirmUnsavedChangesAction: () => vi.fn(),
      createButtonLabel: 'what a label',
      discardButtonLabel: 'another label',
      onDiscard: () => vi.fn(),
      onSubmit: () => vi.fn(),
    },
    global: {
      components: {
        FormWrapper,
      },
    },
  });
});

describe('FormWrapper', () => {
  test.skip('it renders the form wrapper', () => {
    expect(wrapper?.find('[data-testid="test-form-wrapper"]').isVisible()).toBe(true);
  });
});
