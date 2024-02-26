import { expect, test, type MockInstance } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
import SchuleCreationView from './SchuleCreationView.vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  createRouter,
  createWebHistory,
  type NavigationFailure,
  type RouteLocationRaw,
  type Router
} from 'vue-router'
import routes from '@/router/routes'

let wrapper: VueWrapper | null = null
let router: Router

beforeEach(async () => {
  setActivePinia(createPinia())
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

  wrapper = mount(SchuleCreationView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        SchuleCreationView
      },
      plugins: [router]
    }
  })
})

describe('SchuleCreationView', () => {
  test('it renders the schule form', () => {
    expect(wrapper?.find('[data-testid="dienstellennummer-input"]').isVisible()).toBe(true)
  })
})

