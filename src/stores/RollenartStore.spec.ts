import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { useRollenartStore, type RollenartStore } from './RollenartStore';

const mockAdapter: MockAdapter = new MockAdapter(ApiService);

describe('RollenartStore', () => {
  let rollenartStore: RollenartStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    rollenartStore = useRollenartStore();
    mockAdapter.reset();
  });

  it('should initialize empty state', () => {
    expect(rollenartStore.rollenartList.length).toEqual(0);
  });

  describe('getAllRollenart', () => {
    it('should fetch and set rollenartList', async () => {
      const mockRollenartList: string[] = ['teacher', 'user', 'student'];
      mockAdapter.onGet('/api/rollenart').reply(200, mockRollenartList);

      const getAllRollenartPromise: Promise<void> = rollenartStore.getAllRollenart();
      await getAllRollenartPromise;

      mockRollenartList.forEach((item) => {
        expect(rollenartStore.rollenartList).toContain(item);
      });
      expect(rollenartStore.rollenartList).toEqual(mockRollenartList);
    });

    it('should overwrite rollenartList on multiple fetches', async () => {
      const firstList = ['admin', 'editor'];
      const secondList = ['viewer', 'contributor'];
      mockAdapter.onGet('/api/rollenart').replyOnce(200, firstList).onGet('/api/rollenart').replyOnce(200, secondList);

      await rollenartStore.getAllRollenart();
      expect(rollenartStore.rollenartList).toEqual(firstList);

      await rollenartStore.getAllRollenart();
      expect(rollenartStore.rollenartList).toEqual(secondList);
    });

    it('should set rollenartList to empty array if API returns empty', async () => {
      mockAdapter.onGet('/api/rollenart').reply(200, []);
      await rollenartStore.getAllRollenart();
      expect(rollenartStore.rollenartList).toEqual([]);
    });

    it('should not update rollenartList if API call fails', async () => {
      const initialList = ['existing'];
      rollenartStore.rollenartList = initialList.slice();
      mockAdapter.onGet('/api/rollenart').reply(500);

      await expect(rollenartStore.getAllRollenart()).rejects.toThrow();
      expect(rollenartStore.rollenartList).toEqual(initialList);
    });
  });
});
