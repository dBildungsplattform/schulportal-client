import { test, type MockInstance } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import RolleModify from './RolleModify.vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { nextTick } from 'vue';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import { DoFactory } from '@/testing/DoFactory';
import type { Organisation } from '@/stores/OrganisationStore';
import type { OrganisationResponseLegacy, RolleResponse } from '@/api-client/generated';

let wrapper: VueWrapper | null = null;
let router: Router;
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

const organisation: OrganisationResponseLegacy = DoFactory.getOrganisationenResponseLegacy();
const rolle: RolleResponse = DoFactory.getRolleResponse({
  administeredBySchulstrukturknoten: organisation.id,
  rollenart: RollenArt.Lehr,
});

const kopersRolle: RolleResponse = DoFactory.getRolleResponse({
  administeredBySchulstrukturknoten: organisation.id,
  merkmale: new Set<RollenMerkmal>([RollenMerkmal.KopersPflicht]),
  systemrechte: new Set<RollenSystemRecht>([RollenSystemRecht.RollenVerwalten]),
  rollenart: RollenArt.Lern,
});

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
      personIDs: ['person1', 'person2'],
      organisationen: [
        { title: organisation.name, value: organisation.id },
        { title: 'orga1', value: '1133' },
      ],
      rollen: [
        {
          value: rolle.id,
          title: rolle.name,
          merkmale: rolle.merkmale,
          rollenart: rolle.rollenart,
        },
        {
          value: kopersRolle.id,
          title: kopersRolle.name,
          merkmale: kopersRolle.merkmale,
          rollenart: kopersRolle.rollenart,
        },
      ],
    },
    global: {
      plugins: [router],
    },
  });
});
personenkontextStore.workflowStepResponse = DoFactory.getPersonenkontextWorkflowResponse({
  organisations: [organisation],
  rollen: [rolle, kopersRolle],
  canCommit: true,
});

describe('RolleModify', () => {
  test('renders form and triggers submit', async () => {
    await nextTick();

    // Set organisation value
    const organisationAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue(organisation.id);
    organisationAutocomplete?.vm.$emit('update:search', organisation.id);
    await nextTick();

    // Set rolle value
    const rolleAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue(rolle.id);
    rolleAutocomplete?.vm.$emit('update:search', rolle.id);

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
