import { expect, test } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';

import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import KlassenManagementView from './KlassenManagementView.vue';
import { nextTick } from 'vue';

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

  test('it calls watchers for selected Schule and klasse with value', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('9a');
  });

  test('it resets field Klasse when Schule is reset after being selected', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    await organisationAutocomplete?.setValue(null);
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('');
  });
});
