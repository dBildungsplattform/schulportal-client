import { expect, test } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';

import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import KlassenManagementView from './KlassenManagementView.vue';
import { nextTick } from 'vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();

organisationStore.allKlassen = [
  {
    id: '1',
    name: '9a',
    kennung: '9356494-9a',
    namensergaenzung: 'Klasse',
    kuerzel: 'aehg',
    typ: 'KLASSE',
    administriertVon: '1',
  },
  {
    id: '1',
    name: '9b',
    kennung: '9356494-9b',
    namensergaenzung: 'Klasse',
    kuerzel: 'aehg',
    typ: 'KLASSE',
    administriertVon: '1',
  },
];
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

  test('it calls watcher for klasse without schule', async () => {
    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    await klasseAutocomplete?.setValue('1b');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('1b');
  });

  test('it triggers reset for filters', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.setValue('9a');
    await nextTick();

    wrapper?.find('[data-testid="reset-filter-button"]').trigger('click');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('');
  });
});
