import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  useServiceProviderStore,
  type ServiceProvider,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { VueWrapper, flushPromises, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type Mock } from 'vitest';
import { nextTick } from 'vue';
import StartView from './StartView.vue';
import { type PersonStore, usePersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';
import { usePersonInfoStore, type PersonInfoResponse, type PersonInfoStore } from '@/stores/PersonInfoStore';
import { OrganisationsTyp, RollenArt, RollenMerkmal, ServiceProviderKategorie } from '@/api-client/generated/api';
import { MeldungStatus, useMeldungStore, type MeldungStore } from '@/stores/MeldungStore';

let wrapper: VueWrapper | null = null;
let authStore: AuthStore;
let serviceProviderStore: ServiceProviderStore;
let personStore: PersonStore;
let personInfoStore: PersonInfoStore;
let meldungStore: MeldungStore;

const mockProviders: Array<ServiceProvider> = [
  {
    id: '2',
    name: 'Spongebob Squarepants',
    target: 'URL',
    url: 'https://de.wikipedia.org/wiki/SpongeBob_Schwammkopf',
    kategorie: 'EMAIL',
    hasLogo: false,
    requires2fa: false,
  },
  {
    id: '3',
    name: 'Not Squarepants',
    target: 'URL',
    url: 'https://de.wikipedia.org/wiki/SpongeBob_Schwammkopf',
    kategorie: 'EMAIL',
    hasLogo: false,
    requires2fa: false,
  },
  {
    id: '1',
    name: 'Schulportal-Administration',
    target: 'SCHULPORTAL_ADMINISTRATION',
    url: '',
    kategorie: 'VERWALTUNG',
    hasLogo: false,
    requires2fa: false,
  },
];

const mockPerson: PersonInfoResponse = {
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
    dienststellen: [],
  },
  pid: '',
  personenkontexte: [],
  gruppen: [],
  email: null,
};

const mockPersonenUebersicht: PersonWithUebersicht = {
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
      administriertVon: 'root-sh',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
      rollenArt: RollenArt.Lehr,
      admins: [],
    },
    {
      sskId: '2',
      rolleId: '1',
      sskName: 'Anders-Sonderlich-Schule',
      sskDstNr: '789101112',
      rolle: 'Lehrer',
      administriertVon: 'root-sh',
      typ: OrganisationsTyp.Schule,
      editable: true,
      merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
      befristung: '2024-05-06',
      rollenArt: RollenArt.Lehr,
      admins: [],
    },
  ],
};

const locationMock: Mock = vi.fn(() => ({
  pathname: 'test',
  search: '?query',
}));

vi.stubGlobal('location', locationMock);

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  authStore = useAuthStore();
  serviceProviderStore = useServiceProviderStore();
  personStore = usePersonStore();
  personInfoStore = usePersonInfoStore();
  meldungStore = useMeldungStore();
  serviceProviderStore.availableServiceProviders = mockProviders;

  authStore.hasPersonenverwaltungPermission = false;
  authStore.hasSchulverwaltungPermission = false;
  authStore.hasRollenverwaltungPermission = false;
  authStore.hasKlassenverwaltungPermission = false;
  authStore.timeLimitInfos = [
    {
      occasion: 'KOPERS',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      school: null,
      rolle: null,
    },
  ];

  personInfoStore.personInfo = mockPerson;
  personStore.personenuebersicht = mockPersonenUebersicht;
  meldungStore.currentMeldung = {
    id: '1',
    text: 'Test',
    status: MeldungStatus.VEROEFFENTLICHT,
  };

  wrapper = mount(StartView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        StartView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
});

afterEach(() => {
  wrapper?.unmount();
});

describe('StartView', () => {
  test('it renders the start cards headline', () => {
    expect(wrapper?.find('[data-testid="start-card-headline"]').isVisible()).toBe(true);
  });

  test('it navigates to person management', async () => {
    authStore.hasPersonenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-1"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/personen');
  });

  test('it navigates to schule management', async () => {
    authStore.hasSchulverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-1"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/schulen');
  });

  test('it navigates to rolle management', async () => {
    authStore.hasRollenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-1"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/rollen');
  });

  test('it navigates to klasse management', async () => {
    authStore.hasKlassenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-1"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/klassen');
  });

  test('it displays correct banner color', async () => {
    await flushPromises();
    await nextTick();

    const banner: WrapperLike | undefined = wrapper?.find('[data-testid="KOPERS-banner"]');

    expect(banner?.classes()).toContain('bg-errorLight');
  });

  test('it dismisses the banner', async () => {
    await flushPromises();
    await nextTick();
    const banner: VueWrapper | undefined = wrapper?.findComponent({ ref: 'spsh-banner' });

    expect(banner?.find('[data-testid="banner-close-icon"]').isVisible()).toBe(true);
    banner?.find('[data-testid="banner-close-icon"]').trigger('click');
    await nextTick();
    expect(banner?.emitted('dismissBanner')).toBeTruthy();
  });

  test('it renders a hinweis banner', async () => {
    await nextTick();
    await nextTick();

    const banner: WrapperLike | undefined = wrapper?.find('[data-testid="hinweis-banner"]');

    expect(banner?.isVisible()).toBe(true);
  });

  test('filterSortProviders sorts service providers alphabetically', () => {
    serviceProviderStore.availableServiceProviders = mockProviders;

    interface StartViewComponent {
      filterSortProviders: (providers: ServiceProvider[], kategorie: ServiceProviderKategorie) => ServiceProvider[];
    }

    const filteredSortProviders: ServiceProvider[] = (wrapper?.vm as unknown as StartViewComponent).filterSortProviders(
      mockProviders,
      ServiceProviderKategorie.Email,
    );

    expect(filteredSortProviders.map((p: ServiceProvider) => p.name)).toEqual([
      'Not Squarepants',
      'Spongebob Squarepants',
    ]);
  });
});
