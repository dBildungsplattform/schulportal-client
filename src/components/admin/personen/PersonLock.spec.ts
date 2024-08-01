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

afterEach(() => {
  wrapper?.unmount();
});
