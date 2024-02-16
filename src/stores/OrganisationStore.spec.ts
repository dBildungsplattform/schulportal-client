import { useOrganisationStore, type OrganisationStore } from './OrganisationStore'
import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'
import { type OrganisationResponse, OrganisationResponseTypEnum } from '../api-client/generated/api'

const mockadapter: MockAdapter = new MockAdapter(ApiService)

describe('OrganisationStore', () => {
  let organisationStore: OrganisationStore
  beforeEach(() => {
    setActivePinia(createPinia())
    organisationStore = useOrganisationStore()
    mockadapter.reset()
  })

  it('should initialize state correctly', () => {
    expect(organisationStore.allOrganisationen).toEqual([])
    expect(organisationStore.errorCode).toEqual('')
    expect(organisationStore.loading).toBeFalsy()
  })

  describe('getAllOrganisations', () => {
    it('should fetch all organisations and update state', async () => {
      const mockResponse: OrganisationResponse[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationResponseTypEnum.Anbieter
        }
      ]

      mockadapter.onGet('/api/organisationen').replyOnce(200, mockResponse)
      const getAllOrgaisationsPromise: Promise<void> = organisationStore.getAllOrganisationen()
      await getAllOrgaisationsPromise
      expect(organisationStore.allOrganisationen).toEqual(mockResponse)
      expect(organisationStore.loading).toBeFalsy()
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen').replyOnce(500, 'some mock server error')
      const getAllOrgaisationsPromise: Promise<void> = organisationStore.getAllOrganisationen()
      expect(organisationStore.loading).toBe(true)
      await getAllOrgaisationsPromise
      expect(organisationStore.allOrganisationen).toEqual([])
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(organisationStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen').replyOnce(500, { code: 'some mock server error' })
      const getAllOrgaisationsPromise: Promise<void> = organisationStore.getAllOrganisationen()
      expect(organisationStore.loading).toBe(true)
      await getAllOrgaisationsPromise
      expect(organisationStore.allOrganisationen).toEqual([])
      expect(organisationStore.errorCode).toEqual('some mock server error')
      expect(organisationStore.loading).toBe(false)
    })
  })
})
