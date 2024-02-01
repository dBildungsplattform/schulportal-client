import ApiService from '@/services/ApiService'
import MockAdapter from 'axios-mock-adapter'
import { setActivePinia, createPinia } from 'pinia'
import { useProviderStore, type ProviderStore, type Provider } from './ProviderStore'

const mockadapter: MockAdapter = new MockAdapter(ApiService)

describe('providerStore', () => {
  let providerStore: ProviderStore
  beforeEach(() => {
    setActivePinia(createPinia())
    providerStore = useProviderStore()
    mockadapter.reset()
  })

  it('should initalize state correctly', () => {
    expect(providerStore.allProviders).toEqual([])
    expect(providerStore.errorCode).toEqual('')
    expect(providerStore.loading).toBeFalsy()
  })

  describe('getAllProviders', () => {
    it('should load providers and update state', async () => {
      const mockResponse: Provider[] = [
        { id: '1234', name: 'itslearning mock', url: 'example.org/itslearning' },
        { id: '5678', name: 'administration mock', url: '/admin' }
      ]

      mockadapter.onGet('/api/provider').replyOnce(200, mockResponse)
      const getAllProvidersPromise: Promise<void> = providerStore.getAllProviders()
      expect(providerStore.loading).toBe(true)
      await getAllProvidersPromise
      expect(providerStore.allProviders).toEqual([...mockResponse])
      expect(providerStore.loading).toBe(false)
    })

    it('should handle string error', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, 'some mock server error')
      const getAllProvidersPromise: Promise<void> = providerStore.getAllProviders()
      expect(providerStore.loading).toBe(true)
      await getAllProvidersPromise
      expect(providerStore.allProviders).toEqual([])
      expect(providerStore.errorCode).toEqual('UNSPECIFIED_ERROR')
      expect(providerStore.loading).toBe(false)
    })

    it('should handle error code', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, { code: 'some mock server error' })
      const getAllProvidersPromise: Promise<void> = providerStore.getAllProviders()
      expect(providerStore.loading).toBe(true)
      await getAllProvidersPromise
      expect(providerStore.allProviders).toEqual([])
      expect(providerStore.errorCode).toEqual('some mock server error')
      expect(providerStore.loading).toBe(false)
    })
  })
})
