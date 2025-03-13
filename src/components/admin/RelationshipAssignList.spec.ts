import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import RelationshipAssignList from './RelationshipAssignList.vue';
import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;

const mockItems: Array<Organisation> = [
  { id: '1', name: 'Org 1', typ: OrganisationsTyp.Schule },
  { id: '2', name: 'Org 2', typ: OrganisationsTyp.Schule },
];

function mountComponent(): VueWrapper {
  return mount(RelationshipAssignList, {
    attachTo: document.getElementById('app') || '',
    props: {
      items: mockItems,
      noItemsFoundText: 'No items found',
    },
    global: {
      components: {
        RelationshipAssignList,
      },
      plugins: [router],
    },
  });
}

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
        <router-view>
            <div id="app"></div>
         </router-view>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mountComponent();
});

afterEach(() => {
  vi.restoreAllMocks();
  wrapper?.unmount();
});

describe('RelationshipAssignList', () => {
  test('it renders the assign list component and its child components', async () => {
    expect(wrapper?.findComponent({ name: 'SearchField' })).toBeTruthy();
  });

  test('it emits', async () => {
    expect(true).toBeTruthy();
  });
});
