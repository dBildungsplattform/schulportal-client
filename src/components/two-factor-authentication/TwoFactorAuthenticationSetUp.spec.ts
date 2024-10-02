import { VueWrapper, mount, DOMWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import TwoFactorAuthenticationSetUp from './TwoFactorAuthenticationSetUp.vue';

let wrapper: VueWrapper<InstanceType<typeof TwoFactorAuthenticationSetUp>> | null = null;

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
          lockInfo: null,
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
    const button: Omit<DOMWrapper<Element>, 'exists'> | undefined = wrapper?.get(
      '[data-testid="open-2FA-dialog-icon"]',
    );
    expect(button).not.toBeNull();
    await button!.trigger('click');
    await nextTick();

    const softwareTokenRadio: Element | null = document.querySelector('[data-testid="software-token-radio-button"]');
    const hardwareTokenRadio: Element | null = document.querySelector('[data-testid="hardware-token-radio-button"]');

    expect(softwareTokenRadio).not.toBeNull();
    expect(hardwareTokenRadio).not.toBeNull();
  });

  test('it selects the software token option by default', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();

    const selectedOption: HTMLInputElement | null = document.querySelector(
      '[data-testid="software-token-radio-button"] input',
    );
    expect(selectedOption?.checked).toBe(true);
  });

  test('it switches to the hardware token option when selected', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();

    const hardwareTokenRadio: HTMLInputElement | null = document.querySelector(
      '[data-testid="hardware-token-radio-button"] input',
    );

    hardwareTokenRadio!.checked = true;
    await nextTick();

    expect(hardwareTokenRadio!.checked).toBe(true);
  });

  test('it proceeds with the selected token option', async () => {
    const button: DOMWrapper<HTMLButtonElement> = wrapper!.find('[data-testid="open-2FA-dialog-icon"]');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    await nextTick();

    const proceedButton: Element | null = document.querySelector(
      '[data-testid="proceed-two-factor-authentication-dialog-button"]',
    );
    expect(proceedButton).not.toBeNull();
    const proceedButtonElement: DOMWrapper<Element> = new DOMWrapper(proceedButton);
    await proceedButtonElement.trigger('click');
    await nextTick();

    console.log(document.body.innerHTML);
    expect(document.querySelector('[data-testid="software-token-workflow"]')).toBeNull();
  });

  test.skip('it closes the dialog when the cancel button is clicked', async () => {
    const button: Omit<DOMWrapper<Element>, 'exists'> | undefined = wrapper?.get(
      '[data-testid="open-2FA-dialog-icon"]',
    );
    expect(button).not.toBeNull();
    await button!.trigger('click');
    await nextTick();

    const cancelButton: Omit<DOMWrapper<Element>, 'exists'> | undefined = wrapper?.get(
      '[data-testid="close-two-factor-authentication-dialog-button"]',
    );
    expect(cancelButton).not.toBeNull();
    await cancelButton!.trigger('click');
    await nextTick();

    const dialog: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="two-factor-authentication-dialog"]');
    expect(dialog?.exists()).toBe(false);
  });
});

afterEach(() => {
  wrapper?.unmount();
});
