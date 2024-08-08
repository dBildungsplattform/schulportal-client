import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlassenDetailsView from './KlasseDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';
import routes from '@/router/routes';
import { type Router, createRouter, createWebHistory } from 'vue-router';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const organisationStore: OrganisationStore = useOrganisationStore();

beforeEach(async () => {
  setActivePinia(createPinia());
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

  organisationStore.currentOrganisation = {
    id: '1',
    kennung: 'Org1',
    name: 'Organisation 1',
    namensergaenzung: 'Ergänzung',
    kuerzel: 'O1',
    typ: OrganisationsTyp.Schule,
    administriertVon: '1',
  };

  wrapper = mount(KlassenDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlassenDetailsView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
      plugins: [router],
    },
  });
});

describe('KlassenDetailsView', () => {
  test('it renders the Klasse details view', () => {
    expect(wrapper?.find('[data-testid="klasse-details-card"]').isVisible()).toBe(true);
  });

  test('it renders the Klasseform component and Klasse Delete component', () => {
    expect(wrapper?.findComponent({ ref: 'klasse-creation-form' }).isVisible()).toBe(true);
    expect(wrapper?.findComponent({ ref: 'klasse-delete' }).isVisible()).toBe(true);
  });
});
