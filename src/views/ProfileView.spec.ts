import { expect, test, beforeEach, describe } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import ProfileView from './ProfileView.vue';
import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
import { nextTick } from 'vue';
import { OrganisationsTyp } from '@/stores/OrganisationStore';
import { createRouter, createMemoryHistory, type Router } from 'vue-router';
import { useRoute } from 'vue-router';
import type { RollenMerkmal } from '@/stores/RolleStore';
import { usePersonStore, type PersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';

let wrapper: VueWrapper | null = null;
let personInfoStore: PersonInfoStore;
let personStore: PersonStore;
let router: Router;

const mockPersonInfo: PersonInfoResponse = {
  person: {
    id: '1234',
    name: {
      familiennamen: 'Vimes',
      vorname: 'Samuel',
      initialenfamilienname: null,
      initialenvorname: null,
      rufname: null,
      titel: null,
      anrede: null,
      namenspraefix: null,
      namenssuffix: null,
      sortierindex: null,
    },
    referrer: 'samuelvimes',
    personalnummer: '123456',
    mandant: '',
    geburt: null,
    stammorganisation: null,
    geschlecht: null,
    lokalisierung: null,
    vertrauensstufe: 'KEIN',
    revision: '',
  },
  pid: '',
  personenkontexte: [],
  gruppen: [],
};

const mockPersonInfo2: PersonInfoResponse = {
  person: {
    id: '1234',
    name: {
      familiennamen: 'Vimes',
      vorname: 'Samuel',
      initialenfamilienname: null,
      initialenvorname: null,
      rufname: null,
      titel: null,
      anrede: null,
      namenspraefix: null,
      namenssuffix: null,
      sortierindex: null,
    },
    referrer: 'samuelvimes',
    personalnummer: null,
    mandant: '',
    geburt: null,
    stammorganisation: null,
    geschlecht: null,
    lokalisierung: null,
    vertrauensstufe: 'KEIN',
    revision: '',
  },
  pid: '',
  personenkontexte: [],
  gruppen: [],
};

const mockUebersicht: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [
    {
      klasse: '10A',
      sskId: '1',
      rolleId: '1',
      sskName: 'Muster-Schule',
      sskDstNr: '123-456',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
  ],
};

const mockUebersicht2: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [
    {
      klasse: '10A',
      sskId: '1',
      rolleId: '1',
      sskName: 'Muster-Schule',
      sskDstNr: '123-456',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
    {
      klasse: '9A',
      sskId: '1',
      rolleId: '1',
      sskName: 'Muster-Schule',
      sskDstNr: '123-457',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
  ],
};
const mockUebersicht3: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [],
};

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  personInfoStore = usePersonInfoStore();
  personStore = usePersonStore();

  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/profil',
        component: ProfileView,
      },
    ],
  });

  router.push({
    path: '/profil',
    query: { kc_action_status: 'some_status' },
  });

  await router.isReady();

  wrapper = mount(ProfileView, {
    attachTo: document.getElementById('app') || '',
    global: {
      plugins: [router],
      mocks: {
        $route: useRoute(),
      },
    },
  });
});

describe('ProfileView', () => {
  test('it renders the profile headline', () => {
    personInfoStore.personInfo = mockPersonInfo;
    personStore.personenuebersicht = mockUebersicht;
    expect(wrapper?.find('[data-testid="profile-headline"]').isVisible()).toBe(true);
  });

  test('it displays personal data', () => {
    personInfoStore.personInfo = mockPersonInfo;
    personStore.personenuebersicht = mockUebersicht;
    const personalData: DOMWrapper<HTMLTableRowElement>[] | undefined = wrapper?.findAll('tr');
    expect(personalData?.length).toBeGreaterThan(0);
    expect(personalData?.at(0)?.text()).toContain('Vor- und Nachname:Samuel Vimes');
    expect(personalData?.at(1)?.text()).toContain('Benutzername:samuelvimes');
    if (mockPersonInfo.person.personalnummer) {
      expect(personalData?.at(2)?.text()).toContain(mockPersonInfo.person.personalnummer);
    }
  });
  test('it displays Schule data', async () => {
    personInfoStore.personInfo = mockPersonInfo;
    personStore.personenuebersicht = mockUebersicht;
    await nextTick();
    if (!wrapper) return;
    const schoolCards: VueWrapper[] = wrapper.findAllComponents({ name: 'LayoutCard' }) as VueWrapper[];
    expect(schoolCards.length).toBeGreaterThan(0);
    const schoolCard: VueWrapper = schoolCards[1] as VueWrapper;
    const schoolCardText: string = schoolCard.text();
    expect(schoolCardText).toContain('Muster-Schule');
    expect(schoolCardText).toContain('Lehrer');
    expect(schoolCardText).toContain('10A');
  });
  test('it displays Schule data', async () => {
    personInfoStore.personInfo = mockPersonInfo2;
    personStore.personenuebersicht = mockUebersicht2;
    await nextTick();
    if (!wrapper) return;
    const schoolCards: VueWrapper[] = wrapper.findAllComponents({ name: 'LayoutCard' }) as VueWrapper[];
    expect(schoolCards.length).toBeGreaterThan(0);
    const schoolCard: VueWrapper = schoolCards[1] as VueWrapper;
    const schoolCardText: string = schoolCard.text();
    expect(schoolCardText).toContain('Muster-Schule');
    expect(schoolCardText).toContain('Lehrer');
    expect(schoolCardText).toContain('10A');
  });
  test('it displays Schule data', async () => {
    personInfoStore.personInfo = mockPersonInfo;
    personStore.personenuebersicht = mockUebersicht3;
    await nextTick();
    if (!wrapper) return;
    const schoolCards: VueWrapper[] = wrapper.findAllComponents({ name: 'LayoutCard' }) as VueWrapper[];
    expect(schoolCards.length).toBeGreaterThan(0);
    const schoolCard: VueWrapper = schoolCards[1] as VueWrapper;
    const schoolCardText: string = schoolCard.text();
    expect(schoolCardText).toContain('Muster-Schule');
    expect(schoolCardText).toContain('Lehrer');
    expect(schoolCardText).toContain('10A');
  });
});
