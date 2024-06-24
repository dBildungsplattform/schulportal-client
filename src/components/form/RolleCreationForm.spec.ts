import { expect, test, type Mock } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleCreationForm from './RolleCreationForm.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleCreationForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      // put props here
    },
    global: {
      components: {
        RolleCreationForm,
      },
    },
  });
});

describe('RolleCreationForm', () => {
  test('it renders the rolle creation form', () => {
    expect(wrapper?.find('[data-testid="rolle-creation-form"]').isVisible()).toBe(true);
  });
});
