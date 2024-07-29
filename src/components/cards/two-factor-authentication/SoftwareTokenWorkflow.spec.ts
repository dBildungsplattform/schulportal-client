import { mount } from '@vue/test-utils';
import SoftwareTokenWorkflow from './SoftwareTokenWorkflow.vue';

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
        SoftwareTokenWorkflow,
      },
    },
  });
});

describe('software token workflow', () => {
  test('it opens the dialog', async () => {
    await document.querySelector('[data-testid="software-token-dialog-text"]');
    expect(document.querySelector('[data-testid="software-token-dialog-text"]')).not.toBeNull();
  });
  test('qr code is displayed', async () => {
    await document.querySelector('[data-testid="software-token-dialog-qr-code"]');
    expect(document.querySelector('[data-testid="software-token-dialog-qr-code"]')).not.toBeNull();
  });
});
