import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import ResultTable from './ResultTable.vue';
import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
    `;
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [{ title: 'title', key: 'key', align: 'start' }];

  wrapper = mount(ResultTable, {
    attachTo: document.getElementById('app') || '',
    props: {
      items: [],
      itemsPerPage: 10,
      loading: false,
      password: 'qwertzuiop',
      totalItems: 25,
      headers: headers,
      header: 'header',
      itemValuePath: 'id',
      disableRowClick: false,
    },
    global: {
      components: {
        ResultTable,
      },
    },
  });
});

describe('result table', () => {
  test('it renders the result table', () => {
    expect(wrapper?.get('[data-testid="result-table"]')).not.toBeNull();
  });
});
