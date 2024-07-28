/* eslint-disable @typescript-eslint/typedef */
import { expect, test, beforeEach, describe } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import ProfileView from './ProfileView.vue'; // Ersetze dies durch den korrekten Pfad zu deiner Komponente
import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Uebersicht } from '@/stores/PersonenkontextStore';
import { nextTick } from 'vue';
import { OrganisationsTyp } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let personInfoStore: PersonInfoStore;
let personenkontextStore: PersonenkontextStore;

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

const mockUebersicht: Uebersicht = {
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
    },
  ],
};

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  personInfoStore = usePersonInfoStore();
  personenkontextStore = usePersonenkontextStore();

  personInfoStore.personInfo = mockPersonInfo;
  personenkontextStore.personenuebersicht = mockUebersicht;

  wrapper = mount(ProfileView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        ProfileView,
      },
    },
  });
});

describe('ProfileView', () => {
  test('it renders the profile headline', () => {
    expect(wrapper?.find('[data-testid="profile-headline"]').isVisible()).toBe(true);
  });

  test('it displays personal data', () => {
    // eslint-disable-next-line @typescript-eslint/typedef
    const personalData = wrapper?.findAll('tr');
    expect(personalData?.length).toBeGreaterThan(0);
    expect(personalData?.at(0)?.text()).toContain('Vor- und Nachname:Samuel Vimes');
    expect(personalData?.at(1)?.text()).toContain('Benutzername:samuelvimes');
    if (mockPersonInfo.person.personalnummer) {
      expect(personalData?.at(2)?.text()).toContain(mockPersonInfo.person.personalnummer);
    }
  });

  test('it displays Schule data', async () => {
    await nextTick();
    const schoolCards = wrapper?.findAllComponents({ name: 'LayoutCard' });
    expect(schoolCards?.length).toBeGreaterThan(0);
    const schoolCard = schoolCards?.at(1);
    if (schoolCard) {
      const schoolCardText = schoolCard.text();
      expect(schoolCardText).toContain('Muster-Schule');
      expect(schoolCardText).toContain('Lehrer');
      expect(schoolCardText).toContain('10A');
    }
  });
});
