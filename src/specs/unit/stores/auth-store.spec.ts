import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/AuthStore'

describe('Auth Store', () => {
  beforeEach(() => {
    /* creates a fresh pinia and makes it active
       so it's automatically picked up by any useStore() call
       without having to pass it to it: `useStore(pinia)` */
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.removeItem('user')
  })

  test('it logs in and writes access token to local storage', async () => {
    expect(localStorage.getItem('user')).toBe(null)
    
    const authStore = useAuthStore()
    await authStore.login('username', 'password')

    const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}')
    expect(localStorageUser).toHaveProperty(['data', 'access_token'], 'qwertzuiop')
  })

  test('it fails to log in with false credentials', async () => {
    expect(localStorage.getItem('user')).toBe(null)
    
    const authStore = useAuthStore()
    await authStore.login('username', '')

    // expect request to return an error
  })

  test('it logs out', async () => {
    const authStore = useAuthStore()
    await authStore.login('username', 'password')

    await authStore.logout()
    expect(localStorage.getItem('user')).toBe(null)
  })

  test('it resets a user\'s password', async () => {
    const authStore = useAuthStore()
    await authStore.resetPassword('1').then((response) => {
      expect(response).toBe('qwertzuiop')
    })
  })
})