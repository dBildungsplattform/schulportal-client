import type { Organisation } from '@/stores/OrganisationStore';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import OrganisationUnassign from './OrganisationUnassign.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import type { MockInstance } from 'vitest';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

type Props = {
  isDialogVisible: boolean;
  selectedPersonenIds: string[];
  selectedOrganisation: Organisation;
};

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const props: Props = {
    isDialogVisible: true,
    selectedPersonenIds: ['1'],
    selectedOrganisation: {
      id: '1234567',
      name: 'Testorganisation',
      typ: 'SCHULE',
    },
    ...partialProps,
  };

  return mount(OrganisationUnassign, {
    attachTo: document.getElementById('app') || '',
    props,
  });
}

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

  await router.push('/');
  await router.isReady();
  bulkOperationStore.$reset();
  vi.restoreAllMocks();
});

describe('OrganisationUnassign', () => {
  test('should render the component', () => {
    wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  test.each([[true], [false]])('renders the dialog when isDialogVisible=%s', async (isDialogVisible: boolean) => {
    wrapper = mountComponent({ isDialogVisible });
    await nextTick();
    const layoutCard: Element | null = document.body.querySelector('[data-testid="org-unassign-layout-card"]');
    if (isDialogVisible) expect(layoutCard).not.toBeNull();
    else expect(layoutCard).toBeNull();
  });

  test('displays confirmation form and trigger submit', async () => {
    wrapper = mountComponent();
    const submitButton: Element | null = document.body.querySelector('[data-testid="org-unassign-submit-button"]');
    expect(submitButton).not.toBeNull();
    await nextTick();

    const unassignPersonenkontexteSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkUnassignPersonenFromOrg');

    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(unassignPersonenkontexteSpy).toHaveBeenCalledTimes(1);
  });

  test('cancel button closes dialog and resets store', async () => {
    wrapper = mountComponent();
    const cancelButton: Element | null = document.body.querySelector('[data-testid="org-unassign-discard-button"]');
    expect(cancelButton).not.toBeNull();

    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    cancelButton!.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(wrapper.emitted('update:dialogExit')).toEqual([[false]]);
    expect(bulkOperationStore.currentOperation?.progress).toEqual(0);
  });

  test('shows progressbar when unassigning', async () => {
    wrapper = mountComponent();
    if (bulkOperationStore.currentOperation) {
      bulkOperationStore.currentOperation.progress = 25;
    }
    await nextTick();

    const progressBar: Element | null = document.body.querySelector('[data-testid="org-unassign-progressbar"]');
    expect(progressBar).not.toBeNull();
  });
});
