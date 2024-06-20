import { expect, test, describe, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SpshTooltip from './SpshTooltip.vue';

describe('SpshTooltip Component', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <div id="app"></div>
      </div>
    `;

    mount(SpshTooltip, {
      props: {
        enabledCondition: true,
        disabledText: 'Disabled tooltip text',
        enabledText: 'Enabled tooltip text',
      },
      global: {
        components: {
          SpshTooltip,
        },
      },
      attachTo: '#app', // Ensure the component is attached to the DOM
    });
  });

  test('it renders the tooltip', () => {
    const tooltipElement: Element | null = document.querySelector('[data-testid="tooltip"]');
    expect(tooltipElement).not.toBeNull();
    expect(tooltipElement?.textContent).toBe('Enabled tooltip text');
  });
});
