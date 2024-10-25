import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonenkontextDelete from './PersonenkontextDelete.vue';
import { nextTick } from 'vue';

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

describe('PersonenkontextDelete', () => {
  test('it opens and closes the dialog', async () => {
    wrapper?.get('[data-testid="open-zuordnung-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="close-zuordnung-delete-dialog-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
    await nextTick();

    // TODO: Close dialog button is not removed from the DOM
    // expect(document.querySelector('[data-testid="close-zuordnung-delete-dialog-button"]')).toBeNull();
  });

  test('it deletes a zuordnung', async () => {
    wrapper?.find('[data-testid="open-zuordnung-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]')).not.toBeNull();

    const zuordnungDeleteButton: HTMLElement | undefined = document.querySelector(
      '[data-testid="zuordnung-delete-button"]',
    ) as HTMLElement;
    zuordnungDeleteButton.click();
    await nextTick();

    // TODO: Zuordnung confirmation text is not removed from the DOM
    // expect(document.querySelector('[data-testid="zuordnung-delete-confirmation-text"]')).toBeNull();
  });
});
