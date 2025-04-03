import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import RelationshipAssign from './RelationshipAssign.vue';
import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;

const mockAssignedItems: Array<Organisation> = [
  { id: '1', name: 'Org 1', typ: OrganisationsTyp.Schule },
  { id: '2', name: 'Org 2', typ: OrganisationsTyp.Schule },
];
const mockUnassignedItems: Array<Organisation> = [
  { id: '3', name: 'Org 3', typ: OrganisationsTyp.Schule },
  { id: '4', name: 'Org 4', typ: OrganisationsTyp.Schule },
];

function mountComponent(): VueWrapper {
  return mount(RelationshipAssign, {
    attachTo: document.getElementById('app') || '',
    props: {
      assignedItems: mockAssignedItems,
      assignedItemsHeader: 'Assigned Items',
      noAssignedItemsFoundText: 'No assigned items found',
      noUnassignedItemsFoundText: 'No unassigned items found',
      unassignedItems: mockUnassignedItems,
      unassignedItemsHeader: 'Unassigned Items',
    },
    global: {
      components: {
        RelationshipAssign,
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

describe('RelationshipAssign', () => {
  test('it renders both assign list components', async () => {
    expect(wrapper?.findAllComponents({ name: 'RelationshipAssignList' }).length).toBe(2);
  });

  test('it emits', async () => {
    expect(true).toBeTruthy();
  });

  test('it emits onHandleUnassignedItemClick when an unassigned item is clicked', async () => {
    const unassignedItem: Organisation | undefined = mockUnassignedItems[0];

    await wrapper?.findComponent({ name: 'RelationshipAssignList' }).vm.$emit('onHandleItemClick', unassignedItem);

    expect(wrapper?.emitted('onHandleUnassignedItemClick')).toBeTruthy();
    expect(wrapper?.emitted('onHandleUnassignedItemClick')?.[0]).toEqual([unassignedItem]);
  });
});
