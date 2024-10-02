import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonDelete from './PersonDelete.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonDelete, {
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
          userLock: null,
          revision: '1',
          lastModified: '2024-05-22',
        },
      },
    },
    global: {
      components: {
        PersonDelete,
      },
    },
  });
});

describe('Delete person', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-person-delete-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="person-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-delete-confirmation-text"]')).not.toBeNull();
  });
});
