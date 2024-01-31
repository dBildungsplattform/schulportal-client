import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import DefaultLayout from './DefaultLayout.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(DefaultLayout, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        DefaultLayout
      }
    }
  })
})

// We are currently skipping these tests, because rendering fails due to a missing
// vuetify layout that needs to be injected and cannot be provided inside the test environment.
// Providing it manually is hacky, since the needed layout cannot be imported from vuetify.
// Hopefully this will be fixed in an upcoming vuetify release.

describe('DefaultLayout', () => {
  test('it renders the footer on the default layout', () => {
    expect(wrapper?.find('[data-testid="footer"]').isVisible()).toBe(true)
  })
})
