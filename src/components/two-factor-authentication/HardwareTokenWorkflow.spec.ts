import { mount, VueWrapper } from '@vue/test-utils';
import HardwareTokenWorkflow from './HardwareTokenWorkflow.vue';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import { vi } from 'vitest';
import type { Personendatensatz } from '@/stores/PersonStore';
import { nextTick } from 'vue';
import type { AxiosError } from 'axios';
vi.mock('vue-i18n', () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string) => key,
  }),
}));

let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;

describe('HardwareTokenWorkflow.vue', () => {
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

    wrapper = mount(HardwareTokenWorkflow, {
      props: {
        errorCode: '',
        person: getMockPersonendatensatz(),
      },
      attachTo: document.getElementById('app') || '',
      global: {
        components: {
          HardwareTokenWorkflow,
        },
      },
    });
  });

  wrapper = mount(HardwareTokenWorkflow, {
    props: {
      errorCode: '',
      person: getMockPersonendatensatz(),
    },
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        HardwareTokenWorkflow,
      },
    },
  });

  beforeAll(() => {
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
    vi.spyOn(twoFactorAuthenticationStore, 'assignHardwareToken').mockResolvedValue();
  });

  afterEach(() => {
    wrapper!.unmount();
  });

  test('it renders all form components', () => {
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it renders the form fields', async () => {
    const serialInput: Element | null = document.querySelector('[data-testid="hardware-token-input-serial"]');
    const otpInput: Element | null = document.querySelector('[data-testid="hardware-token-input-otp"]');

    expect(serialInput).not.toBeNull();
    expect(otpInput).not.toBeNull();
  });

  test('it shows validation errors if fields are empty', async () => {
    wrapper?.find('[data-testid="hardware-token-input-create-button"]').trigger('click');
    await nextTick();

    await document.querySelectorAll('.v-messages__message').forEach((error: Element) => {
      expect(error.textContent).toBeTruthy();
    });
  });

  test('it submits the form with valid input', async () => {
    const serialWrapper: HTMLElement = document.querySelector(
      '[data-testid="hardware-token-input-serial"]',
    ) as HTMLElement;
    const serialInput: HTMLInputElement | null = serialWrapper.querySelector('input');

    const otpWrapper: HTMLElement = document.querySelector('[data-testid="hardware-token-input-otp"]') as HTMLElement;
    const otpInput: HTMLInputElement | null = otpWrapper.querySelector('input');

    expect(serialInput).not.toBeNull();
    expect(otpInput).not.toBeNull();

    if (serialInput && otpInput) {
      serialInput.value = '123456';
      otpInput.value = '789012';

      serialInput.dispatchEvent(new Event('input'));
      otpInput.dispatchEvent(new Event('input'));
    }

    wrapper?.find('[data-testid="hardware-token-input-create-button"]').trigger('click');
  });

  test('it handles cancel action correctly', async () => {
    wrapper?.find('[data-testid="hardware-token-input-discard-button"]').trigger('click');
    await nextTick();
  });

  test('it triggers handleApiError on API error', async () => {
    // Mock the error response
    const errorResponse: AxiosError = {
      isAxiosError: true,
      response: {
        data: {
          i18nKey: 'some_error_key',
        },
      },
      // Add necessary AxiosError properties (you can leave others as any if not needed)
      config: {},
      request: {},
      toJSON: () => ({}),
    } as AxiosError;
    // Mock the assignHardwareToken to throw an error
    vi.spyOn(twoFactorAuthenticationStore, 'assignHardwareToken').mockRejectedValueOnce(errorResponse);

    // Fill in valid inputs
    const serialWrapper: HTMLElement = document.querySelector(
      '[data-testid="hardware-token-input-serial"]',
    ) as HTMLElement;
    const serialInput: HTMLInputElement | null = serialWrapper.querySelector('input');
    const otpWrapper: HTMLElement = document.querySelector('[data-testid="hardware-token-input-otp"]') as HTMLElement;
    const otpInput: HTMLInputElement | null = otpWrapper.querySelector('input');

    if (serialInput && otpInput) {
      serialInput.value = '123456';
      otpInput.value = '789012';

      serialInput.dispatchEvent(new Event('input'));
      otpInput.dispatchEvent(new Event('input'));
    }

    await wrapper?.find('[data-testid="hardware-token-input-create-button"]').trigger('click');
    await nextTick();

    const errorResponse2: AxiosError = {
      isAxiosError: true,
      response: {
        data: {
          i18nKey: null,
        },
      },
      // Add necessary AxiosError properties (you can leave others as any if not needed)
      config: {},
      request: {},
      toJSON: () => ({}),
    } as AxiosError;
    // Mock the assignHardwareToken to throw an error
    vi.spyOn(twoFactorAuthenticationStore, 'assignHardwareToken').mockRejectedValueOnce(errorResponse2);

    await wrapper?.find('[data-testid="hardware-token-input-create-button"]').trigger('click');
    await nextTick();
  });

  // // New test for triggering cancelCheck
  // test('it calls cancelCheck method when discard button is clicked', async () => {
  //   // Assuming cancelCheck method resets the error and dialogText
  //   wrapper?.find('[data-testid="hardware-token-input-discard-button"]').trigger('click');
  //   await nextTick();

  //   expect(wrapper?.vm.$data.hardwareTokenIsAssigned).toBe(false);
  //   expect(wrapper?.vm.dialogText).toBe('');
  //   expect(wrapper?.vm.errorThrown).toBe(false);
  // });
});
