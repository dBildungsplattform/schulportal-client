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
    global: {
      components: {
        MenuBar
      }
    }
  })
})

// We are currently skipping these tests, because rendering the navigation drawer fails due to a missing
// vuetify layout that needs to be injected and cannot be provided inside the test environment.
// Providing it manually is hacky, since the needed layout cannot be imported from vuetify.
// Hopefully this will be fixed in an upcoming vuetify release.

describe('MenuBar', () => {
  test.skip('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  test.skip('it renders person management links', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  // TODO: can we rely on vuetify's mobile breakpoint in tests?
  // the only useful test would be for the different visuals on mobile/desktop
})
