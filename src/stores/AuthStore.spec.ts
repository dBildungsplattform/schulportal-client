import type { UserinfoResponse } from '@/api-client/generated';
import { useAuthStore, type AuthStore } from './AuthStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('AuthStore', () => {
  let authStore: AuthStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(authStore.isAuthed).toBe(false);
  });

  describe('initializeAuthStatus', () => {
    it('should get login status', async () => {
      const mockInfo: UserinfoResponse = {
        email: 'albert@test.de',
        email_verified: true,
        family_name: 'Test',
        given_name: 'Albert',
        name: 'Albert Test',
        preferred_username: 'albert',
        sub: 'c71be903-d0ec-4207-b653-40c114680b63',
        personenkontexte: [
          {
            organisationsId: '123456',
            rolle: {
              systemrechte: ['ROLLEN_VERWALTEN', 'SCHULEN_VERWALTEN', 'PERSON_SYNCHRONISIEREN'],
              serviceProviderIds: ['789897798'],
            },
          },
        ],
      } as UserinfoResponse;

      const mockResponse: UserinfoResponse = mockInfo;

      mockadapter.onGet('/api/auth/logininfo').replyOnce(200, mockResponse);
      const initializeAuthStatus: Promise<void> = authStore.initializeAuthStatus();
      expect(authStore.isAuthed).toBe(false);
      expect(authStore.currentUser).toBe(null);
      expect(authStore.hasKlassenverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenverwaltungPermission).toBe(false);
      expect(authStore.hasRollenverwaltungPermission).toBe(false);
      expect(authStore.hasSchulverwaltungPermission).toBe(false);
      expect(authStore.hasSchultraegerverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenSyncPermission).toBe(false);
      await initializeAuthStatus;
      expect(authStore.isAuthed).toBe(true);
      expect(authStore.currentUser).toEqual(mockInfo);
      expect(authStore.hasKlassenverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenverwaltungPermission).toBe(false);
      expect(authStore.hasRollenverwaltungPermission).toBe(true);
      expect(authStore.hasSchulverwaltungPermission).toBe(true);
      expect(authStore.hasSchultraegerverwaltungPermission).toBe(false);
      expect(authStore.hasPersonenSyncPermission).toBe(true);
    });

    it('should not authenticate on server error', async () => {
      mockadapter.onGet('/api/auth/logininfo').replyOnce(401, 'unauthorized error');
      const initializeAuthStatus: Promise<void> = authStore.initializeAuthStatus();
      expect(authStore.isAuthed).toBe(false);
      await initializeAuthStatus;
      expect(authStore.isAuthed).toBe(false);
    });
  });
});
