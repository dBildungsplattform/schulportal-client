import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import UserRoleCreateView from './UserRoleCreateView.vue'
import { setActivePinia, createPinia } from 'pinia'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(UserRoleCreateView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        UserRoleCreateView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('UserRoleCreateView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('.v-form').isVisible()).toBe(true)
  })
})
