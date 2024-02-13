import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'
import { useRolleStore, type RolleStore } from './RolleStore'
import { RolleResponseMerkmaleEnum, type RolleResponse } from '../api-client/generated/api'
import { rejects } from 'assert'

const mockadapter: MockAdapter = new MockAdapter(ApiService)

describe('rolleStore', () => {
  let rolleStore: RolleStore
  beforeEach(() => {
    setActivePinia(createPinia())
    rolleStore = useRolleStore()
    mockadapter.reset()
  })

  it('should initalize state correctly', () => {
    expect(rolleStore.createdRolle).toEqual(null)
    expect(rolleStore.errorCode).toEqual('')
    expect(rolleStore.loading).toBeFalsy()
  })

  describe('createRolle', () => {
    it('should create role and update state', async () => {
      const mockResponse: RolleResponse[] = [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LEHR',
          name: 'Lehrer',
          merkmale: new Set([RolleResponseMerkmaleEnum.KopersPflicht]),
          createdAt: '2022',
          updatedAt: '2022',
          id: '1'
        }
      ]

      mockadapter.onPost('/api/rolle').replyOnce(200, mockResponse)
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        new Set([RolleResponseMerkmaleEnum.KopersPflicht])
      )
      expect(rolleStore.loading).toBe(true)
      await createRollePromise
      expect(new Set(rolleStore.createdRolle.merkmale)).toEqual(new Set(mockResponse[0].merkmale));
      expect(rolleStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, 'some mock server error')
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        new Set([RolleResponseMerkmaleEnum.KopersPflicht])
      )
      expect(rolleStore.loading).toBe(true)
      await rejects(createRollePromise)
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(rolleStore.createdRolle).toEqual(null)
      expect(rolleStore.loading).toBe(false)
    })
    it('should handle error code', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, { code: 'some mock server error' })
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        new Set([RolleResponseMerkmaleEnum.KopersPflicht])
      )
      expect(rolleStore.loading).toBe(true)
      await expect(createRollePromise).rejects.toEqual('some mock server error')
      expect(rolleStore.errorCode).toEqual('some mock server error')
      expect(rolleStore.createdRolle).toEqual(null)
      expect(rolleStore.loading).toBe(false)
    })
  })
})
