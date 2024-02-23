import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import PersonManagementView from './PersonManagementView.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(PersonManagementView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonManagementView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('PersonManagementView', () => {
  test('it renders the person management table', () => {
    expect(wrapper?.find('[data-testid="person-table"]').isVisible()).toBe(true)
  })
})
