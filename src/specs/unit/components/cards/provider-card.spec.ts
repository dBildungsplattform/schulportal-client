import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import ProviderCard from '../../../../components/cards/ProviderCard.vue'

const assign = window.location.assign
let wrapper = null as any

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

  wrapper = mount(ProviderCard, {
    attachTo: document.getElementById('app') || '',
    props: {
      href: 'https://en.wikipedia.org/wiki/Milkshake',
      testId: 'test-provider-card',
      title: 'My provider card brings all the boys to the yard'
    },
    global: {
      components: {
        ProviderCard
      }
    }
  })
})

test('it renders a provider card', () => {
  expect(wrapper.get('[data-testid="test-provider-card"]')).not.toBeNull()
  expect(wrapper.get('[data-testid="test-provider-card"]').text()).toContain('My provider card brings all the boys to the yard')
})

test.skip('it redirects to an external url', () => {
  wrapper.get('[data-testid="test-provider-card"]').trigger('click')
  expect(window.location.assign).toHaveBeenCalledWith('https://de.wikipedia.org/wiki/Milchshake')
})

afterAll(() => {
  window.location.assign = assign
})