import { expect, test, type MockInstance } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import {
  createRouter,
  createWebHistory,
  type NavigationFailure,
  type RouteLocationRaw,
  type Router
} from 'vue-router'
import routes from '@/router/routes'
import PersonDetailsView from './PersonDetailsView.vue'
import { type Personendatensatz, type PersonStore, usePersonStore } from '@/stores/PersonStore'

let wrapper: VueWrapper | null = null
let router: Router

const personStore: PersonStore = usePersonStore()
const mockPerson: Personendatensatz = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John'
    },
    referrer: 'jorton'
  },
  personenkontexte: []
}

personStore.currentPerson = mockPerson

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `
  router = createRouter({
    history: createWebHistory(),
    routes
  })

  router.push('/')
  await router.isReady()

  wrapper = mount(PersonDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonDetailsView
      },
      plugins: [router]
    }
  })
})

describe('PersonDetailsView', () => {
  test('it renders the person details page and shows person data', async () => {
    expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true)
    expect(wrapper?.find('[data-testid="person-vorname"]').text()).toBe('John')
    expect(wrapper?.find('[data-testid="person-familienname"]').text()).toBe('Orton')
    expect(wrapper?.find('[data-testid="person-username"]').text()).toBe('jorton')
  })

  test('it navigates back to user table', async () => {
    const push: MockInstance<
      [to: RouteLocationRaw],
      Promise<void | NavigationFailure | undefined>
    > = vi.spyOn(router, 'push')
    await wrapper?.find('[data-testid="close-layout-card"]').trigger('click')
    expect(push).toHaveBeenCalledTimes(1)
  })
})
