import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SchuleCreationView from './SchuleCreationView.vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type { OrganisationResponse } from '@/api-client/generated';

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

  wrapper = mount(SchuleCreationView, {
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

describe('SchuleCreationView', () => {
  test('it renders the schule form', () => {
    expect(wrapper?.find('[data-testid="dienststellennummer-input"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schulname-input"]').isVisible()).toBe(true);
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
    const dienststellennummerInput: VueWrapper | undefined = wrapper?.findComponent({
      ref: 'dienststellennummer-input',
    });
    await dienststellennummerInput?.setValue('9356494');
    await nextTick();

    const schulnameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schulname-input' });
    await schulnameInput?.setValue('Random Schulname Gymnasium');
    await nextTick();
    const mockSchule: OrganisationResponse = {
      id: '9876',
      name: 'Random Schulname Gymnasium',
      kennung: '9356494',
      namensergaenzung: 'Schule',
      kuerzel: 'rsg',
      typ: 'SCHULE',
      administriertVon: '1',
    } as OrganisationResponse;

    organisationStore.createdSchule = mockSchule;

    wrapper?.find('[data-testid="schule-creation-form-submit-button"]').trigger('click');
    await nextTick();

    expect(wrapper?.find('[data-testid="create-another-schule-button"]').isVisible()).toBe(true);

    wrapper?.find('[data-testid="create-another-schule-button"]').trigger('click');
    await nextTick();

    expect(organisationStore.createdSchule).toBe(null);
  });

  test('it shows error message', async () => {
    organisationStore.errorCode = 'NAME_REQUIRED_FOR_SCHULE';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
  });

  test('shows error message if REQUIRED_STEP_UP_LEVEL_NOT_MET error is present and click close button', async () => {
    organisationStore.errorCode = 'REQUIRED_STEP_UP_LEVEL_NOT_MET';
    await nextTick();
    expect(wrapper?.find('[data-testid="alert-title"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="alert-button"]').trigger('click');
    await nextTick();
  });
});
