import { expect, test } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';

import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import KlassenManagementView from './KlassenManagementView.vue';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
beforeEach(() => {
  mockadapter.reset();

  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlassenManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlassenManagementView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('KlassenManagementView', () => {
  test('it renders the klassen management table', () => {
    expect(wrapper?.find('[data-testid="klasse-table"]').isVisible()).toBe(true);
  });
});
