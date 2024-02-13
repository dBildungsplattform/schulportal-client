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

let wrapper: VueWrapper | null = null
let router: Router

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
  test('it renders the person details page', async () => {
    expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true)
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
