import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseCreationView from './KlasseCreationView.vue';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import { nextTick } from 'vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
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

describe('KlasseCreationView', () => {
  test('it renders the klasse creation form', () => {
    expect(wrapper?.find('[data-testid="klasse-creation-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });

  test('it navigates back to klassen table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it fills form and triggers submit', async () => {
    const schuleSelect: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await schuleSelect?.setValue('1');
    await nextTick();

    const klassennameInput: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klassenname-input' });
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

    wrapper?.find('[data-testid="klasse-creation-form-create-button"]').trigger('click');
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
  });
});
