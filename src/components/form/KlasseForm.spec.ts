import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseForm from './KlasseForm.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlasseForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      onHandleConfirmUnsavedChanges: () => '',
      onHandleDiscard: () => '',
      onShowDialogChange: (value: boolean | undefined) => value,
      onSubmit: () => '',
    },
    global: {
      components: {
        KlasseForm,
      },
    },
  });
});

describe('RolleForm', () => {
  test('it renders the Klasse form', () => {
    expect(wrapper?.find('[data-testid="klasse-form"]').isVisible()).toBe(true);
  });
});
