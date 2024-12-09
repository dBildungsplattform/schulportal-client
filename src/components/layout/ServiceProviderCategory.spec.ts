import { expect, test, describe, beforeEach } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { VApp } from 'vuetify/components';
import { h } from 'vue';
import ServiceProviderCategory from '@/components/layout/ServiceProviderCategory.vue';
import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
import { type ServiceProvider } from '@/stores/ServiceProviderStore';

let wrapper: VueWrapper | null = null;

const mockServiceProviders: Array<ServiceProvider> = [
  {
    id: '1',
    name: 'Service A',
    url: 'https://service-a.com',
    target: 'URL',
    requires2fa: true,
    logoUrl: '/logo-a.png',
    kategorie: '',
    hasLogo: false,
  },
  {
    id: '2',
    name: 'Service B',
    target: 'URL',
    requires2fa: false,
    logoUrl: '/logo-b.png',
    url: 'https://service-b.com',
    kategorie: '',
    hasLogo: false,
  },
  {
    id: '3',
    name: 'Service C',
    target: 'SCHULPORTAL_ADMINISTRATION',
    requires2fa: true,
    logoUrl: '/logo-c.png',
    url: '',
    kategorie: '',
    hasLogo: false,
  },
];

const defaultProps: { categoryTitle: string; serviceProviders: ServiceProvider[]; hasToken: boolean } = {
  categoryTitle: 'Category Title',
  serviceProviders: mockServiceProviders,
  hasToken: false,
};

beforeEach(() => {
  wrapper = mount(VApp, {
    global: {
      components: {
        ServiceProviderCategory,
        ServiceProviderCard,
      },
    },
    slots: {
      default: h(ServiceProviderCategory, defaultProps),
    },
  });
});

describe('ServiceProviderCategory.vue', () => {
  test('renders a ServiceProviderCard for each service provider with correct href', () => {
    // eslint-disable-next-line @typescript-eslint/typedef
    const cards = wrapper?.findAllComponents(ServiceProviderCard);
    expect(cards).toHaveLength(mockServiceProviders.length);
    if (!cards || cards.length === 0) throw new Error('No cards found');

    expect(cards[0]!.props()).toMatchObject({
      href: '/no-second-factor',
      title: 'Service A',
      logoUrl: '/logo-a.png',
      newTab: false,
    });

    expect(cards[1]!.props()).toMatchObject({
      href: 'https://service-b.com',
      title: 'Service B',
      logoUrl: '/logo-b.png',
      newTab: true,
    });

    expect(cards[2]!.props()).toMatchObject({
      href: '',
      title: 'Service C',
      logoUrl: '/logo-c.png',
      newTab: false,
    });
  });
});
