import { VueWrapper, mount } from '@vue/test-utils';
import TwoFactorAuthenticationSetUp from './TwoFactorAuthenticationSetUp.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(TwoFactorAuthenticationSetUp, {
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
        TwoFactorAuthenticationSetUp,
      },
    },
  });
});

describe('set up two-factor authentication', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-2FA-dialog-icon"]').trigger('click');
    await nextTick();
    expect(document.querySelector('[data-testid="software-token-radio-button"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="hardware-token-radio-button"]')).not.toBeNull();
  });
});

afterEach(() => {
  wrapper?.unmount();
});
