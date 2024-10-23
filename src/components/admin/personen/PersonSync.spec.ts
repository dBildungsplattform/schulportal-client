import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonSync from './PersonSync.vue';
import { EmailAddressStatus } from '@/api-client/generated/api';

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
          email: {
            address: 'email',
            status: EmailAddressStatus.Requested,
          }
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

describe('Sync person', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-person-sync-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="person-sync-confirmation-text"]');
    expect(document.querySelector('[data-testid="person-sync-confirmation-text"]')).not.toBeNull();
  });
});
