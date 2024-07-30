import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleManagementView from './RolleManagementView.vue';
import {
  RollenMerkmal,
  RollenSystemRecht,
  useRolleStore,
  type RolleStore,
  type RolleWithServiceProvidersResponse,
} from '@/stores/RolleStore';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
let rolleStore: RolleStore;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  rolleStore = useRolleStore();

  rolleStore.allRollen = [
    {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LEHR',
      name: 'Lehrer',
      // TODO: remove type casting when generator is fixed
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '1',
      serviceProviders: [
        {
          id: '1',
          name: 'itslearning',
        },
        {
          id: '2',
          name: 'E-Mail',
        },
      ],
    },
    {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LERN',
      name: 'SuS',
      // TODO: remove type casting when generator is fixed
      merkmale: [] as unknown as Set<RollenMerkmal>,
      systemrechte: [] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '2',
      serviceProviders: [
        {
          id: '1',
          name: 'itslearning',
        },
      ],
    },
  ] as RolleWithServiceProvidersResponse[];

  rolleStore.totalRollen = 2;

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
  test('it renders rolle management view', () => {
    expect(wrapper?.getComponent({ name: 'ResultTable' })).toBeTruthy();
    expect(wrapper?.find('[data-testid="rolle-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
  });

  test('it reloads data after changing page', async () => {
    expect(wrapper?.find('.v-pagination__next button.v-btn--disabled').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-2');

    rolleStore.totalRollen = 50;
    await nextTick();

    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('1-30');
    expect(wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').isVisible()).toBe(true);
    await wrapper?.find('.v-pagination__next button:not(.v-btn--disabled)').trigger('click');
    expect(wrapper?.find('.v-data-table-footer__info').text()).toContain('31-50');
  });

  test('it reloads data after changing limit', () => {
    expect(wrapper?.find('.v-data-table-footer__items-per-page').isVisible()).toBe(true);
    expect(wrapper?.find('.v-data-table-footer__items-per-page').text()).toContain('30');
  });
});
