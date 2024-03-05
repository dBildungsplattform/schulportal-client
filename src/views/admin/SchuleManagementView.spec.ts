import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import SchuleManagementView from './SchuleManagementView.vue'
import { setActivePinia, createPinia } from 'pinia'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(SchuleManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleManagementView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('SchuleManagementView', () => {
  test('it renders the schule management view', () => {
    expect(wrapper?.find('[data-testid="schule-table"]').isVisible()).toBe(true)
  })
})
