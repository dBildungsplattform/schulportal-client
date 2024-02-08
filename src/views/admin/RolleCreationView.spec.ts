import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import RolleCreationView from './RolleCreationView.vue'
import { setActivePinia, createPinia } from 'pinia'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(RolleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        RolleCreationView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('RolleCreationView', () => {
  test('it renders the role form', () => {
    expect(wrapper?.find('[data-testid="schulstruktur-knoten-select"]').isVisible()).toBe(true)
  })
})
