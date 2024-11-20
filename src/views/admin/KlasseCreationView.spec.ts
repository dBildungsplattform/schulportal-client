import { expect, test, type MockInstance, vi, describe, beforeEach } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseCreationView from './KlasseCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type { OrganisationResponse, PersonenkontextWorkflowResponse } from '@/api-client/generated';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';

let wrapper: VueWrapper | null = null;
let router: Router;
let organisationStore: OrganisationStore;
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  organisationStore.allOrganisationen = [
    {
      id: '1',
      name: 'Albert-Emil-Hansebrot-Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'aehg',
      typ: 'SCHULE',
      administriertVon: '1',
    },
  ];

  wrapper = mount(KlasseCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlasseCreationView,
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

afterEach(() => {
  // Reset the organisationStore state after each test
  organisationStore.errorCode = '';
  organisationStore.createdKlasse = null;
});

describe('KlasseCreationView', () => {
  test('it renders the klasse creation form', () => {
    expect(wrapper?.find('[data-testid="klasse-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it navigates back to klassen table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers submit', async () => {
    const schuleSelect: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'schule-select' });
    await schuleSelect?.setValue('1');
    await nextTick();

    const klassennameInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'klassenname-input' });
    await klassennameInput?.setValue('11b');
    await nextTick();

    const mockKlasse: OrganisationResponse = {
      id: '9876',
      name: '11b',
      kennung: '9356494-11b',
      namensergaenzung: 'Klasse',
      kuerzel: '11b',
      typ: 'KLASSE',
      administriertVon: '1',
    } as OrganisationResponse;

    organisationStore.createdKlasse = mockKlasse;

    wrapper?.find('[data-testid="klasse-form-submit-button"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-klasse-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-klasse-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.createdKlasse).toBe(null);
  });

  test('it shows error message', async () => {
    organisationStore.errorCode = 'KLASSENNAME_AN_SCHULE_EINDEUTIG';
    await nextTick();

    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.errorCode).toBe('');
  });

  test('it handles search input for Schule when searchValue is not equal to selectedSchuleTitle', async () => {
    // Setting a value that matches selectedSchuleTitle
    personenkontextStore.workflowStepResponse = {
      organisations: [
        {
          id: 'Albert',
          name: 'Albert-Emil-Hansebrot-Gymnasium',
          kennung: '9356494',
          namensergaenzung: 'Schule',
          kuerzel: 'aehg',
          typ: 'SCHULE',
          administriertVon: '1',
        },
      ],
      rollen: [],
      selectedOrganisation: '1',
      selectedRolle: 'someRolle',
      canCommit: true,
    } as PersonenkontextWorkflowResponse;

    const schuleSearchInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'schule-select' });

    // Triggering search with a value
    await schuleSearchInput?.setValue('Albert');
    await schuleSearchInput?.vm.$emit('update:search', 'Albert');
    await nextTick();
    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalled();
  });
  test('it handles search input for Schule when searchValue is empty', async () => {
    personenkontextStore.workflowStepResponse = {
      organisations: [
        {
          id: 'Hohver',
          name: 'Hohver-Gymnasium',
          kennung: '9356495',
          namensergaenzung: 'Schule',
          kuerzel: 'aehg',
          typ: 'SCHULE',
          administriertVon: '1',
        },
      ],
      rollen: [],
      selectedOrganisation: '1',
      selectedRolle: 'someRolle',
      canCommit: true,
    } as PersonenkontextWorkflowResponse;

    const schuleSearchInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'schule-select' });

    await schuleSearchInput?.vm.$emit('update:search', '');
    await nextTick();
    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalled();
  });
  test('it handles search input for Schule when searchValue is empty and selected Schule is present', async () => {
    // Setting a value that matches selectedSchuleTitle
    personenkontextStore.workflowStepResponse = {
      organisations: [
        {
          id: 'Albert',
          name: 'Albert-Gymnasium',
          kennung: '9356495',
          namensergaenzung: 'Schule',
          kuerzel: 'aehg',
          typ: 'SCHULE',
          administriertVon: '1',
        },
      ],
      rollen: [],
      selectedOrganisation: '1',
      selectedRolle: 'someRolle',
      canCommit: true,
    } as PersonenkontextWorkflowResponse;

    const schuleSearchInput: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'schule-select' });
    await schuleSearchInput?.vm.$emit('update:search', '');
    await nextTick();

    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalled();
  });
  test('it does nothing if the oldValue is equal to what is selected on Schule', async () => {
    personenkontextStore.workflowStepResponse = {
      organisations: [
        {
          id: '1133',
          kennung: '',
          name: 'orga1',
          namensergaenzung: 'string',
          kuerzel: 'string',
          typ: 'TRAEGER',
          administriertVon: '1',
        },
        {
          id: '1133',
          kennung: '',
          name: 'orga',
          namensergaenzung: 'string',
          kuerzel: 'string',
          typ: 'TRAEGER',
          administriertVon: '1',
        },
      ],
      rollen: [],
      selectedOrganisation: null,
      selectedRolle: null,
      canCommit: true,
    };
    const organisationAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'klasse-creation-form' })
      .findComponent({ ref: 'schule-select' });

    // Set a value in orga that will match with something given by the props and so the component will calculate the selectedOrganisationTitle
    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    // Set the searchValue to 'orga' which matches the title before
    await organisationAutocomplete?.vm.$emit('update:search', 'orga');
    await nextTick();

    // Set the newValue to '' and the oldValue is in this case 'orga' and so the method should just return
    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('1133');
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present', async () => {
    organisationStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
  });
});
