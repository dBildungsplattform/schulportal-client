import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import ResultTable from './ResultTable.vue'

let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `

  wrapper = mount(ResultTable, {
    attachTo: document.getElementById('app') || '',
    props: {
      items: [],
      loading: false,
      password: 'qwertzuiop',
      totalItems: 25
    },
    global: {
      components: {
        ResultTable
      }
    }
  })
})

describe('user table', () => {
  test('it renders a user table', () => {
    expect(wrapper?.get('[data-testid="user-table"]')).not.toBeNull()
  })
})
