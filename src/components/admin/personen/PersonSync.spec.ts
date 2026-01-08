import { VueWrapper, mount } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { expect, test } from 'vitest';
import { nextTick, type Component } from 'vue';
import PersonSync from './PersonSync.vue';

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
      isLoading: false,
      disabled: false,
      errorCode: '',
      person: {
        person: DoFactory.getPerson(),
      },
    },
    global: {
      components: {
        PersonSync: PersonSync as Component,
      },
    },
  });
});

describe('PersonSync', () => {
  test('it opens and closes the dialog', async () => {
    await wrapper?.get('[data-testid="open-person-sync-dialog-button"]').trigger('click');
    document.querySelector('[data-testid="person-sync-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-sync-confirmation-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement = document.querySelector(
      '[data-testid="close-layout-card-button"]',
    ) as HTMLElement;
    closeDialogButton.click();
  });

  test('it shows and closes the success dialog', async () => {
    await wrapper?.get('[data-testid="open-person-sync-dialog-button"]').trigger('click');
    document.querySelector('[data-testid="person-sync-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-sync-confirmation-text"]')).not.toBeNull();

    const syncPersonButton: HTMLElement = document.querySelector('[data-testid="person-sync-button"]') as HTMLElement;
    syncPersonButton.click();
    await nextTick();
  });
});
