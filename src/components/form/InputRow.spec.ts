import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import InputRow from './InputRow.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(InputRow, {
    attachTo: document.getElementById('app') || '',
    props: {
      id: 'test-input'
    },
    global: {
      components: {
        InputRow
      }
    }
  })
})

describe('InputRow', () => {
  test.skip('it renders an input row', () => {
    expect(wrapper?.find('[data-testid="test-input"]').isVisible()).toBe(true)
  })
})
