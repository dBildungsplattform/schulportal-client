import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import PersonCreationView from './PersonCreationView.vue';
import PersonManagementView from './PersonManagementView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { Vertrauensstufe, type DBiamPersonResponse } from '@/api-client/generated';

let wrapper: VueWrapper | null = null;
let router: Router;

const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

const mockCreatedPersonWithKontext: DBiamPersonResponse = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John',
    },
    referrer: 'jorton',
    personalnummer: '123456',
    mandant: '',
    geburt: null,
    stammorganisation: null,
    geschlecht: null,
    lokalisierung: null,
    vertrauensstufe: Vertrauensstufe.Kein,
    revision: '',
    startpasswort: '',
  },
  DBiamPersonenkontextResponse: {
    personId: '1',
    organisationId: '67890',
    rolleId: '54321',
  },
};

beforeEach(async () => {
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

  test('it renders success template', async () => {
    personenkontextStore.createdPersonWithKontext = mockCreatedPersonWithKontext;
    await nextTick();

    expect(wrapper?.find('[data-testid="person-success-text"]').isVisible()).toBe(true);
  });
});
