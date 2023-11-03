import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '../../../../components/forms/LoginForm.vue'

let wrapper = null as any

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(LoginForm, {
    attachTo: document.getElementById('app') || '',
    props: {},
    global: {
      components: {
        LoginForm
      }
    }
  })
})

test('login button emits correct event', () => {
  wrapper.get('[data-testid="login-button"]').trigger('click')
  expect(wrapper.emitted()).toHaveProperty('onSubmit')
})
