import type {
  AssignHardwareTokenResponse,
  TokenStateResponse,
  AssignHardwareTokenBodyParams,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';

import {
  TokenKind,
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from './TwoFactorAuthentificationStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('TwoFactorAuthentificationStore', () => {
  let twoFactorAuthenticationStore: TwoFactorAuthentificationStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    twoFactorAuthenticationStore = useTwoFactorAuthentificationStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(twoFactorAuthenticationStore.hasToken).toEqual(null);
    expect(twoFactorAuthenticationStore.tokenKind).toEqual(null);
    expect(twoFactorAuthenticationStore.errorCode).toEqual('');
    expect(twoFactorAuthenticationStore.loading).toBe(false);
    expect(twoFactorAuthenticationStore.qrCode).toBe('');
  });

  describe('get2FAState', () => {
    it.each(['software', 'hardware'])('should get 2FA state with token', async (tokenKind: string) => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: true,
        tokenKind: tokenKind,
        serial: '1234',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(twoFactorAuthenticationStore.hasToken).toEqual(mockResponse.hasToken);
      expect(twoFactorAuthenticationStore.tokenKind).toEqual(mockResponse.tokenKind);
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should get 2FA state without token', async () => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: false,
        tokenKind: '',
        serial: '',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(twoFactorAuthenticationStore.hasToken).toEqual(mockResponse.hasToken);
      expect(twoFactorAuthenticationStore.tokenKind).toEqual(null);
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('unknown tokenkind maps to null', async () => {
      const personId: string = 'testUser';
      const mockResponse: TokenStateResponse = {
        hasToken: true,
        tokenKind: 'abc',
        serial: '1234',
      };

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(200, mockResponse);
      const get2FAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await get2FAStatePromise;
      expect(twoFactorAuthenticationStore.hasToken).toEqual(mockResponse.hasToken);
      expect(twoFactorAuthenticationStore.tokenKind).toEqual(null);
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(500, 'some error');
      const get2FAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await rejects(get2FAStatePromise);
      expect(twoFactorAuthenticationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';

      mockadapter.onGet(`/api/2fa-token/state?personId=${personId}`).replyOnce(500, { code: 'some mock server error' });
      const get2FAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await rejects(get2FAStatePromise);
      expect(twoFactorAuthenticationStore.errorCode).toEqual('some mock server error');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });
  });

  describe('get2FASoftwareQRCode', () => {
    it('should get 2FA software QR code', async () => {
      const personId: string = 'testUser';
      const mockResponse: string = 'fakeQRCode';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(200, mockResponse);
      const get2FASoftwareQRCodePromise: Promise<void> = twoFactorAuthenticationStore.get2FASoftwareQRCode(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await get2FASoftwareQRCodePromise;
      expect(twoFactorAuthenticationStore.qrCode).toEqual(mockResponse);
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(500, 'some error');
      const get2FASoftwareQRCodePromise: Promise<void> = twoFactorAuthenticationStore.get2FASoftwareQRCode(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await rejects(get2FASoftwareQRCodePromise);
      expect(twoFactorAuthenticationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';

      mockadapter.onPost(`/api/2fa-token/init`).replyOnce(500, { code: 'some mock server error' });
      const get2FASoftwareQRCodePromise: Promise<void> = twoFactorAuthenticationStore.get2FASoftwareQRCode(personId);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await rejects(get2FASoftwareQRCodePromise);
      expect(twoFactorAuthenticationStore.errorCode).toEqual('some mock server error');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });
  });

  describe('assignHardwareToken', () => {
    it('should assign hardware token and update state', async () => {
      const personId: string = 'testUser';

      const personUserName: string = 'testUserName';
      const serial: string = '123456789';
      const otp: string = '987654';
      const mockResponse: AssignHardwareTokenResponse = {
        id: 1,
        jsonrpc: '2.0',
        time: 1622547800,
        version: '1.0',
        versionnumber: '1.0.0',
        signature: 'abcdef123456',
        dialogText: 'This is a mock dialog text',
      };

      const bodyParams: AssignHardwareTokenBodyParams = {
        userId: personId,
        referrer: personUserName,
        serial,
        otp,
      };

      mockadapter.onPost('/api/2fa-token/assign/hardwareToken').reply(200, mockResponse);

      const assignTokenPromise: Promise<AssignHardwareTokenResponse> =
        twoFactorAuthenticationStore.assignHardwareToken(bodyParams);
      expect(twoFactorAuthenticationStore.loading).toBe(true);

      const response: AssignHardwareTokenResponse = await assignTokenPromise;
      expect(response).toEqual(mockResponse);
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });
  });
  describe('resetToken', () => {
    it('should reset token successfully', async () => {
      const referrer: string = 'testReferrer';

      mockadapter.onPut(`/api/2fa-token/reset?personId=${referrer}`).replyOnce(200);

      const resetTokenPromise: Promise<void> = twoFactorAuthenticationStore.resetToken(referrer);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await resetTokenPromise;
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });
  });

  describe('verify2FAToken', () => {
    it('should verify token', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';
      const mockResponse: boolean = true;

      mockadapter.onPost(`/api/2fa-token/verify`).replyOnce(200, mockResponse);
      const verifiedPromise: Promise<void> = twoFactorAuthenticationStore.verify2FAToken(personId, otp);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await verifiedPromise;
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';

      mockadapter.onPost(`/api/2fa-token/verify`).replyOnce(500, 'some error');
      const verified: Promise<void> = twoFactorAuthenticationStore.verify2FAToken(personId, otp);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await verified;
      expect(twoFactorAuthenticationStore.errorCode).toEqual('SOFTWARE_TOKEN_VERIFICATION_ERROR');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = 'testUser';
      const otp: string = '123456';

      mockadapter
        .onPost(`/api/2fa-token/verify`)
        .replyOnce(500, { code: 'some mock server error', i18nKey: 'OTP_NICHT_GUELTIG' });
      const verified: Promise<void> = twoFactorAuthenticationStore.verify2FAToken(personId, otp);
      expect(twoFactorAuthenticationStore.loading).toBe(true);
      await verified;
      expect(twoFactorAuthenticationStore.errorCode).toEqual('OTP_NICHT_GUELTIG');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset state', () => {
      twoFactorAuthenticationStore.errorCode = 'some error';
      twoFactorAuthenticationStore.loading = true;
      twoFactorAuthenticationStore.hasToken = true;
      twoFactorAuthenticationStore.tokenKind = TokenKind.software;
      twoFactorAuthenticationStore.qrCode = 'fakeQRCode';
      twoFactorAuthenticationStore.serial = '1234';

      twoFactorAuthenticationStore.resetState();
      expect(twoFactorAuthenticationStore.errorCode).toEqual('');
      expect(twoFactorAuthenticationStore.loading).toBe(false);
      expect(twoFactorAuthenticationStore.hasToken).toBe(null);
      expect(twoFactorAuthenticationStore.tokenKind).toBe(null);
      expect(twoFactorAuthenticationStore.qrCode).toBe('');
      expect(twoFactorAuthenticationStore.serial).toBe('');
    });
  });
});
