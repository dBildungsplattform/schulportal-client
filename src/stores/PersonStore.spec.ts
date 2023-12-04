import { usePersonStore, type PersonStore, type Person } from './PersonStore'
import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'

const mockadapter: MockAdapter = new MockAdapter(ApiService)

describe('PersonStore', () => {
  let personStore: PersonStore
  beforeEach(() => {
    setActivePinia(createPinia())
    personStore = usePersonStore()
    mockadapter.reset()
  })

  it('should initalize state correctly', () => {
    expect(personStore.allPersons).toEqual([])
    expect(personStore.errorCode).toEqual('')
    expect(personStore.loading).toBeFalsy()
  })

  describe('getAllPersons', () => {
    it('should load Persons and update state', async () => {
      const mockResponse: Person[] = [
        {
          person: {
            id: '1234',
            name: {
              familienname: 'Vimes',
              vorname: 'Samuel'
            }
          }
        },
        {
          person: {
            id: '5678',
            name: {
              familienname: 'von Lipwig',
              vorname: 'Moist'
            }
          }
        }
      ]

      mockadapter.onGet('/personen').replyOnce(200, mockResponse)
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([...mockResponse])
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/personen').replyOnce(500, 'some mock server error')
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/personen').replyOnce(500, { code: 'some mock server error' })
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('should load Persons and update state', async () => {
      const userId: string = '2345'
      const mockResponse: string = 'fakePassword'

      mockadapter.onPatch(`/personen/${userId}/password`).replyOnce(200, mockResponse)
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      const generatedPassword: string = await resetPasswordPromise
      expect(generatedPassword).toEqual(mockResponse)
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      const userId: string = '2345'

      mockadapter.onPatch(`/personen/${userId}/password`).replyOnce(500, 'some error')
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      await resetPasswordPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      const userId: string = '2345'

      mockadapter
        .onPatch(`/personen/${userId}/password`)
        .replyOnce(500, { code: 'some mock server error' })
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      await resetPasswordPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })
})
