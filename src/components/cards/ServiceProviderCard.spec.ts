import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import ServiceProviderCard from './ServiceProviderCard.vue'

// eslint-disable-next-line @typescript-eslint/unbound-method
const assign: (url: string | URL) => void = window.location.assign
let wrapper: VueWrapper | null = null

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    value: { assign: vi.fn() },
    writable: true
  })
})

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(ServiceProviderCard, {
    attachTo: document.getElementById('app') || '',
    props: {
      href: 'https://en.wikipedia.org/wiki/Milkshake',
      testId: 'service-provider-card',
      title: 'My provider card brings all the boys to the yard'
    },
    global: {
      components: {
        ServiceProviderCard
      }
    }
  })
})

describe('provider card', () => {
  test('it renders a provider card', () => {
    expect(wrapper?.get('[data-testid="service-provider-card"]')).not.toBeNull()
    expect(wrapper?.get('[data-testid="service-provider-card"]').text()).toContain(
      'My provider card brings all the boys to the yard'
    )
  })

  // TODO: investigate why spy is not called
  test.skip('it redirects to an external url', () => {
    wrapper?.get('[data-testid="service-provider-card"]').trigger('click')
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.location.assign).toHaveBeenCalledWith('https://de.wikipedia.org/wiki/Milchshake')
  })
})

afterAll(() => {
  window.location.assign = assign
})
