import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { nextTick } from 'vue';
import KlasseDelete from './KlasseDelete.vue';

let wrapper: VueWrapper | null = null;

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlasseDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      isLoading: false,
      klassenId: '1',
      klassenname: '1A',
      schulname: 'schule',
      useIconActivator: false,
    },
    global: {
      components: {
        KlasseDelete,
      },
    },
  });
});

describe('KlasseDelete', () => {
  test('it opens and closes the dialog via buttons', async () => {
    wrapper?.setProps({ useIconActivator: false });
    wrapper?.find('[data-testid="open-klasse-delete-dialog-button"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-klasse-delete-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="close-klasse-delete-dialog-button"]')).toBeNull();
  });

  test('it opens the dialog via icon activator and closes via layout card', async () => {
    wrapper?.setProps({ useIconActivator: true });
    await nextTick();

    wrapper?.find('[data-testid="open-klasse-delete-dialog-icon"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement = document.querySelector(
      '[data-testid="close-layout-card-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
  });

  test('it deletes a klasse and navigates back to management', async () => {
    wrapper?.setProps({ useIconActivator: false });

    wrapper?.find('[data-testid="open-klasse-delete-dialog-button"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const klasseDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="klasse-delete-button"]',
    )[0];
    klasseDeleteButton?.click();
    await wrapper?.setProps({ isLoading: false });
    await nextTick();

    expect(document.querySelector('[data-testid="klasse-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="close-klasse-delete-success-dialog-button"]',
    )[0];
    closeDialogButton?.click();
    await nextTick();
  });
});
