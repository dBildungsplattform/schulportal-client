import type {
  PersonFrontendControllerFindPersons200Response,
  PersonendatensatzResponse,
  TokenStateResponse,
} from '@/api-client/generated';
import { usePersonStore, type PersonStore, type Personendatensatz } from './PersonStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonStore', () => {
  let personStore: PersonStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    personStore = usePersonStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(personStore.allPersons).toEqual([]);
    expect(personStore.errorCode).toEqual('');
    expect(personStore.loading).toBe(false);
  });

  describe('getAllPersons', () => {
    it('should load Persons and update state', async () => {
      const mockPersons: PersonendatensatzResponse[] = [
        {
          person: {
            id: '1234',
            name: {
              familienname: 'Vimes',
              vorname: 'Samuel',
            },
          },
        },
        {
          person: {
            id: '5678',
            name: {
              familienname: 'von Lipwig',
              vorname: 'Moist',
            },
          },
        },
      ] as PersonendatensatzResponse[];

      const mockResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };
      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockResponse, {});
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([...mockPersons]);
      expect(personStore.loading).toBe(false);
    });

    it('should load persons according to filter', async () => {
      const mockPersonsWithFilter: PersonendatensatzResponse[] = [
        {
          person: {
            id: '123456',
            name: {
              familienname: 'Vimes',
              vorname: 'Susan',
            },
          },
        },
      ] as PersonendatensatzResponse[];

      const mockResponseWithFilter: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 1,
        total: 1,
        items: mockPersonsWithFilter,
      };

      mockadapter.onGet('/api/personen-frontend?suchFilter=Sus').replyOnce(200, mockResponseWithFilter, {});
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({ searchFilter: 'Sus' });
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([...mockPersonsWithFilter]);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, 'some mock server error');
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([]);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, { code: 'some mock server error' });
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([]);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('getPersonById', () => {
    it('should load Person and update state', async () => {
      const mockPerson: PersonendatensatzResponse = {
        person: {
          id: '1234',
          name: {
            familienname: 'Vimes',
            vorname: 'Samuel',
          },
        },
      } as PersonendatensatzResponse;

      const mockResponse: PersonendatensatzResponse = mockPerson;

      mockadapter.onGet('/api/personen/1234').replyOnce(200, mockResponse);
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('1234');
      expect(personStore.loading).toBe(true);
      const currentPerson: Personendatensatz = await getPersonByIdPromise;
      expect(currentPerson).toEqual(mockPerson);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, 'some mock server error');
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345');
      expect(personStore.loading).toBe(true);
      await rejects(getPersonByIdPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, { code: 'some mock server error' });
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345');
      expect(personStore.loading).toBe(true);
      await rejects(getPersonByIdPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset and return password', async () => {
      const userId: string = '2345';
      const mockResponse: string = 'fakePassword';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(200, mockResponse);
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      const generatedPassword: string = await resetPasswordPromise;
      expect(generatedPassword).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, 'some error');
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await rejects(resetPasswordPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, { code: 'some mock server error' });
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await rejects(resetPasswordPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('get2FAState', () => {
    it('should get 2FA state', async () => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: true,
        tokenKind: 'software',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(personStore.twoFactorState.hasToken).toEqual(mockResponse.hasToken);
      expect(personStore.twoFactorState.tokenKind).toEqual(mockResponse.tokenKind);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(500, 'some error');
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await rejects(get2FAStatePromise);
      expect(personStore.twoFactorState.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(500, { code: 'some mock server error' });
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await rejects(get2FAStatePromise);
      expect(personStore.twoFactorState.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('get2FASoftwareQRCode', () => {
    it('should get 2FA software QR code', async () => {
      const personId: string = 'testUser';
      const mockResponse: string = 'fakeQRCode';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(200, mockResponse);
      const get2FASoftwareQRCodePromise: Promise<void> = personStore.get2FASoftwareQRCode(personId);
      expect(personStore.loading).toBe(true);
      await get2FASoftwareQRCodePromise;
      expect(personStore.twoFactorState.qrCode).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(500, 'some error');
      const get2FASoftwareQRCodePromise: Promise<void> = personStore.get2FASoftwareQRCode(personId);
      expect(personStore.loading).toBe(true);
      await rejects(get2FASoftwareQRCodePromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(500, { code: 'some mock server error' });
      const get2FASoftwareQRCodePromise: Promise<void> = personStore.get2FASoftwareQRCode(personId);
      expect(personStore.loading).toBe(true);
      await rejects(get2FASoftwareQRCodePromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });
  describe('resetToken', () => {
    it('should reset token successfully', async () => {
      const referrer: string = 'testReferrer';

      mockadapter.onPut(`/api/2fa-token/reset?personId=${referrer}`).replyOnce(200);

      const resetTokenPromise: Promise<void> = personStore.resetToken(referrer);
      expect(personStore.loading).toBe(true);
      await resetTokenPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('');
    });

    it('should handle string error', async () => {
      const referrer: string = 'testReferrer';

      mockadapter.onPut(`/api/2fa-token/reset?personId=${referrer}`).replyOnce(500, 'some error');

      const resetTokenPromise: Promise<void> = personStore.resetToken(referrer);
      expect(personStore.loading).toBe(true);
      await rejects(resetTokenPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const referrer: string = 'testReferrer';

      mockadapter.onPut(`/api/2fa-token/reset?personId=${referrer}`).replyOnce(500, { code: 'some mock server error' });

      const resetTokenPromise: Promise<void> = personStore.resetToken(referrer);
      expect(personStore.loading).toBe(true);
      await rejects(resetTokenPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });
});
