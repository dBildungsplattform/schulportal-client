import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import AdminLayout from './AdminLayout.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(AdminLayout, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        AdminLayout
      }
    }
  })
})

describe('AdminLayout', () => {
  test.skip('it renders the footer on the admin layout', () => {
    expect(wrapper?.find('[data-testid="footer"]').isVisible()).toBe(true)
  })
})
