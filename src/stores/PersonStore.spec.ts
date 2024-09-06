import {
  OrganisationsTyp,
  RollenMerkmal,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type PersonFrontendControllerFindPersons200Response,
  type PersonendatensatzResponse,
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
    expect(personStore.errorCode).toEqual('');
    expect(personStore.loading).toBe(false);
  });

  describe('getAllPersons', () => {
    it('should load persons and their overviews, and update state', async () => {
      // Mock data for persons
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

      // Mock response for persons
      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      // Mock data for person overviews
      const mockUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response = {
        total: 2,
        offset: 0,
        limit: 2,
        items: [
          {
            personId: '1234',
            vorname: 'Samuel',
            nachname: 'Vimes',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: 'string',
                rolleId: 'string',
                sskName: 'string',
                sskDstNr: 'string',
                rolle: 'string',
                typ: OrganisationsTyp.Klasse,
                administriertVon: 'string',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
              },
            ],
          },
        ],
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      // Update the mock POST request with the appropriate body
      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(200, mockUebersichten);

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error response', async () => {
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

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(500, 'Some error occurred');

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
    });

    it('should handle error code in response', async () => {
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

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(500, { code: 'SERVER_ERROR' });

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('SERVER_ERROR');
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

  describe('getPersonenuebersichtById', () => {
    it('should get Personenuebersicht', async () => {
      const mockResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'string',
        nachname: 'string',
        benutzername: 'string',
        lastModifiedZuordnungen: '08.02.2024',
        zuordnungen: [
          {
            sskId: 'string',
            rolleId: 'string',
            sskName: 'string',
            sskDstNr: 'string',
            rolle: 'string',
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
            merkmale: [] as unknown as RollenMerkmal,
          },
        ],
      };

      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockResponse);
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.personenuebersicht).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, 'some error');
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { code: 'some mock server error' });
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });
  describe('get2FAState', () => {
    it.each(['software', 'hardware'])('should get 2FA state with token', async (tokenKind: string) => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: true,
        tokenKind: tokenKind,
        tokenSerial: '1234',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(personStore.twoFactorState.hasToken).toEqual(mockResponse.hasToken);
      expect(personStore.twoFactorState.tokenKind).toEqual(mockResponse.tokenKind);
      expect(personStore.loading).toBe(false);
    });

    it('should get 2FA state without token', async () => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: false,
        tokenKind: '',
        tokenSerial: '',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(personStore.twoFactorState.hasToken).toEqual(mockResponse.hasToken);
      expect(personStore.twoFactorState.tokenKind).toEqual(null);
      expect(personStore.loading).toBe(false);
    });

    it('unknown tokenkind maps to null', async () => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: true,
        tokenKind: 'abc',
        tokenSerial: '1234',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = personStore.get2FAState(personId);
      expect(personStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(personStore.twoFactorState.hasToken).toEqual(mockResponse.hasToken);
      expect(personStore.twoFactorState.tokenKind).toEqual(null);
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

  describe('verify2FAToken', () => {
    it('should verify token', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';
      const mockResponse: boolean = true;

      mockadapter.onPost(`/api/2fa-token/verify`).replyOnce(200, mockResponse);
      const verifiedPromise: Promise<boolean> = personStore.verify2FAToken(personId, otp);
      expect(personStore.loading).toBe(true);
      const verified: boolean = await verifiedPromise;
      expect(verified).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';

      mockadapter.onPost(`/api/2fa-token/verify`).replyOnce(500, 'some error');
      const verified: Promise<boolean> = personStore.verify2FAToken(personId, otp);
      expect(personStore.loading).toBe(true);
      await rejects(verified);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';

      mockadapter.onPost(`/api/2fa-token/verify`).replyOnce(500, { code: 'some mock server error' });
      const verified: Promise<boolean> = personStore.verify2FAToken(personId, otp);
      expect(personStore.loading).toBe(true);
      await rejects(verified);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('deletePerson', () => {
    it('should delete person', async () => {
      const personId: string = 'testUser';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(200, {});
      const deletionPromise: Promise<void> = personStore.deletePerson(personId);
      expect(personStore.loading).toBe(true);
      await deletionPromise;
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(500, 'some error');
      const deletionPromise: Promise<void> = personStore.deletePerson(personId);
      expect(personStore.loading).toBe(true);
      await rejects(deletionPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(500, { code: 'some mock server error' });
      const deletionPromise: Promise<void> = personStore.deletePerson(personId);
      expect(personStore.loading).toBe(true);
      await rejects(deletionPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset state', () => {
      personStore.allPersons = [
        {
          person: {
            id: '1234',
            name: {
              familienname: 'Vimes',
              vorname: 'Samuel',
            },
          },
        },
      ] as PersonendatensatzResponse[];

      personStore.errorCode = 'some error';
      personStore.loading = true;
      personStore.totalPersons = 1;
      personStore.currentPerson = {
        person: {
          id: '1234',
          name: {
            familienname: 'Vimes',
            vorname: 'Samuel',
          },
        },
      } as PersonendatensatzResponse;
      personStore.twoFactorState = {
        hasToken: true,
        tokenKind: 'software',
        qrCode: 'fakeQRCode',
        errorCode: 'some error',
      };

      personStore.resetState();
      expect(personStore.allPersons).toEqual([]);
      expect(personStore.errorCode).toEqual('');
      expect(personStore.loading).toBe(false);
      expect(personStore.totalPersons).toBe(0);
      expect(personStore.currentPerson).toBe(null);
      expect(personStore.twoFactorState).toEqual({
        hasToken: null,
        tokenKind: null,
        qrCode: '',
        errorCode: '',
      });
    });
  });
});
