import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleManagementView from './RolleManagementView.vue';
import { setActivePinia, createPinia } from 'pinia';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleManagementView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('RolleManagementView', () => {
  test('it renders the role management view', () => {
    expect(wrapper?.find('[data-testid="role-table"]').isVisible()).toBe(true);
  });
});
