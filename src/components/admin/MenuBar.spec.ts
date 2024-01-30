import { expect, test } from 'vitest'
import { VueWrapper, mount } from '@vue/test-utils'
// import { VuetifyLayoutKey } from "vuetify/lib/composables/index.mjs"
import MenuBar from './MenuBar.vue'


const VuetifyLayoutKey = Symbol.for('vuetify:layout')


let wrapper: VueWrapper | null = null

beforeEach(() => {
  document.body.innerHTML = `
  <v-app><v-layout><menu-bar></menu-bar></v-layout></v-app>
  `

  wrapper = mount(MenuBar, {
    global: {
      components: {
        MenuBar
      },
      provide: {
        [VuetifyLayoutKey]: {
          mainStyles: { value: "" },
          register: () => ({
            layoutItemStyles: { value: { top: 0 } },
            layoutItemScrimStyles: { value: { top: 0 } },
          }),
          unregister: () => ({}),
        }
      }
    }
  })
})

describe('MenuBar', () => {
  test('it renders the menu bar', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  test.skip('it renders user management links', () => {
    expect(wrapper?.find('[data-testid="menu-bar-title"]').isVisible()).toBe(true)
  })

  // TODO: can we rely on vuetify's mobile breakpoint in tests?
  // the only useful test would be for the different visuals on mobile/desktop
})
