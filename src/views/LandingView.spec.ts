import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import LandingView from './LandingView.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(LandingView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        LandingView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LandingView', () => {
  test('it renders the login card', () => {
    expect(wrapper?.find('[data-testid="login-card"]').isVisible()).toBe(true);
  });

  test('displays maintenance notice when within maintenance period', () => {
    // Mock Date to fall within maintenance period
    vi.useFakeTimers().setSystemTime(new Date('2024-12-07T12:00:00').getTime());

    wrapper = mount(LandingView, {
      attachTo: document.getElementById('app') || '',
      global: {
        mocks: {
          route: {
            fullPath: 'full/path',
          },
        },
      },
    });

    // Check if the maintenance notice is visible
    expect(wrapper.find('[data-testid="landing-maintenance-title"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="landing-maintenance-text"]').exists()).toBe(true);
  });

  test('does not display maintenance notice when outside maintenance period', () => {
    // Mock Date to fall outside maintenance period
    vi.useFakeTimers().setSystemTime(new Date('2024-12-09T12:00:00').getTime());

    wrapper = mount(LandingView, {
      attachTo: document.getElementById('app') || '',
      global: {
        mocks: {
          route: {
            fullPath: 'full/path',
          },
        },
      },
    });

    // Check if the maintenance notice is NOT visible
    expect(wrapper.find('[data-testid="landing-maintenance-title"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="landing-maintenance-text"]').exists()).toBe(false);
  });
});
