import type { PersonFrontendControllerFindPersons200Response, PersonendatensatzResponse } from '@/api-client/generated'
import { usePersonStore, type PersonStore, type Personendatensatz } from './PersonStore'
import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'
import { rejects } from 'assert'

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

      const mockResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons
      }

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockResponse, {})
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([...mockPersons])
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, 'some mock server error')
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, { code: 'some mock server error' })
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons()
      expect(personStore.loading).toBe(true)
      await getAllPersonPromise
      expect(personStore.allPersons).toEqual([])
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })

  describe('getPersonById', () => {
    it('should load Person and update state', async () => {
      const mockPerson: PersonendatensatzResponse = {
        person: {
          id: '1234',
          name: {
            familienname: 'Vimes',
            vorname: 'Samuel'
          }
        }
      } as PersonendatensatzResponse

      const mockResponse: PersonendatensatzResponse = mockPerson

      mockadapter.onGet('/api/personen/1234').replyOnce(200, mockResponse)
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('1234')
      expect(personStore.loading).toBe(true)
      const currentPerson: Personendatensatz = await getPersonByIdPromise
      expect(currentPerson).toEqual(mockPerson)
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, 'some mock server error')
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345')
      expect(personStore.loading).toBe(true)
      await rejects(getPersonByIdPromise)
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, { code: 'some mock server error' })
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345')
      expect(personStore.loading).toBe(true)
      await rejects(getPersonByIdPromise)
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })

  describe('resetPassword', () => {
    it('should reset and return password', async () => {
      const userId: string = '2345'
      const mockResponse: string = 'fakePassword'

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(200, mockResponse)
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      const generatedPassword: string = await resetPasswordPromise
      expect(generatedPassword).toEqual(mockResponse)
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      const userId: string = '2345'

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, 'some error')
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      await rejects(resetPasswordPromise)
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      const userId: string = '2345'

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, { code: 'some mock server error' })
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId)
      expect(personStore.loading).toBe(true)
      await rejects(resetPasswordPromise)
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })

  describe('createPerson', () => {
    it('should create a Person', async () => {
      const mockPersonResponse: PersonendatensatzResponse = {
        person: {
          id: '9876',
          name: {
            familienname: 'Cena',
            vorname: 'Randy'
          },
          referrer: 'rcena'
        }
      } as PersonendatensatzResponse

      const mockResponse: PersonendatensatzResponse = mockPersonResponse

      mockadapter.onPost('/api/personen').replyOnce(201, mockResponse)
      const createPersonPromise: Promise<PersonendatensatzResponse> = personStore.createPerson({
        name: {
          familienname: 'Cena',
          vorname: 'Randy'
        }
      })
      expect(personStore.loading).toBe(true)
      const createdPerson: PersonendatensatzResponse = await createPersonPromise
      expect(createdPerson).toEqual(mockPersonResponse)
      expect(personStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onPost('/api/personen').replyOnce(500, 'some error')
      const createPersonPromise: Promise<PersonendatensatzResponse> = personStore.createPerson({
        name: {
          familienname: 'Copeland',
          vorname: 'Christian'
        }
      })
      expect(personStore.loading).toBe(true)
      await rejects(createPersonPromise)
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(personStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onPost('/api/personen').replyOnce(500, { code: 'some mock server error' })
      const createPersonPromise: Promise<PersonendatensatzResponse> = personStore.createPerson({
        name: {
          familienname: 'Copeland',
          vorname: 'Christian'
        }
      })
      expect(personStore.loading).toBe(true)
      await rejects(createPersonPromise)
      expect(personStore.errorCode).toEqual('some mock server error')
      expect(personStore.loading).toBe(false)
    })
  })
})
