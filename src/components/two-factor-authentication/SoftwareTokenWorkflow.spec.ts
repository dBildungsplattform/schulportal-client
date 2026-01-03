import { mount } from '@vue/test-utils';
import SoftwareTokenWorkflow from './SoftwareTokenWorkflow.vue';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import { nextTick, type Component } from 'vue';

let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;

describe('software token workflow', () => {
  beforeAll(() => {
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
  });

  beforeEach(() => {
    document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

    mount(SoftwareTokenWorkflow, {
      attachTo: document.getElementById('app') || '',
      props: {
        qrCodeImageBase64: 'data:image/png;base64,abc',
      },
      global: {
        components: {
          SoftwareTokenWorkflow: SoftwareTokenWorkflow as Component,
        },
      },
    });
  });

  test('it opens the dialog', () => {
    document.querySelector('[data-testid="software-token-dialog-text"]');
    expect(document.querySelector('[data-testid="software-token-dialog-text"]')).not.toBeNull();
  });

  test('qr code is displayed', () => {
    document.querySelector('[data-testid="software-token-dialog-qr-code"]');
    expect(document.querySelector('[data-testid="software-token-dialog-qr-code"]')).not.toBeNull();
  });

  test('check for error messages', async () => {
    twoFactorAuthenticationStore.errorCode = 'SOFTWARE_TOKEN_INITIALIZATION_ERROR';
    await nextTick();

    document.querySelector('[data-testid="software-token-dialog-error-text"]');
    expect(document.querySelector('[data-testid="software-token-dialog-error-text"]')).not.toBeNull();

    twoFactorAuthenticationStore.errorCode = 'test';
    await nextTick();
    document.querySelector('[data-testid="software-token-dialog-error-text"]');
    expect(document.querySelector('[data-testid="software-token-dialog-error-text"]')).not.toBeNull();

    twoFactorAuthenticationStore.errorCode = '';
    await nextTick();
    document.querySelector('[data-testid="software-token-dialog-error-text"]');
    expect(document.querySelector('[data-testid="software-token-dialog-error-text"]')).toBeNull();
  });
});
