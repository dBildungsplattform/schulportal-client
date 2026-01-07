import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { nextTick, type Component } from 'vue';
import OrganisationDelete from './OrganisationDelete.vue';
import { OrganisationsTyp } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(OrganisationDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      organisationId: '1',
      organisationsTyp: OrganisationsTyp.Schule,
      isLoading: false,
      useIconActivator: false,
      headerText: 'Schule löschen',
      confirmationMessage: 'Möchten Sie die Schule wirklich löschen?',
      successMessage: 'Die Schule wurde erfolgreich gelöscht.',
      errorMessage: '',
    },
    global: {
      components: {
        OrganisationDelete: OrganisationDelete as Component,
      },
    },
  });
});

describe('OrganisationDelete', () => {
  test('it opens and closes the dialog via buttons', async () => {
    wrapper?.setProps({ useIconActivator: false });
    wrapper?.find('[data-testid="open-schule-delete-dialog-button"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="schule-delete-confirmation-text"]')).not.toBeNull();

    const cancelDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="cancel-schule-delete-dialog-button"]',
    )[0];
    cancelDeleteButton?.click();
    await nextTick();

    expect(document.querySelector('[data-testid="close-schule-delete-dialog-button"]')).toBeNull();
  });

  test('it opens the dialog via icon activator and closes via layout card', async () => {
    wrapper?.setProps({ useIconActivator: true });
    await nextTick();

    wrapper?.find('[data-testid="open-schule-delete-dialog-icon"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="schule-delete-confirmation-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement = document.querySelector(
      '[data-testid="close-layout-card-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
  });

  test('it deletes an organisation and navigates back to management', async () => {
    wrapper?.setProps({ useIconActivator: false });

    wrapper?.find('[data-testid="open-schule-delete-dialog-button"]').trigger('click');
    await nextTick();

    expect(document.querySelector('[data-testid="schule-delete-confirmation-text"]')).not.toBeNull();

    const deleteButton: HTMLElement | null = document.querySelector<HTMLElement>(
      '[data-testid="schule-delete-button"]',
    );
    deleteButton?.click();
    await wrapper?.setProps({ isLoading: false });
    await nextTick();

    expect(document.querySelector('[data-testid="schule-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="close-schule-delete-success-dialog-button"]',
    )[0];
    closeDialogButton?.click();
    await nextTick();
  });

  test('shows error message in COMPLETE state', async () => {
    wrapper?.find('[data-testid="open-schule-delete-dialog-button"]').trigger('click');
    await nextTick();
    const deleteButton: HTMLElement | null = document.querySelector<HTMLElement>(
      '[data-testid="schule-delete-button"]',
    );
    deleteButton?.click();
    wrapper?.setProps({ isLoading: false });
    await nextTick();
    wrapper?.setProps({ errorMessage: 'Fehler beim Löschen.' });
    await nextTick();
    expect(document.querySelector('[data-testid="schule-delete-error-text"]')).not.toBeNull();
  });
});
