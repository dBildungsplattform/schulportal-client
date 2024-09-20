import { VueWrapper, mount } from '@vue/test-utils';
import SelfServiceWorkflow from './SelfServiceWorkflow.vue';

let wrapper: VueWrapper | null = null;

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
});

afterEach(() => {
  wrapper?.unmount();
});
