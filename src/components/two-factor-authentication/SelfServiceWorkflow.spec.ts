import { VueWrapper, mount } from '@vue/test-utils';
import SelfServiceWorkflow from './SelfServiceWorkflow.vue';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;

beforeAll(() => {
  twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
});

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SelfServiceWorkflow, {
    attachTo: document.getElementById('app') || '',
    props: {
      personId: '123',
    },
    global: {
      components: {
        SelfServiceWorkflow,
      },
    },
  });
});

describe('set up two-factor authentication', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-2FA-self-service-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="self-service-dialog-info-text"]');
    await document.querySelector('[data-testid="self-service-dialog-warning-text"]');
    expect(document.querySelector('[data-testid="self-service-dialog-info-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="self-service-dialog-warning-text"]')).not.toBeNull();
  });

  test('check for error messages', async () => {
    wrapper?.get('[data-testid="open-2FA-self-service-dialog-icon"]').trigger('click');
    await nextTick();

    const proceedButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="proceed-two-factor-authentication-dialog"]',
    )[0];
    proceedButton?.click();
    twoFactorAuthenticationStore.errorCode = 'error';
    await nextTick();

    await document.querySelector('[data-testid="self-service-token-init-error-text"]');
    expect(document.querySelector('[data-testid="self-service-token-init-error-text"]')).not.toBeNull();

    twoFactorAuthenticationStore.errorCode = '';
    proceedButton?.click();
    twoFactorAuthenticationStore.errorCode = 'error';

    await nextTick();

    await document.querySelector('[data-testid="self-service-token-verify-error-text"]');
    expect(document.querySelector('[data-testid="self-service-token-verify-error-text"]')).not.toBeNull();
  });
});

afterEach(() => {
  wrapper?.unmount();
});
