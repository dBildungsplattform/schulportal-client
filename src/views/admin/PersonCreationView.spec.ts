import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import PersonManagementView from './PersonManagementView.vue';
import MockAdapter from 'axios-mock-adapter';
import ApiService from '@/services/ApiService';
import { createRouter, createWebHistory, type Router } from 'vue-router';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
let wrapper: VueWrapper | null = null;
let router: Router;

beforeEach(async () => {
  mockadapter.reset();
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: PersonCreationView, meta: { layout: 'DefaultLayout' } },
      { path: '/admin/personen', component: PersonManagementView, meta: { layout: 'DefaultLayout' } },
    ],
  });

  wrapper = mount(PersonCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
    },
  });
  router.push('/');
  await router.isReady();
});

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'PersonenkontextCreate' })).toBeTruthy();
  });
});
