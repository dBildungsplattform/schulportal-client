import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import SelfServiceWorkflow from './SelfServiceWorkflow.vue';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import { nextTick } from 'vue';

describe('set up two-factor authentication', () => {
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
        mocks: {
          $t: (key: string) => key,
        },
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  test('renders the component with the correct button', () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-self-service-dialog-icon"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('admin.person.twoFactorAuthentication.setUpShort');
  });

  test('walk-through', async () => {
    wrapper?.get('[data-testid="open-2FA-self-service-dialog-icon"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="self-service-dialog-info-text"]');
    await document.querySelector('[data-testid="self-service-dialog-warning-text"]');
    expect(document.querySelector('[data-testid="self-service-dialog-info-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="self-service-dialog-warning-text"]')).not.toBeNull();

    const proceedButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="proceed-two-factor-authentication-dialog"]',
    )[0];
    proceedButton?.click();
    await nextTick();

    expect(twoFactorAuthenticationStore.get2FASoftwareQRCode).toHaveBeenCalled();

    await document.querySelector('[data-testid="self-service-dialog-qr-info-text"]');
    await document.querySelector('[data-testid="software-token-dialog-progress-bar"]');
    expect(document.querySelector('[data-testid="self-service-dialog-qr-info-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="software-token-dialog-progress-bar"]')).not.toBeNull();

    twoFactorAuthenticationStore.qrCode = 'qrCode';

    await nextTick();

    await document.querySelector('[data-testid="software-token-dialog-qr-code"]');
    expect(document.querySelector('[data-testid="software-token-dialog-qr-code"]')).not.toBeNull();

    proceedButton?.click();
    await nextTick();

    await document.querySelector('[data-testid="self-service-otp-entry-info-text"]');
    await document.querySelector('[data-testid="self-service-otp-input"]');
    expect(document.querySelector('[data-testid="self-service-otp-entry-info-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="self-service-otp-input"]')).not.toBeNull();

    const otpInput: HTMLInputElement = document.querySelector(
      '[data-testid="self-service-otp-input"] input',
    ) as HTMLInputElement;

    otpInput.value = '123456';

    const otpevent: Event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    otpInput.dispatchEvent(otpevent);

    const event: KeyboardEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    otpInput.dispatchEvent(event);

    await nextTick();
    expect(twoFactorAuthenticationStore.verify2FAToken).toHaveBeenCalled();
  });

  test('closes the dialog when close button is clicked', async () => {
    wrapper?.get('[data-testid="open-2FA-self-service-dialog-icon"]').trigger('click');
    await nextTick();

    const originalCloseButton: Element | null = document.querySelector(
      '[data-testid="close-two-factor-authentication-dialog"]',
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
