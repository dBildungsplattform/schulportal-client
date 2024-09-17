import { useAuthStore, type AuthStore, type UserInfo } from '@/stores/AuthStore';
import { OrganisationsTyp } from '@/stores/OrganisationStore';
import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
import { usePersonStore, type PersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';
import type { RollenMerkmal } from '@/stores/RolleStore';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter, useRoute, type Router } from 'vue-router';
import ProfileView from './ProfileView.vue';

let wrapper: VueWrapper | null = null;
let personInfoStore: PersonInfoStore;
let personStore: PersonStore;
let authStore: AuthStore;
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

const passwordUpdatedAt: Date = new Date(2024, 9, 9);
const mockCurrentUser: UserInfo = {
  sub: mockPersonInfo.person.id,
  name: null,
  given_name: null,
  family_name: null,
  middle_name: null,
  nickname: null,
  preferred_username: null,
  profile: null,
  picture: null,
  website: null,
  email: null,
  email_verified: null,
  gender: null,
  birthdate: null,
  zoneinfo: null,
  locale: null,
  phone_number: null,
  updated_at: null,
  personId: null,
  personenkontexte: null,
  password_updated_at: passwordUpdatedAt.toISOString(),
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
  authStore = useAuthStore();

  personInfoStore.personInfo = mockPersonInfo;
  personStore.personenuebersicht = mockUebersicht;

  authStore.currentUser = mockCurrentUser;

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

  test('it displays password data if there is any', async () => {
    await nextTick();
    if (!wrapper) return;
    const container: DOMWrapper<Element> = wrapper.find('[data-testid="password-card"]');
    const passwordCardText: string = container.text();
    expect(passwordCardText).toContain(passwordUpdatedAt.getDate());
    expect(passwordCardText).toContain(passwordUpdatedAt.getMonth());
    expect(passwordCardText).toContain(passwordUpdatedAt.getFullYear());
  });

  test('it does not display password data if there is none', async () => {
    authStore.currentUser!.password_updated_at = null;
    await nextTick();
    if (!wrapper) return;
    const container: DOMWrapper<Element> = wrapper.find('[data-testid="password-card"]');
    const passwordCardText: string = container.text();
    expect(passwordCardText).not.toContain(passwordUpdatedAt.getDate());
    expect(passwordCardText).not.toContain(passwordUpdatedAt.getMonth());
    expect(passwordCardText).not.toContain(passwordUpdatedAt.getFullYear());
  });

  test('it displays 2FA data', async () => {
    await nextTick();
    if (!wrapper) return;
    const cards: VueWrapper[] = wrapper.findAllComponents({ name: 'LayoutCard' }) as VueWrapper[];
    const twoFactorCard: VueWrapper | undefined = cards.find((card: VueWrapper) =>
      card.text().includes('Zwei-Faktor-Authentifizierung'),
    );
    expect(twoFactorCard).toBeDefined();
  });
});
