import { useAuthStore, type AuthStore, type UserInfo } from '@/stores/AuthStore';
import { OrganisationsTyp } from '@/stores/OrganisationStore';
import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
import { usePersonStore, type PersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';
import type { RollenMerkmal } from '@/stores/RolleStore';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter, useRoute, type Router } from 'vue-router';
import ProfileView from './ProfileView.vue';
import type { Zuordnung } from '@/stores/PersonenkontextStore';

let wrapper: VueWrapper | null = null;
let personInfoStore: PersonInfoStore;
let personStore: PersonStore;
let authStore: AuthStore;
let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;
let router: Router;

const mockLehrer: PersonInfoResponse = {
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

const mockSchueler: PersonInfoResponse = {
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
  sub: mockLehrer.person.id,
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

const mockLehrerUebersicht: PersonWithUebersicht = {
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
      sskDstNr: '123456',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
  ],
};

const mockLehrerUebersichtWith2Zuordnungen: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Muster-Schule',
      sskDstNr: '123456',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Anders-Sonderlich-Schule',
      sskDstNr: '789101112',
      rolle: 'Lehrer',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
  ],
};

const mockSchuelerUebersicht: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Astrid-Lindgren-Schule',
      sskDstNr: '123456',
      rolle: 'SuS',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
    {
      klasse: '9A',
      sskId: '2',
      rolleId: '1',
      sskName: '9A',
      sskDstNr: '123456-9A',
      rolle: 'SuS',
      administriertVon: 'Admin',
      typ: OrganisationsTyp.Klasse,
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
    },
  ],
};
const uebersichtWithoutZuordnungen: PersonWithUebersicht = {
  personId: '1234',
  vorname: 'Samuel',
  nachname: 'Vimes',
  benutzername: 'samuelvimes',
  lastModifiedZuordnungen: '2021-09-01T12:00:00Z',
  zuordnungen: [],
};

describe('ProfileView', () => {
  beforeAll(() => {
    personInfoStore = usePersonInfoStore();
    personStore = usePersonStore();
    authStore = useAuthStore();
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/profil',
          component: ProfileView,
        },
      ],
    });
  });

  beforeEach(async () => {
    document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

    personInfoStore.personInfo = mockLehrer;
    personStore.personenuebersicht = mockLehrerUebersicht;

    authStore.currentUser = mockCurrentUser;
    twoFactorAuthenticationStore.errorCode = '';
    twoFactorAuthenticationStore.loading = false;
    twoFactorAuthenticationStore.hasToken = true;
    twoFactorAuthenticationStore.required = true;

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

  test('it renders the profile headline', () => {
    personInfoStore.personInfo = mockLehrer;
    personStore.personenuebersicht = mockLehrerUebersicht;
    expect(wrapper?.find('[data-testid="profile-headline"]').isVisible()).toBe(true);
  });

  test('it displays personal data', () => {
    personInfoStore.personInfo = mockLehrer;
    personStore.personenuebersicht = mockLehrerUebersicht;
    const personalData: DOMWrapper<HTMLTableRowElement>[] | undefined = wrapper?.findAll('tr');
    expect(personalData?.length).toBeGreaterThan(0);
    expect(personalData?.at(0)?.text()).toContain('Vor- und Nachname:Samuel Vimes');
    expect(personalData?.at(1)?.text()).toContain('Benutzername:samuelvimes');
    if (mockLehrer.person.personalnummer) {
      expect(personalData?.at(2)?.text()).toContain(mockLehrer.person.personalnummer);
    }
  });

  test.each([
    { personInfo: mockLehrer, uebersicht: mockLehrerUebersicht },
    { personInfo: mockLehrer, uebersicht: mockLehrerUebersichtWith2Zuordnungen },
    { personInfo: mockLehrer, uebersicht: uebersichtWithoutZuordnungen },
  ])(
    'it displays Schule data with zuordnungen $uebersicht.zuordnungen',
    async ({ personInfo, uebersicht }: { personInfo: PersonInfoResponse; uebersicht: PersonWithUebersicht }) => {
      personInfoStore.personInfo = personInfo;
      personStore.personenuebersicht = uebersicht!;
      await nextTick();
      if (!wrapper) return;
      uebersicht!.zuordnungen.forEach((mockZuordnung: Zuordnung, index: number) => {
        expect(wrapper?.find(`[data-testid="schule-value-${index + 1}"]`).text()).toContain(mockZuordnung.sskName);
        expect(wrapper?.find(`[data-testid="rolle-value-${index + 1}"]`).text()).toContain(mockZuordnung.rolle);
        expect(wrapper?.find(`[data-testid="dienststellennummer-value-${index + 1}"]`).text()).toContain(
          mockZuordnung.sskDstNr,
        );
      });
    },
  );

  test('it displays Schule data for SuS', async () => {
    personInfoStore.personInfo = mockSchueler;
    personStore.personenuebersicht = mockSchuelerUebersicht;
    await nextTick();
    if (!wrapper) return;
    const klasse: Zuordnung = mockSchuelerUebersicht.zuordnungen.find(
      (z: Zuordnung) => z.typ == OrganisationsTyp.Klasse,
    )!;
    const schule: Zuordnung = mockSchuelerUebersicht.zuordnungen.find(
      (z: Zuordnung) => z.typ == OrganisationsTyp.Schule,
    )!;
    expect(wrapper.find('[data-testid="schule-value-1"]').text()).toContain(schule.sskName);
    expect(wrapper.find('[data-testid="rolle-value-1"]').text()).toContain(schule.rolle);
    expect(wrapper.find('[data-testid="dienststellennummer-value-1"]').text()).toContain(schule.sskDstNr);
    expect(wrapper.find('[data-testid="klasse-value-1"]').text()).toContain(klasse.sskName);
    expect(wrapper.find('[data-testid="rolle-value-1"]').text()).toContain(klasse.rolle);
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

  test('it displays 2FA section', async () => {
    twoFactorAuthenticationStore.hasToken = false;
    await nextTick();
    if (!wrapper) return;

    expect(document.querySelector('[data-testid="two-factor-card"]')).not.toBeNull();
    expect(wrapper.text()).not.toContain(
      'Bitte wenden Sie sich bei Fragen und Problemen an Ihre schulischen Administratorinnen und Administratoren.',
    );

    twoFactorAuthenticationStore.hasToken = true;
    await nextTick();
    expect(wrapper.text()).toContain(
      'Bitte wenden Sie sich bei Fragen und Problemen an Ihre schulischen Administratorinnen und Administratoren.',
    );
  });

  test('it does not display 2FA section if not required', async () => {
    twoFactorAuthenticationStore.hasToken = false;
    twoFactorAuthenticationStore.required = false;
    await nextTick();
    if (!wrapper) return;
    expect(document.querySelector('[data-testid="two-factor-card"]')).toBeNull();
    expect(document.querySelector('[data-testid="open-2FA-self-service-dialog-icon"]')).toBeNull();
  });

  test('it displays 2FA connection error', async () => {
    twoFactorAuthenticationStore.errorCode = 'something';
    await nextTick();
    if (!wrapper) return;
    const twoFactorCard: DOMWrapper<Element> = wrapper.find('[data-testid="two-factor-info"]');
    expect(twoFactorCard.text()).toContain(
      'Der Server für die Zwei-Faktor-Authentifizierung kann aktuell nicht erreicht werden. Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.',
    );
    expect(document.querySelector('[data-testid="open-2FA-self-service-dialog-icon"]')).toBeNull();
  });
});
