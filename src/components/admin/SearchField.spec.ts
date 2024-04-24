import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SearchField from './SearchField.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SearchField, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SearchField,
      },
    },
  });
});

describe('SearchField', () => {
  test.skip('it renders the search field', () => {
    expect(wrapper?.find('[data-testid="apply-search-filter-button"]').isVisible()).toBe(true);
  });

});
