import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleForm from './RolleForm.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      onHandleConfirmUnsavedChanges: () => '',
      onHandleDiscard: () => '',
      onShowDialogChange: (value: boolean | undefined) => value,
      onSubmit: () => '',
    },
    global: {
      components: {
        RolleForm,
      },
    },
  });
});

describe('RolleForm', () => {
  test('it renders the rolle form', () => {
    expect(wrapper?.find('[data-testid="rolle-form"]').isVisible()).toBe(true);
  });
});
