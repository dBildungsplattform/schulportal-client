import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import SchuleCreationView from './SchuleCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type { OrganisationResponse } from '@/api-client/generated';
import SchultraegerCreationView from './SchultraegerCreationView.vue';

let wrapper: VueWrapper | null = null;
let router: Router;
let organisationStore: OrganisationStore;

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();
  organisationStore.schultraeger = [
    {
      id: '2',
      name: 'Öffentliche Schulen',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Land,
      administriertVon: '1',
    },
    {
      id: '3',
      name: 'Ersatzschulen Schulen',
      namensergaenzung: 'Ergänzung',
      kennung: null,
      kuerzel: '',
      typ: OrganisationsTyp.Land,
      administriertVon: '1',
    },
  ];
  organisationStore.errorCode = '';

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(SchultraegerCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleCreationView,
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

describe('SchultraegerView', () => {
  test('it renders the Schultraeger form', () => {
    expect(wrapper?.find('[data-testid="schultraegername-input"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it navigates back to schulen table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers submit', async () => {
    const schulnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schultraegername-input' });
    await schulnameInput?.setValue('Random Schultraegername');
    await nextTick();
    const mockSchule: OrganisationResponse = {
      id: '9876',
      name: 'Random Schulname Gymnasium',
      kennung: '',
      namensergaenzung: 'Traeger',
      kuerzel: 'rsg',
      typ: OrganisationsTyp.Traeger,
      administriertVon: '1',
    } as OrganisationResponse;

    organisationStore.createdSchultraeger = mockSchule;

    wrapper?.find('[data-testid="schultraeger-creation-form-submit-button"]').trigger('click');
    await flushPromises();

    expect(wrapper?.find('[data-testid="create-another-schultraeger-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-schultraeger-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.createdSchultraeger).toBe(null);
  });

  test('it shows error message', async () => {
    organisationStore.errorCode = 'NAME_REQUIRED_FOR_SCHULE';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
    organisationStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });
});
