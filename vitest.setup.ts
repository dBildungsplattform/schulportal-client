import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import requestHandlers from './src/specs/request-handlers'

global.ResizeObserver = require('resize-observer-polyfill')

const i18n = createI18n({})

// TODO: how to fix i18n warnings for not found messages?
// the following statement throws an error
// config.global.mocks.$t = (key: string) => key

const vuetify = createVuetify({})

/* Setup mock server */
const server = setupServer(...requestHandlers)

/* Start mock server before all tests */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

/* Close mock server after all tests */
afterAll(() => server.close())

/* Reset request handlers after each test => `important for test isolation` */
afterEach(() => server.resetHandlers())

config.global.plugins = [
  i18n,
  vuetify
]