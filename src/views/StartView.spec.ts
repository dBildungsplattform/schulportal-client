import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import StartView from './StartView.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(StartView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        StartView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('StartView', () => {
  test('it renders the start cards headline', () => {
    expect(wrapper?.find('[data-testid="start-card-headline"]').isVisible()).toBe(true);
  });
});
