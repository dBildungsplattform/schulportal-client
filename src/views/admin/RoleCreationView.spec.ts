import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import RoleCreationView from './RoleCreationView.vue'
import { setActivePinia, createPinia } from 'pinia'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(RoleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RoleCreationView
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
