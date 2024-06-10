import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SchuleCreationView from './SchuleCreationView.vue';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import type { OrganisationResponse } from '@/api-client/generated';

let wrapper: VueWrapper | null = null;
let router: Router;
let organisationStore: OrganisationStore;

beforeEach(async () => {
  setActivePinia(createPinia());
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

  wrapper = mount(SchuleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleCreationView,
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

    wrapper?.find('[data-testid="schule-creation-form-create-button"]').trigger('click');
    await nextTick();
  });
});
