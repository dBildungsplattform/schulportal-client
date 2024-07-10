import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import TwoFactorAuthenticationSetUp from './TwoFactorAuthenticationSetUp.vue';
// import { VDialog } from 'vuetify/lib/components/index.mjs'

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
      password: 'qwertzuiop',
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
    await document.querySelector('[data-testid="two-factor-authentication-info-text"]');
    expect(document.querySelector('[data-testid="two-factor-authentication-info-text"]')).not.toBeNull();
  });

})
