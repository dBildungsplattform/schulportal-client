import type { OrganisationResponseLegacy } from '@/api-client/generated';
import routes from '@/router/routes';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';
import { RollenArt, RollenMerkmal, type RolleResponse } from '@/stores/RolleStore';
import type { Person } from '@/stores/types/Person';
import { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import type { TranslatedObject } from '@/types';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { DoFactory } from 'test/DoFactory';
import { vi, type MockInstance } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import RolleUnassign from './RolleUnassign.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

const organisation: OrganisationResponseLegacy = DoFactory.getOrganisationenResponseLegacy();
const person: Person = DoFactory.getPerson();

type Props = {
  isDialogVisible: boolean;
  organisationen: TranslatedObject[] | undefined;
  selectedPersonen: Map<string, PersonWithZuordnungen>;
  selectedOrganisationFromFilter: Organisation;
  selectedRolleFromFilter?: RolleResponse;
};

function mountComponent(partialProps: Partial<Props> = {}): VueWrapper {
  const props: Props = {
    isDialogVisible: true,
    organisationen: [
      { title: organisation.name, value: organisation.id },
      { title: 'orga1', value: '1133' },
    ],
    selectedPersonen: new Map<string, PersonWithZuordnungen>([
      [person.id, new PersonWithZuordnungen(person, [DoFactory.getZuordnung()])],
    ]),
    selectedOrganisationFromFilter: {
      id: '1234567',
      name: 'Testschule',
      typ: OrganisationsTyp.Schule,
    },
    selectedRolleFromFilter: {
      id: 'rolle-id-123',
      name: 'Lehrer',
      createdAt: '',
      updatedAt: '',
      administeredBySchulstrukturknoten: '1',
      rollenart: RollenArt.Lehr,
      merkmale: new Set<RollenMerkmal>(),
      systemrechte: new Set(),
      administeredBySchulstrukturknotenName: null,
      administeredBySchulstrukturknotenKennung: null,
      version: 0,
    },
    ...partialProps,
  };

  return mount(RolleUnassign, {
    attachTo: document.getElementById('app') || '',
    props,
  });
}

beforeEach(async () => {
  document.body.innerHTML = `<div><div id="app"></div></div>`;
  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  await router.push('/');
  await router.isReady();
  bulkOperationStore.$reset();
  vi.restoreAllMocks();
});

describe('RolleUnassign.vue', () => {
  test('renders the component', () => {
    wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  test.each([[true], [false]])('renders the dialog when isDialogVisible=%s', async (isDialogVisible: boolean) => {
    wrapper = mountComponent({ isDialogVisible });
    await nextTick();

    const layoutCard: Element | null = document.body.querySelector('[data-testid="rolle-unassign-layout-card"]');

    if (isDialogVisible) expect(layoutCard).not.toBeNull();
    else expect(layoutCard).toBeNull();
  });

  test('displays confirmation form and triggers submit', async () => {
    wrapper = mountComponent();
    const submitButton: Element | null = document.body.querySelector('[data-testid="rolle-unassign-submit-button"]');

    expect(submitButton).not.toBeNull();
    await nextTick();

    const unassignSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkUnassignPersonenFromRolle');

    submitButton?.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(unassignSpy).toHaveBeenCalledTimes(1);
  });

  test('cancel button closes dialog and resets store', async () => {
    wrapper = mountComponent();
    const cancelButton: Element | null = document.body.querySelector('[data-testid="rolle-unassign-discard-button"]');
    expect(cancelButton).not.toBeNull();

    expect(wrapper.emitted('update:dialogExit')).toBeUndefined();
    cancelButton?.dispatchEvent(new Event('click'));
    await flushPromises();

    expect(wrapper.emitted('update:dialogExit')).toEqual([[false]]);
    expect(bulkOperationStore.currentOperation?.progress).toBe(0);
  });

  test('shows progressbar during unassign', async () => {
    wrapper = mountComponent();
    bulkOperationStore.currentOperation = {
      isRunning: true,
      progress: 25,
      errors: new Map(),
      type: null,
      complete: false,
      data: new Map(),
    };
    await nextTick();

    const progressBar: Element | null = document.body.querySelector('[data-testid="rolle-unassign-progressbar"]');
    expect(progressBar).not.toBeNull();
  });

  test('shows error dialog when showErrorDialog is true', async () => {
    await nextTick();

    (wrapper?.vm as unknown as { showErrorDialog: boolean }).showErrorDialog = true;

    await nextTick();

    const errorDialog: VueWrapper | undefined = wrapper?.findComponent({ name: 'PersonBulkError' });
    expect(errorDialog?.exists()).toBe(true);
  });
});
