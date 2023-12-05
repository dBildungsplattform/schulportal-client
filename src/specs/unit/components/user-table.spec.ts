import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import UserTable from '../../../components/admin/UserTable.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(UserTable, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      items: [],
      loading: false,
      password: 'qwertzuiop',
      totalItems: 25
    },
    global: {
      components: {
        UserTable
      }
    }
  })
})

describe('user table', () => {
  test('it renders a user table', () => {
    expect(wrapper?.get('[data-testid="user-table"]')).not.toBeNull()
  })
})
