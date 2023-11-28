import { config } from '@vue/test-utils'
import { I18n, createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { afterAll, afterEach, beforeAll } from 'vitest'
// MSW will probably be removed soon anyways
// eslint-disable-next-line import/no-extraneous-dependencies, import/named
import { SetupServer, setupServer } from 'msw/node'
import requestHandlers from './src/specs/request-handlers'

const i18n: I18n = createI18n({
  legacy: false
})

// TODO: how to fix i18n warnings for not found messages?
// the following statement throws an error
// config.global.mocks.$t = (key: string) => key

// eslint-disable-next-line @typescript-eslint/typedef
const vuetify = createVuetify({})

/* Setup mock server */
const server: SetupServer = setupServer(...requestHandlers)

/* Start mock server before all tests */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

/* Close mock server after all tests */
afterAll(() => server.close())

/* Reset request handlers after each test => `important for test isolation` */
afterEach(() => server.resetHandlers())

config.global.plugins = [i18n, vuetify]
