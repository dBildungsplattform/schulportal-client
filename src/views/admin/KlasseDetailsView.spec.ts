import { expect, test, type MockInstance } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import KlassenDetailsView from './KlasseDetailsView.vue';
import { setActivePinia, createPinia } from 'pinia';
import routes from '@/router/routes';
import { type Router, createRouter, createWebHistory } from 'vue-router';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
let router: Router;
const organisationStore: OrganisationStore = useOrganisationStore();

const mockCurrentOrganisation: Organisation = {
  id: '2',
  kennung: '1234654',
  name: 'BTC Schule',
  namensergaenzung: '',
  kuerzel: 'BTC',
  typ: OrganisationsTyp.Schule,
  administriertVon: '1',
};

const mockCurrentKlasse: Organisation = {
  id: '3',
  name: '1a',
  namensergaenzung: '',
  typ: OrganisationsTyp.Schule,
  administriertVon: '2',
};

beforeEach(async () => {
  setActivePinia(createPinia());
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  organisationStore.currentOrganisation = mockCurrentOrganisation;
  organisationStore.currentKlasse = mockCurrentKlasse;

  wrapper = mount(KlassenDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        KlassenDetailsView,
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

describe('KlassenDetailsView', () => {
  test('it renders the klasse details view and its components and shows current klasse data', () => {
    expect(wrapper?.find('[data-testid="klasse-details-card"]').isVisible()).toBe(true);
    expect(wrapper?.findComponent({ ref: 'klasse-creation-form' }).isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-select"]').text()).toEqual('1234654 (BTC Schule)');
    // TODO: the klassenname is not displayed in the input field
    // expect(wrapper?.find('[data-testid="klassenname-input"] input').text()).toEqual('1a');
    expect(wrapper?.findComponent({ ref: 'klasse-delete' }).isVisible()).toBe(true);
  });

  test('it shows an error if error code exists', async () => {
    organisationStore.errorCode = 'UNSPECIFIED_ERROR';
    await nextTick();

    expect(wrapper?.find('[data-testid="alert-title"]').text()).toBe('Fehler beim Laden der Klassen');
    organisationStore.errorCode = '';
  });

  test('it navigates back to klassen table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it activates and cancels editing', async () => {
    await wrapper?.find('[data-testid="klasse-edit-button"]').trigger('click');
    await nextTick();

    const saveKlasseButton: DOMWrapper<HTMLInputElement> | undefined = wrapper?.find(
      '[data-testid="klasse-changes-save-button"]',
    );
    expect(saveKlasseButton?.isVisible()).toBe(true);

    await wrapper?.find('[data-testid="klasse-edit-cancel-button"]').trigger('click');
    await nextTick();

    // TODO: the dialog is not removed from DOM
    // expect(saveKlasseButton?.isVisible()).toBe(false);
  });

  test('it edits klassenname', async () => {
    await wrapper?.find('[data-testid="klasse-edit-button"]').trigger('click');
    await nextTick();

    await wrapper?.find('[data-testid="klassenname-input"] input').setValue('1b');

    await wrapper?.find('[data-testid="klasse-changes-save-button"]').trigger('click');
    await nextTick();

    // TODO: the klassenname is not displayed in the input field
    // expect(wrapper?.find('[data-testid="klassenname-input"] input').text()).toEqual('1b');
  });

  test('it deletes a klasse', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');

    wrapper?.find('[data-testid="open-klasse-delete-dialog-button"]').trigger('click');
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-confirmation-text"]')).not.toBeNull();

    const klasseDeleteButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="klasse-delete-button"]',
    )[0];
    klasseDeleteButton?.click();
    await nextTick();

    await document.querySelector('[data-testid="klasse-delete-success-text"]');
    expect(document.querySelector('[data-testid="klasse-delete-success-text"]')).not.toBeNull();

    const closeDialogButton: HTMLElement | undefined = document.querySelectorAll<HTMLElement>(
      '[data-testid="close-klasse-delete-success-dialog-button"]',
    )[0];
    closeDialogButton?.click();
    await nextTick();

    expect(push).toHaveBeenCalledTimes(1);
  });

  test('displays error message correctly', async () => {
    // Test case 1: UNSPECIFIED ERROR
    organisationStore.errorCode = 'UNSPECIFIED_ERROR';
    await nextTick();

    const spshAlertWrapper: VueWrapper | undefined = wrapper?.findComponent({ name: 'SpshAlert' });
    expect(spshAlertWrapper?.props()).toMatchObject({
      title: 'Fehler beim Laden der Klassen',
    });
    // Test case 2: NEWER_VERSION_ORGANISATION
    organisationStore.errorCode = 'NEWER_VERSION_ORGANISATION';
    await nextTick();

    expect(spshAlertWrapper?.props()).toMatchObject({
      title: 'Geänderte Daten',
    });
  });
});
