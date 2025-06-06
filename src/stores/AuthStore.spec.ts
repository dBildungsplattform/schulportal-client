import type { UserinfoResponse } from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { DoFactory } from 'test/DoFactory';
import { useAuthStore, type AuthStore } from './AuthStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('AuthStore', () => {
  let authStore: AuthStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(authStore.isAuthenticated).toBe(false);
  });

  describe('initializeAuthStatus', () => {
    it('should get login status', async () => {
      const mockInfo: UserinfoResponse = DoFactory.getUserinfoResponse();

      const mockResponse: UserinfoResponse = mockInfo;

      mockadapter.onGet('/api/auth/logininfo').replyOnce(200, mockResponse);
      const initializeAuthStatus: Promise<void> = authStore.initializeAuthStatus();
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.currentUser).toBe(null);
      expect(authStore.hasKlassenverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenverwaltungPermission).toBe(false);
      expect(authStore.hasRollenverwaltungPermission).toBe(false);
      expect(authStore.hasSchulverwaltungPermission).toBe(false);
      expect(authStore.hasSchultraegerverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenSyncPermission).toBe(false);
      expect(authStore.hasImportPermission).toBe(false);
      await initializeAuthStatus;
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.currentUser).toEqual(mockInfo);
      expect(authStore.hasKlassenverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenverwaltungPermission).toBe(false);
      expect(authStore.hasRollenverwaltungPermission).toBe(true);
      expect(authStore.hasSchulverwaltungPermission).toBe(true);
      expect(authStore.hasSchultraegerverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenSyncPermission).toBe(true);
      expect(authStore.hasImportPermission).toBe(true);
    });

    it('should save no system permissions if none are present', async () => {
      const mockResponse: UserinfoResponse = DoFactory.getUserinfoResponse({ personenkontexte: [] });

      mockadapter.onGet('/api/auth/logininfo').replyOnce(200, mockResponse);
      const initializeAuthStatus: Promise<void> = authStore.initializeAuthStatus();
      expect(authStore.isAuthenticated).toBe(false);
      expect(authStore.currentUserPermissions).toEqual([]);
      await initializeAuthStatus;
      expect(authStore.isAuthenticated).toBe(true);
      expect(authStore.currentUserPermissions).toEqual([]);
    });

    it('should not authenticate on server error', async () => {
      mockadapter.onGet('/api/auth/logininfo').replyOnce(401, 'unauthorized error');
      const initializeAuthStatus: Promise<void> = authStore.initializeAuthStatus();
      expect(authStore.isAuthenticated).toBe(false);
      await initializeAuthStatus;
      expect(authStore.isAuthenticated).toBe(false);
    });
  });
});
