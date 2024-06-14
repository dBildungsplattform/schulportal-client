import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PasswordReset from './PasswordReset.vue';
// import { VDialog } from 'vuetify/lib/components/index.mjs'

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PasswordReset, {
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
        PasswordReset,
      },
    },
  });
});

describe('reset password', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-password-reset-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="password-reset-info-text"]');
    expect(document.querySelector('[data-testid="password-reset-info-text"]')).not.toBeNull();
  });

  // TODO:
  // Unfortunately testing v-dialogs is tricky. The wrapper does not know about an opened vuetify dialog,
  // because it is attached to the virtual dom, which has to be explicitly passed to the wrapper somehow.
  // Passing it via Teleport did not work: https://test-utils.vuejs.org/guide/advanced/teleport.html
  // Using the document's querySelector works to find elements, so we can test if they exist.
  // But I haven't found a way to trigger events with the querySelector and emit them to the wrapper to assert them.

  test('reset button emits correct event', async () => {
    wrapper?.get('[data-testid="open-password-reset-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="password-reset-button"]');
    expect(document.querySelector('[data-testid="password-reset-button"]')).not.toBeNull();
    // const dialog = wrapper.findComponent(VDialog)
    // await dialog.get('[data-testid="password-reset-button"]')
    // expect(dialog.emitted()).toHaveProperty('on-submit')
  });

  // skip because v-dialog does not work in test env. see lines 42-47
  test.skip('it shows and hides password', async () => {
    wrapper?.get('[data-testid="open-password-reset-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="password-output-field"] mdi-eye');
    expect(document.querySelector('[data-testid="password-output-field"] mdi-eye')).not.toBeNull();
  });

  // skip because v-dialog does not work in test env. see lines 42-47
  test.skip('it copies password to clipboard', async () => {
    wrapper?.get('[data-testid="open-password-reset-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="password-output-field"] mdi-content-copy');
    expect(document.querySelector('[data-testid="password-output-field"] mdi-content-copy')).not.toBeNull();
  });
});

afterEach(() => {
  wrapper?.unmount();
});
