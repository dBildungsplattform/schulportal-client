import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import LoginForm from '../../components/forms/LoginForm.vue'

document.body.innerHTML = `
  <div>
    <div id="app"></div>
  </div>
`

test('login button emits correct event', () => {
  const wrapper: VueWrapper = mount(LoginForm, {
    attachTo: document.getElementById('app') || '',
    props: {},
    global: {
      components: {
        LoginForm
      }
    }
  })

  wrapper.get('[data-testid="login-button"]').trigger('click')
  expect(wrapper.emitted()).toHaveProperty('on-submit')
})
