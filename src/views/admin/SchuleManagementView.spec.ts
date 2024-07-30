import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SchuleManagementView from './SchuleManagementView.vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

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
  test('it renders the schule management view', () => {
    expect(wrapper?.find('[data-testid="schule-table"]').isVisible()).toBe(true);
    expect(wrapper?.findAll('.v-data-table__tr').length).toBe(2);
  });
});
