import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import SchultraegerDetailsView from './SchultraegerDetailsView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
let organisationStore: OrganisationStore;

function mountComponent(): VueWrapper {
  return mount(SchultraegerDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchultraegerDetailsView,
      },
      plugins: [router],
    },
  });
}

beforeEach(async () => {
  Object.defineProperty(window, 'location', {
    value: {
      href: '',
      reload: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, 'history', {
    value: {
      go: vi.fn(),
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    writable: true,
  });

  document.body.innerHTML = `
    <div>
        <router-view>
            <div id="app"></div>
         </router-view>
    </div>
  `;

  organisationStore = useOrganisationStore();

  organisationStore.schultraeger = [
    {
      id: '2',
      name: 'Öffentlicher Träger',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
    {
      id: '3',
      name: 'Ersatz Träger',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
  ];
  organisationStore.currentOrganisation = {
    id: '2',
    name: 'Öffentlicher Träger',
    namensergaenzung: 'Ergänzung',
    kennung: null,
    kuerzel: '',
    typ: OrganisationsTyp.Traeger,
    zugehoerigZu: '1',
  };
  organisationStore.schulenWithoutTraeger = [
    {
      id: '2522',
      name: 'Öffentliche Schule A',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
    {
      id: '25225',
      name: 'Öffentliche Schule B',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
    {
      id: '458579',
      name: 'Ersatzschule B',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '1',
      administriertVon: '1',
    },
  ];
  organisationStore.schulenFromTraeger = [
    {
      id: '6792',
      name: 'Öffentliche Schule C',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '2',
      administriertVon: '2',
    },
    {
      id: '13',
      name: 'Öffentliche Schule D',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Schule,
      zugehoerigZu: '2',
      administriertVon: '2',
    },
  ];
  organisationStore.errorCode = '';
  organisationStore.updatedOrganisation = null;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push({ name: 'schultraeger-details', params: { id: '2' } });
  await router.isReady();

  wrapper = mountComponent();
});

afterEach(() => {
  vi.restoreAllMocks();
  wrapper?.unmount();
});

describe('SchultraegerDetailsView', () => {
  test('it renders all child components', async () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SchultraegerForm' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'RelationshipAssign' })).toBeTruthy();

    organisationStore.updatedOrganisation = {
      id: '2',
      name: 'Öffentlicher Träger',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Traeger,
      zugehoerigZu: '1',
      administriertVon: '1',
    };
    await nextTick();

    expect(wrapper?.getComponent({ name: 'SchultraegerSuccessTemplate' })).toBeTruthy();

    organisationStore.updatedOrganisation = null;
    await nextTick();
  });
});
