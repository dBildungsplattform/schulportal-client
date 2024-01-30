import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import MenuBar from './MenuBar.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(MenuBar, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        MenuBar
      }
    }
  })
})

describe('MenuBar', () => {
  test.skip('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  test.skip('it renders user management links', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  // TODO: can we rely on vuetify's mobile breakpoint in tests?
  // the only useful test would be for the different visuals on mobile/desktop
})