import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import PasswordOutput from './PasswordOutput.vue'

let wrapper: VueWrapper | null = null

const writeText = vi.fn(async () => {})

Object.assign(navigator, {
  clipboard: {
    writeText
  }
})

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(PasswordOutput, {
    attachTo: document.getElementById('app') || '',
    props: {
      password: 'password'
    },
    global: {
      components: {
        PasswordOutput
      }
    }
  })
})

describe('PasswordOutput', () => {
  test('it renders the password output', () => {
    expect(wrapper?.find('[data-testid="password-output-field"]').isVisible()).toBe(true)
  })

  test('it copies the password', () => {
    expect(wrapper?.find('[data-testid="copy-password-icon"]').trigger('click'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
  })
})
