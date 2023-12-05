import type { FrontendControllerPersons200Response, PersonendatensatzResponse } from '@/api-client/generated'
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
      const mockPersons: PersonendatensatzResponse[] = [
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
      ] as PersonendatensatzResponse[]

      const mockResponse: FrontendControllerPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons
      };

      mockadapter.onGet('/api/frontend/personen').replyOnce(200, mockResponse)
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([...mockPersons])
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/api/frontend/personen').replyOnce(500, 'some mock server error')
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/api/frontend/personen').replyOnce(500, { code: 'some mock server error' })
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('should reset and return password', async () => {
      const userId: string = '2345'
      const mockResponse: string = 'fakePassword'

      mockadapter.onPatch(`/api/frontend/personen/${userId}/password`).replyOnce(200, mockResponse)
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      const generatedPassword: string = await resetPasswordPromise
      expect(generatedPassword).toEqual(mockResponse)
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      const userId: string = '2345'

      mockadapter.onPatch(`/api/frontend/personen/${userId}/password`).replyOnce(500, 'some error')
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
        .onPatch(`/api/frontend/personen/${userId}/password`)
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
