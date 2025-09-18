import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleMappingView from './RolleMappingView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';

let wrapper: VueWrapper | null = null;
let router: Router;

describe('RolleMappingView', () => {
  beforeEach(async () => {
    document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

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

  test('it renders the headline and table', async () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="admin-headline"]').text()).toBe('Administrationsbereich');
    expect(wrapper?.find('[data-testid="rolle-table"]').exists()).toBe(true);
    expect(wrapper?.find('thead tr th').text()).toBe('ErWIn-Portal');
    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe('...');
    expect(wrapper?.findAll('tbody tr').length).toBe(5);
  });

  test('it shows correct LMS column header for Schulcloud', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: { instance: 'Schulcloud' } });
    await router.isReady();

    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe('Schulcloud');
  });

  test('it shows correct LMS column header for Moodle', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: { instance: 'Moodle' } });
    await router.isReady();

    expect(wrapper?.find('th:nth-child(2) strong').text()).toBe('Moodle');
  });

  test('it shows correct select options for Schulcloud', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: { instance: 'Schulcloud' } });
    await router.isReady();

    const selects = wrapper?.findAllComponents({ name: 'VSelect' }) ?? [];
    const schulcloudOptions: string[] = ['user', 'Student', 'Teacher', 'Administrator', 'Superhero', 'Expert'];

    selects.forEach((select) => {
      expect(select.props().items).toEqual(schulcloudOptions);
    });
  });

  test('it shows correct select options for Moodle', async () => {
    await router.push({ path: '/admin/rolle/mapping', query: { instance: 'Moodle' } });
    await router.isReady();

    const selects = wrapper?.findAllComponents({ name: 'VSelect' }) ?? [];
    const moodleOptions: string[] = ['Authenticated User', 'Student', 'Teacher', 'Manager', 'Site Administrator'];

    selects.forEach((select) => {
      expect(select.props().items).toEqual(moodleOptions);
    });
  });
});
