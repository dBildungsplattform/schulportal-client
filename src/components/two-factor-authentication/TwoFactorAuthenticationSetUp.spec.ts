import { VueWrapper, mount } from '@vue/test-utils';
import TwoFactorAuthenticationSetUp from './TwoFactorAuthenticationSetUp.vue';

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
    await document.querySelector('[data-testid="software-token-option"]');
    await document.querySelector('[data-testid="hardware-token-option"]');
    expect(document.querySelector('[data-testid="software-token-option"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="hardware-token-option"]')).not.toBeNull();
  });
});

afterEach(() => {
  wrapper?.unmount();
});
