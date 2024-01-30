import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import TheHeader from './TheHeader.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(TheHeader, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        TheHeader
      }
    }
  })
})

describe('TheHeader', () => {
  test.skip('it renders the header', () => {
    expect(wrapper?.find('[data-testid="header"]').isVisible()).toBe(true)
  })
})
