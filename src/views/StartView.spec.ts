import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
import {
  useServiceProviderStore,
  type ServiceProvider,
  type ServiceProviderStore,
} from '@/stores/ServiceProviderStore';
import { VueWrapper, mount } from '@vue/test-utils';
import type WrapperLike from '@vue/test-utils/dist/interfaces/wrapperLike';
import { expect, test, type Mock } from 'vitest';
import { nextTick } from 'vue';
import StartView from './StartView.vue';

let wrapper: VueWrapper | null = null;
let authStore: AuthStore;
let serviceProviderStore: ServiceProviderStore;

const mockProviders: Array<ServiceProvider> = [
  {
    id: '1',
    name: 'Spongebob Squarepants',
    target: 'URL',
    url: 'https://de.wikipedia.org/wiki/SpongeBob_Schwammkopf',
    kategorie: 'EMAIL',
    hasLogo: false,
    requires2fa: true,
  },
  {
    id: '2',
    name: 'Schulportal-Administration',
    target: 'SCHULPORTAL_ADMINISTRATION',
    url: '',
    kategorie: 'VERWALTUNG',
    hasLogo: false,
    requires2fa: false,
  },
];

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
  serviceProviderStore.availableServiceProviders = mockProviders;

  authStore.hasPersonenverwaltungPermission = false;
  authStore.hasSchulverwaltungPermission = false;
  authStore.hasRollenverwaltungPermission = false;
  authStore.hasKlassenverwaltungPermission = false;

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

describe('StartView', () => {
  test('it renders the start cards headline', () => {
    expect(wrapper?.find('[data-testid="start-card-headline"]').isVisible()).toBe(true);
  });

  test('it navigates to person management', async () => {
    authStore.hasPersonenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-2"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/personen');
  });

  test('it navigates to schule management', async () => {
    authStore.hasSchulverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-2"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/schulen');
  });

  test('it navigates to rolle management', async () => {
    authStore.hasRollenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-2"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/rollen');
  });

  test('it navigates to klasse management', async () => {
    authStore.hasKlassenverwaltungPermission = true;
    await nextTick();

    const adminCard: WrapperLike | undefined = wrapper?.findComponent('[data-testid="service-provider-card-2"]');

    expect(adminCard?.isVisible()).toBe(true);
    expect(adminCard?.attributes('href')).toEqual('/admin/klassen');
  });
});
