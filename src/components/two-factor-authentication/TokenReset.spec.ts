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
        lockInfo: null,
        revision: '1',
        lastModified: '2024-12-22',
      },
    };
  }

  beforeAll(() => {
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
  });

  beforeEach(() => {
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

  afterEach(() => {
    wrapper!.unmount();
  });

  test('renders the component with the correct button', () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('admin.person.twoFactorAuthentication.tokenReset');
  });

  test('disables the button when `disabled` prop is true', async () => {
    await wrapper?.setProps({ disabled: true });
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  test('opens the 2FA dialog when button is clicked', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button).not.toBeNull();
    await button!.trigger('click');
    await nextTick();
    const dialog: Element | null = document.querySelector('.v-dialog');
    const overlay: Element | null = document.querySelector('.v-overlay-container');
    expect(dialog).not.toBeNull();
    expect(overlay).not.toBeNull();
    const closeButton: Element | null | undefined = dialog?.querySelector(
      '[data-testid="close-two-way-authentification-dialog-button"]',
    );
    expect(closeButton).not.toBeNull();
  });

  test('calls the resetToken function when the token reset button is clicked', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();
    const resetButton: HTMLButtonElement | null = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    );
    expect(resetButton).not.toBeNull();
    const resetButtonWrapper: DOMWrapper<HTMLButtonElement> = new DOMWrapper(resetButton!);
    expect(resetButtonWrapper.exists()).toBe(true);
    await resetButtonWrapper.trigger('click');
    await nextTick();
    expect(twoFactorAuthenticationStore.resetToken).toHaveBeenCalledWith(getMockPersonendatensatz().person.id);
  });

  test('displays error message if errorCode is present', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();
    const resetButton: HTMLButtonElement | null = document.querySelector(
      '[data-testid="two-way-authentification-set-up-button"]',
    );
    expect(resetButton).not.toBeNull();
    const resetButtonWrapper: DOMWrapper<HTMLButtonElement> = new DOMWrapper(resetButton!);
    expect(resetButtonWrapper.exists()).toBe(true);
    twoFactorAuthenticationStore.errorCode = 'connection_error';
    await resetButtonWrapper.trigger('click');
    await nextTick();
    await nextTick();
    const dialogText: Element | null = document.querySelector('[data-testid="dialog-text"]');
    expect(dialogText).not.toBeNull();
  });

  test('closes the dialog when close button is clicked', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();
    const originalCloseButton: Element | null = document.querySelector(
      '[data-testid="close-two-way-authentification-dialog-button"]',
    );
    expect(originalCloseButton).not.toBeNull();
    const originalCloseButtonWrapper: DOMWrapper<Element> = new DOMWrapper(originalCloseButton!);
    await originalCloseButtonWrapper.trigger('click');
    await nextTick();
    const overlayContent: Element | null = document.querySelector('.v-overlay__content');
    expect(overlayContent).not.toBeNull();
    expect(getComputedStyle(overlayContent!).display).toBe('none');
  });
});
