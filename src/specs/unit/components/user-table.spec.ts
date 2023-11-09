import { expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import UserTable from '../../../components/admin/UserTable.vue'

let wrapper = null as any

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(UserTable, {
    attachTo: document.getElementById('app') || '',
    props: {
      headers: [
        { title: 'Username', key: 'person.name', align: 'start' },
        { title: 'Action', key: 'actions', sortable: false }
      ],
      items: [],
      loading: false,
      password: 'qwertzuiop'
    },
    global: {
      components: {
        UserTable
      }
    }
  })
})

test('it renders a user table', () => {
  expect(wrapper.get('[data-testid="user-table"]')).not.toBeNull()
})
