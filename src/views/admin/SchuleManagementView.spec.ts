import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SchuleManagementView from './SchuleManagementView.vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { nextTick } from 'vue';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';

let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();

  organisationStore.allSchulen = [
    {
      id: '9876',
      name: 'Random Schulname Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'rsg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
    {
      id: '1123',
      name: 'Albert-Emil-Hansebrot-Gymnasium',
      kennung: '2745475',
      namensergaenzung: 'Schule',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];

  organisationStore.totalSchulen = 2;

  wrapper = mount(SchuleManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleManagementView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
      provide: {
        organisationStore,
      },
    },
  });
});

describe('SchuleManagementView', () => {
  test('it renders schule management view', () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="schule-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
  });

  test('it reloads data after changing page', async () => {
    expect(wrapper?.find('.v-pagination__next button.v-btn--disabled').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-2');

    organisationStore.totalSchulen = 50;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
    expect(wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').isVisible()).toBe(true);
    await wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('31-50');
  });

  test('it reloads data after changing limit', async () => {
    expect(wrapper?.find('.v-data-table-footer__items-per-page').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');

    const component: WrapperLike | undefined = wrapper?.findComponent('.v-data-table-footer__items-per-page .v-select');
    await component?.setValue(50);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('50');
  });
});
