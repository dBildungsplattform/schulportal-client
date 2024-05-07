import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonCreationView from './PersonCreationView.vue';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  personenkontextStore.filteredOrganisationen = {
    moeglicheSsks: [
      {
        id: 'string',
        kennung: 'string',
        name: 'Organisation1',
        namensergaenzung: 'string',
        kuerzel: 'string',
        typ: 'TRAEGER',
        administriertVon: '1',
      },
    ],
    total: 0,
  };

  organisationStore.klassen = [
    {
      id: '1',
      kennung: 'Org1',
      name: '9a',
      namensergaenzung: 'Ergänzung',
      kuerzel: 'O1',
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
    },
  ];

  wrapper = mount(PersonCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonCreationView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true);
  });

  test('it renders all child components', () => {
    expect(wrapper?.getComponent({ name: 'LayoutCard' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'SpshAlert' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormWrapper' })).toBeTruthy();
    expect(wrapper?.getComponent({ name: 'FormRow' })).toBeTruthy();
  });
});
