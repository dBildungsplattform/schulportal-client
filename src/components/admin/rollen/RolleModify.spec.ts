import { test, type MockInstance } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import RolleModify from './RolleModify.vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { nextTick } from 'vue';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

beforeEach(async () => {
  // Create a container for the app and append it to the document body
  const appContainer: HTMLDivElement = document.createElement('div');
  appContainer.id = 'app';
  document.body.appendChild(appContainer);

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  await router.push('/');
  await router.isReady();

  wrapper = mount(RolleModify, {
    attachTo: appContainer,
    props: {
      isLoading: false,
      errorCode: '',
      isDialogVisible: true,
      selectedPersons: [
        {
          administrationsebenen: '',
          klassen: '1a',
          rollen: '',
          person: {
            id: 'test',
            name: {
              familienname: 'Pan',
              vorname: 'Peter',
            },
            referrer: 'ppan',
            revision: '1',
            email: {
              address: 'ppan@wunderland',
              status: 'ENABLED',
            },
            isLocked: null,
            lastModified: '',
            personalnummer: '1234',
            userLock: null,
          },
        },
      ],
      organisationen: [
        { title: 'orga', value: 'O1' },
        { title: 'orga1', value: '1133' },
      ],
      rollen: [
        {
          value: '54321',
          title: 'Lern',
          rollenart: RollenArt.Lern,
        },
        {
          value: '54329',
          title: 'Lehr',
          merkmale: new Set<RollenMerkmal>(['KOPERS_PFLICHT']),
          rollenart: RollenArt.Lehr,
        },
      ],
    },
    global: {
      plugins: [router],
    },
  });
});
personenkontextStore.workflowStepResponse = {
  rollen: [
    {
      administeredBySchulstrukturknoten: '1234',
      rollenart: 'LERN',
      name: 'SuS',
      merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      createdAt: '2022',
      updatedAt: '2022',
      id: '54321',
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    },
  ],
  organisations: [
    {
      id: 'O1',
      kennung: '',
      name: 'Organisation1',
      namensergaenzung: 'string',
      kuerzel: 'string',
      typ: 'TRAEGER',
      administriertVon: '1',
    },
  ],
  selectedOrganisation: null,
  selectedRollen: null,
  canCommit: true,
};

describe('RolleModify', () => {
  test('renders form and triggers submit', async () => {
    await nextTick();

    // Set organisation value
    const organisationAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await organisationAutocomplete?.vm.$emit('update:search', 'O1');
    await nextTick();

    // Set rolle value
    const rolleAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await rolleAutocomplete?.vm.$emit('update:search', '54321');

    await nextTick();

    const submitButton: Element | null = document.body.querySelector('[data-testid="rolle-modify-submit-button"]');
    expect(submitButton).not.toBeNull();
    await nextTick();

    const bulkModifyPersonenRolleSpy: MockInstance = vi.spyOn(bulkOperationStore, 'bulkModifyPersonenRolle');

    if (submitButton) {
      submitButton.dispatchEvent(new Event('click'));
    }

    await flushPromises();
    expect(bulkModifyPersonenRolleSpy).toHaveBeenCalledTimes(1);
  });

  test('renders the dialog when isDialogVisible is true', async () => {
    await nextTick();

    // Find the teleported content in the document body
    const dialogContent: Element | null = document.body.querySelector('[data-testid="rolle-modify-layout-card"]');
    expect(dialogContent).not.toBeNull();

    // Find buttons within the teleported content
    const discardButton: Element | null = document.body.querySelector('[data-testid="rolle-modify-discard-button"]');
    const submitButton: Element | null = document.body.querySelector('[data-testid="rolle-modify-submit-button"]');

    expect(discardButton).not.toBeNull();
    expect(submitButton).not.toBeNull();

    expect(document.querySelector('[data-testid="rolle-modify-layout-card"]')).not.toBeNull();
  });

  test('renders the dialog when isDialogVisible and closes it', async () => {
    await nextTick();

    const dialogContent: Element | null = document.body.querySelector('[data-testid="rolle-modify-layout-card"]');
    expect(dialogContent).not.toBeNull();

    const discardButton: Element | null = document.body.querySelector('[data-testid="rolle-modify-discard-button"]');

    expect(discardButton).not.toBeNull();

    if (discardButton) {
      discardButton.dispatchEvent(new Event('click'));
    }
  });
});
