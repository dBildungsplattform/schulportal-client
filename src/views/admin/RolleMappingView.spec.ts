import { expect, test, beforeEach, describe } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleMappingView from './RolleMappingView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { useRollenartStore, type RollenartStore } from '@/stores/RollenartStore';

const organisationStore: OrganisationStore = useOrganisationStore();
const rollenartStore: RollenartStore = useRollenartStore();

organisationStore.retrievedLmsOrganisations = [
  {
    id: '1',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'LMS',
    administriertVon: '1',
  },
  {
    id: '2',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'LMS',
    administriertVon: '1',
  },
];

rollenartStore.rollenartList = ['Student', 'Teacher', 'Admin'];

let wrapper: VueWrapper | null = null;
let router: Router;

describe('RolleMappingView', () => {
  beforeEach(async () => {
    document.body.innerHTML = `<div><div id="app"></div></div>`;

    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    router.push('/');
    await router.isReady();

    wrapper = mount(RolleMappingView, {
      attachTo: document.getElementById('app') || '',
      global: {
        components: {
          RolleMappingView,
        },
        plugins: [router],
      },
    });
  });

  test('renders headline and table', () => {
    expect(wrapper?.find('[data-testid="admin-headline"]').text()).toBe('Administrationsbereich');
    expect(wrapper?.find('[data-testid="rolle-table"]').exists()).toBe(true);
    expect(wrapper?.findAll('tbody tr').length).toBe(5);
  });

  test('updates LMS column header based on route query', async () => {
    await router.push({
      path: `/admin/rolle/mapping/${organisationStore.retrievedLmsOrganisations[0]?.name}`,
      query: { instance: `${organisationStore.retrievedLmsOrganisations[0]?.name}` },
    });
    await router.isReady();
    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe(
      `${organisationStore.retrievedLmsOrganisations[0]?.name.toString()}`,
    );
  });

  test('renders correct number of rows based on erWInPortalRoles', () => {
    const rows = wrapper?.findAll('tbody tr');
    expect(rows?.length).toBe(5);
    const expectedRoles = ['USER', 'LERN', 'LEHR', 'LEIT', 'SYSADMIN'];
    rows?.forEach((row, index) => {
      expect(row.find('td:first-child').text()).toBe(expectedRoles[index]);
    });
  });

  test('renders empty select options when no roles are available', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: { instance: 'UnknownInstance' } });
    await router.isReady();
    const selects = wrapper?.findAll('tbody tr td:nth-child(2) v-select');
    selects?.forEach((select) => {
      expect(select.attributes('items')).toBe('[]');
    });
  });

  test('displays placeholder when no instance is selected', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: {} });
    await router.isReady();
    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe('...');
  });

  test('it renders the headline and table', async () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="admin-headline"]').text()).toBe('Administrationsbereich');
    expect(wrapper?.find('[data-testid="rolle-table"]').exists()).toBe(true);
    expect(wrapper?.find('thead tr th').text()).toBe('ErWIn-Portal');
    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe('...');
    expect(wrapper?.findAll('tbody tr').length).toBe(5);
  });
});
