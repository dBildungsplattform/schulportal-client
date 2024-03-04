import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import CreationForm from './CreationForm.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(CreationForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      id: 'test-creation-form',
      confirmUnsavedChangesAction: () => vi.fn(),
      createButtonLabel: 'what a label',
      discardButtonLabel: 'another label',
      onDiscard: () => vi.fn(),
      onSubmit: () => vi.fn(),
      resetForm: () => vi.fn(),
    },
    global: {
      components: {
        CreationForm,
      },
    },
  });
});

describe('CreationForm', () => {
  test.skip('it renders the creation form', () => {
    expect(wrapper?.find('[data-testid="test-creation-form"]').isVisible()).toBe(true);
  });
});
