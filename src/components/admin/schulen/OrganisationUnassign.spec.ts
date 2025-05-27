import routes from '@/router/routes';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { Organisation } from '@/stores/OrganisationStore';
import type { Person } from '@/stores/types/Person';
import { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import type { Zuordnung } from '@/stores/types/Zuordnung';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import type { MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import OrganisationUnassign from './OrganisationUnassign.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

type Props = {
  isDialogVisible: boolean;
  selectedPersonen: Map<string, PersonWithZuordnungen>;
  selectedOrganisation: Organisation;
};

const schule: Organisation = DoFactory.getSchule();
const person: Person = DoFactory.getPerson();
const zuordnung: Zuordnung = DoFactory.getZuordnung({}, { organisation: schule });

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const props: Props = {
    isDialogVisible: true,
    selectedPersonen: new Map<string, PersonWithZuordnungen>([
      [person.id, new PersonWithZuordnungen(person, [zuordnung])],
    ]),
    selectedOrganisation: schule,
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

  test('displays confirmation form and trigger submit with errors', async () => {
    wrapper = mountComponent();
    await nextTick();

    const submitButton: Element | null = document.body.querySelector('[data-testid="org-unassign-submit-button"]');
    expect(submitButton).not.toBeNull();
    await nextTick();

    const unassignPersonenkontexteSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkUnassignPersonenFromOrg');

    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(unassignPersonenkontexteSpy).toHaveBeenCalledTimes(1);

    const errorDialog: Element | null = document.body.querySelector('.v-dialog');
    expect(errorDialog).not.toBeNull();
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

  test('shows error dialog when showErrorDialog is true', async () => {
    await nextTick();

    // Manually set showErrorDialog to true
    (wrapper?.vm as unknown as { showErrorDialog: boolean }).showErrorDialog = true;

    await nextTick();

    const errorDialog: VueWrapper | undefined = wrapper?.findComponent({ name: 'PersonBulkError' });
    expect(errorDialog?.exists()).toBe(true);
  });
});
