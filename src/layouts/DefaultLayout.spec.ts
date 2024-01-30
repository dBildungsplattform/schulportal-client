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

describe('DefaultLayout', () => {
  test.skip('it renders the footer on the default layout', () => {
    expect(wrapper?.find('[data-testid="footer"]').isVisible()).toBe(true)
  })
})
