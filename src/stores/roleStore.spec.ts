import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'
import { useRoleStore, type RoleStore } from './RoleStore'
import { type RolleResponse } from '../api-client/generated/api'
import { rejects } from 'assert'

const mockadapter: MockAdapter = new MockAdapter(ApiService)

describe('roleStore', () => {
  let roleStore: RoleStore
  beforeEach(() => {
    setActivePinia(createPinia())
    roleStore = useRoleStore()
    mockadapter.reset()
  })

  it('should initalize state correctly', () => {
    expect(roleStore.createdRole).toEqual(null)
    expect(roleStore.errorCode).toEqual('')
    expect(roleStore.loading).toBeFalsy()
  })

  describe('createRole', () => {
    it('should create role and update state', async () => {
      const mockResponse: RolleResponse[] = [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LERN',
          name: 'Lehrer',
          merkmale: 'KOPERS_PFLICHT',
          createdAt: '2022',
          updatedAt: '2022',
          id: '1'
        }
      ]

      mockadapter.onPost('/api/rolle').replyOnce(200, mockResponse)
      const createRolePromise: Promise<RolleResponse> = roleStore.createRole(
        'Lehrer',
        '1234',
        'Lern',
        ['KOPERS_PFLICHT']
      )
      expect(roleStore.loading).toBe(true)
      await createRolePromise
      expect(roleStore.createdRole).toEqual([...mockResponse])
      expect(roleStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, 'some mock server error')
      const createRolePromise: Promise<RolleResponse> = roleStore.createRole(
        'Lehrer',
        '1234',
        'Lern',
        ['KOPERS_PFLICHT']
      )
      expect(roleStore.loading).toBe(true)
      await rejects(createRolePromise)
      expect(roleStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(roleStore.createdRole).toEqual(null)
    })
    it('should handle error code', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, { code: 'some mock server error' })
      const createRolePromise: Promise<RolleResponse> = roleStore.createRole(
        'Lehrer',
        '1234',
        'Lern',
        ['KOPERS_PFLICHT']
      )
      expect(roleStore.loading).toBe(true)
      await expect(createRolePromise).rejects.toEqual('some mock server error')
      expect(roleStore.errorCode).toEqual('some mock server error')
      expect(roleStore.createdRole).toEqual(null)
    })
  })
})
