import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonSync from './PersonSync.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonSync, {
    attachTo: document.getElementById('app') || '',
    props: {
      disabled: false,
      errorCode: '',
      person: {
        person: {
          id: '2',
          name: {
            vorname: 'Albert',
            familienname: 'Test',
          },
          referrer: 'atest',
          personalnummer: null,
          isLocked: null,
          lockInfo: null,
          revision: '1',
          lastModified: '2024-05-22',
        },
      },
    },
    global: {
      components: {
        PersonDelete: PersonSync,
      },
    },
  });
});

describe('PersonSync', () => {
  test('it opens and closes the dialog', async () => {
    wrapper?.get('[data-testid="open-person-sync-dialog-button"]').trigger('click');
    await document.querySelector('[data-testid="person-sync-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-sync-confirmation-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement = (await document.querySelector(
      '[data-testid="close-layout-card-button"]',
    )) as HTMLElement;
    closeDialogButton.click();
  });

  test('it shows and closes the success dialog', async () => {
    wrapper?.get('[data-testid="open-person-sync-dialog-button"]').trigger('click');
    await document.querySelector('[data-testid="person-sync-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-sync-confirmation-text"]')).not.toBeNull();

    const syncPersonButton: HTMLElement = (await document.querySelector(
      '[data-testid="person-sync-button"]',
    )) as HTMLElement;
    syncPersonButton.click();
    await nextTick();
  });
});
