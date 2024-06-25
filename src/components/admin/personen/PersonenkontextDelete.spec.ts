import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonenkontextDelete from './PersonenkontextDelete.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonenkontextDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      disabled: false,
      zuordnungCount: 0,
    },
    global: {
      components: {
        PersonenkontextDelete,
      },
    },
  });
});

describe('Delete zuordnung', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-zuordnung-delete-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]')).not.toBeNull();
  });
});
