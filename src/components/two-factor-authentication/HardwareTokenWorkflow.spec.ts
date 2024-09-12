import { mount } from '@vue/test-utils';
import HardwareTokenWorkflow from './HardwareTokenWorkflow.vue';

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  mount(HardwareTokenWorkflow, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: 'data:image/png;base64,abc',
      person: {
        person: {
          id: '2',
          name: {
            vorname: 'Albert',
            familienname: 'Test',
          },
          referrer: 'atest',
          personalnummer: '1234',
          isLocked: false,
          lockInfo: null,
        },
      },
    },
    global: {
      components: {
        HardwareTokenWorkflow,
      },
    },
  });
});

describe('hardware token workflow', () => {
  test('it opens the dialog', async () => {
    await document.querySelector('[data-testid="hardware-token-input"]');
    expect(document.querySelector('[data-testid="hardware-token-input"]')).not.toBeNull();
  });
});
