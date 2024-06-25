import { expect, test, type MockInstance } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type NavigationFailure, type RouteLocationRaw, type Router } from 'vue-router';
import routes from '@/router/routes';
import PersonDetailsView from './PersonDetailsView.vue';
import { type Personendatensatz, type PersonStore, usePersonStore } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Uebersicht } from '@/stores/PersonenkontextStore';
import { OrganisationsTyp } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let router: Router;

const personStore: PersonStore = usePersonStore();
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

const mockPerson: Personendatensatz = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John',
    },
    referrer: 'jorton',
  },
};

const mockPersonenuebersicht: Uebersicht = {
  personId: '1',
  vorname: 'John',
  nachname: 'Orton',
  benutzername: 'jorton',
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Testschule Birmingham',
      sskDstNr: '123456',
      rolle: 'SuS',
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
    },
    {
      sskId: '1',
      rolleId: '4',
      sskName: 'Testschule London',
      sskDstNr: '123459',
      rolle: 'SuS',
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
    },
    {
      sskId: '2',
      rolleId: '1',
      sskName: '9a',
      sskDstNr: '123459',
      rolle: 'SuS',
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
      editable: true,
    },
  ],
};

personStore.currentPerson = mockPerson;
personenkontextStore.personenuebersicht = mockPersonenuebersicht;

beforeEach(async () => {
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

  wrapper = mount(PersonDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonDetailsView,
      },
      plugins: [router],
    },
  });
});

describe('PersonDetailsView', () => {
  test('it renders the person details page and shows person data', async () => {
    expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-vorname"]').text()).toBe('John');
    expect(wrapper?.find('[data-testid="person-familienname"]').text()).toBe('Orton');
    expect(wrapper?.find('[data-testid="person-username"]').text()).toBe('jorton');
    expect(wrapper?.find('[data-testid="person-zuordnung-1"]').text()).toBe('123456 (Testschule Birmingham): SuS 9a');
  });

  test('it navigates back to user table', async () => {
    const push: MockInstance<[to: RouteLocationRaw], Promise<void | NavigationFailure | undefined>> = vi.spyOn(
      router,
      'push',
    );
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });
});
