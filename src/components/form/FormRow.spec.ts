import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import FormRow from './FormRow.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(FormRow, {
    attachTo: document.getElementById('app') || '',
    props: {
      labelForId: 'test-input',
      errorLabel: "i'm an error",
      label: 'what a label',
    },
    global: {
      components: {
        FormRow,
      },
    },
  });
});

describe('FormRow', () => {
  test.skip('it renders a form row', () => {
    expect(wrapper?.find('[data-testid="test-input"]').isVisible()).toBe(true);
  });
});
