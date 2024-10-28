import { VueWrapper, DOMWrapper, mount } from '@vue/test-utils';
import { describe, beforeEach, test, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import TokenReset from '@/components/two-factor-authentication/TokenReset.vue';
import {
  TokenKind,
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import type { Personendatensatz } from '@/stores/PersonStore';
import { EmailAddressStatus } from '@/api-client/generated/api';

vi.mock('vue-i18n', () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string) => key,
  }),
}));

let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;

describe('TokenResetComponent', () => {
  let wrapper: VueWrapper | null = null;

  function getMockPersonendatensatz(): Personendatensatz {
    return {
      person: {
        id: '123456',
        name: {
          familienname: 'Vimes',
          vorname: 'Susan',
        },
        referrer: '6978',
        personalnummer: '9183756',
        isLocked: false,
        userLock: null,
        revision: '1',
        lastModified: '2024-12-22',
        email: {
          address: 'email',
          status: EmailAddressStatus.Requested,
        },
      },
    };
  }

  beforeAll((): void => {
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
  });

  beforeEach((): void => {
    document.body.innerHTML = `
        <div>
        <div id="app"></div>
        </div>
    `;
    twoFactorAuthenticationStore.errorCode = '';
    twoFactorAuthenticationStore.loading = false;
    twoFactorAuthenticationStore.hasToken = true;
    twoFactorAuthenticationStore.required = true;

    wrapper = mount(TokenReset, {
      props: {
        errorCode: '',
        disabled: false,
        person: getMockPersonendatensatz(),
        tokenType: TokenKind.software,
      },
      attachTo: document.getElementById('app') || '',
      global: {
        components: {
          TokenReset,
        },
      },
    });
  });

  afterEach((): void => {
    wrapper!.unmount();
  });

  test('displays success message for hardware token reset', async (): Promise<void> => {
    await wrapper?.setProps({ tokenType: TokenKind.hardware });
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    await button.trigger('click');
    await nextTick();

    const resetButton: HTMLElement = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    ) as HTMLElement;
    await resetButton.click();
    await nextTick();

    const dialogText: HTMLElement = document.querySelector('[data-testid="dialog-text"]') as HTMLElement;
    expect(dialogText).not.toBeNull();
    expect(dialogText.textContent).toBe('admin.person.twoFactorAuthentication.tokenResetSuccessHardware');
  });

  test('closes dialog when `onCloseClicked` is triggered', async (): Promise<void> => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    await button.trigger('click');
    await nextTick();

    const closeButton: HTMLElement = document.querySelector(
      '[data-testid="close-two-way-authentification-dialog-button"]',
    ) as HTMLElement;
    await closeButton.click();
    await nextTick();

    const overlayContent: HTMLElement = document.querySelector('.v-overlay__content') as HTMLElement;
    expect(getComputedStyle(overlayContent).display).toBe('none');
  });

  test('closes dialog when close button in dialog actions is clicked', async (): Promise<void> => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    await button.trigger('click');
    await nextTick();

    const actionCloseButton: HTMLElement = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    ) as HTMLElement;
    await actionCloseButton.click();
    await nextTick();

    const overlayContent: HTMLElement = document.querySelector('.v-overlay__content') as HTMLElement;
    expect(getComputedStyle(overlayContent).display).toBe('none');
  });

  test('displays error message if errorCode is present', async (): Promise<void> => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    await button.trigger('click');
    await nextTick();

    const resetButton: HTMLElement = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    ) as HTMLElement;
    twoFactorAuthenticationStore.errorCode = 'connection_error';
    await resetButton.click();
    await nextTick();

    const dialogText: HTMLElement = document.querySelector('[data-testid="dialog-text"]') as HTMLElement;
    expect(dialogText).not.toBeNull();
    expect(dialogText.textContent).toContain('admin.person.twoFactorAuthentication.errors.connection_error');
  });

  test('closes dialog when clicking stop button in dialog actions', async (): Promise<void> => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    await button.trigger('click');
    await nextTick();

    const stopCloseButton: HTMLElement = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    ) as HTMLElement;
    await stopCloseButton.click();
    await nextTick();

    const overlayContent: HTMLElement = document.querySelector('.v-overlay__content') as HTMLElement;
    expect(getComputedStyle(overlayContent).display).toBe('none');
  });
});
