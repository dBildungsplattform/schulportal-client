import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import PersonCreationView from './PersonCreationView.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(PersonCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonCreationView
      },
      mocks: {
        route: {
          fullPath: 'full/path'
        }
      }
    }
  })
})

describe('PersonCreationView', () => {
  test('it renders the person creation form', () => {
    expect(wrapper?.find('[data-testid="person-creation-form"]').isVisible()).toBe(true)
  })
})
