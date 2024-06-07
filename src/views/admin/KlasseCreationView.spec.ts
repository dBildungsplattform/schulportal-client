import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseCreationView from './KlasseCreationView.vue';
import { nextTick } from 'vue';
import type { OrganisationResponse } from '@/api-client/generated';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let organisationStore: OrganisationStore;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  organisationStore = useOrganisationStore();

  organisationStore.allOrganisationen = [{
    id: '1',
    name: 'Albert-Emil-Hansebrot-Gymnasium',
    kennung: '9356494',
    namensergaenzung: 'Schule',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  }]

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
  });
});
