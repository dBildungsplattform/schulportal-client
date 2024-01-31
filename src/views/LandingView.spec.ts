import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import LandingView from './LandingView.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(LandingView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        LandingView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('LandingView', () => {
  test('it renders the login card', () => {
    expect(wrapper?.find('[data-testid="login-card"]').isVisible()).toBe(true)
  })
})
