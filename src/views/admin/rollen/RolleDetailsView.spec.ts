import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleDetailsView from './RolleDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleDetailsView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('RolleDetailsView', () => {
  test('it renders the role details view', () => {
    expect(wrapper?.find('[data-testid="rolle-details-card"]').isVisible()).toBe(true);
  });
});
