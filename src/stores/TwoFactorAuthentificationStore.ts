import axiosApiInstance from '@/services/ApiService';
import { isAxiosError } from 'axios';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import {
  Class2FAApiFactory,
  type AssignHardwareTokenBodyParams,
  type AssignHardwareTokenResponse,
  type Class2FAApiInterface,
  type TokenInitBodyParams,
  type TokenRequiredResponse,
  type TokenStateResponse,
} from '../api-client/generated/api';

const twoFactorApi: Class2FAApiInterface = Class2FAApiFactory(undefined, '', axiosApiInstance);

type TwoFactorState = {
  errorCode: string;
  loading: boolean;
  hasToken: boolean | null;
  tokenKind: TokenKind | null;
  qrCode: string;
  serial: string;
  required: boolean;
};

type TwoFactorGetters = {};
type TwoFactorActions = {
  resetState: () => void;
  get2FAState: (personId: string) => Promise<void>;
  get2FARequirement: (personId: string) => Promise<void>;
  get2FASoftwareQRCode: (personId: string) => Promise<void>;
  assignHardwareToken: (
    assignHardwareTokenBodyParams: AssignHardwareTokenBodyParams,
  ) => Promise<AssignHardwareTokenResponse>;
  resetToken: (personId: string) => Promise<void>;
};

export type TwoFactorAuthentificationStore = Store<
  'twoFactorAuthentificationStore',
  TwoFactorState,
  TwoFactorGetters,
  TwoFactorActions
>;

export enum TokenKind {
  software = 'software',
  hardware = 'hardware',
}

export const useTwoFactorAuthentificationStore: StoreDefinition<
  'twoFactorAuthentificationStore',
  TwoFactorState,
  TwoFactorGetters,
  TwoFactorActions
> = defineStore({
  id: 'twoFactorAuthentificationStore',
  state: (): TwoFactorState => {
    return {
      errorCode: '',
      loading: false,
      hasToken: null,
      tokenKind: null,
      qrCode: '',
      serial: '',
      required: false,
    };
  },
  actions: {
    resetState() {
      this.$reset();
    },
    async get2FAState(personId: string) {
      this.loading = true;
      try {
        const twoFactorState: TokenStateResponse = (
          await twoFactorApi.privacyIdeaAdministrationControllerGetTwoAuthState(personId)
        ).data;

        this.hasToken = twoFactorState.hasToken;

        if (!twoFactorState.hasToken) {
          return;
        }

        switch (twoFactorState.tokenKind) {
          case 'hardware':
            this.tokenKind = TokenKind.hardware;
            break;
          case 'software':
            this.tokenKind = TokenKind.software;
            break;
          default:
            this.tokenKind = null;
        }
        this.serial = twoFactorState.serial;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async get2FARequirement(personId: string) {
      this.loading = true;
      this.required = false;
      try {
        const twoFactorState: TokenRequiredResponse = (
          await twoFactorApi.privacyIdeaAdministrationControllerRequiresTwoFactorAuthentication(personId)
        ).data;

        this.required = twoFactorState.required;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },

    async get2FASoftwareQRCode(personId: string) {
      this.loading = true;
      try {
        const bodyParams: TokenInitBodyParams = {
          personId: personId,
        };
        const qrCodeImageBase64: string = (
          await twoFactorApi.privacyIdeaAdministrationControllerInitializeSoftwareToken(bodyParams)
        ).data;

        this.qrCode = qrCodeImageBase64;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.code || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
    async assignHardwareToken(
      assignHardwareTokenBodyParams: AssignHardwareTokenBodyParams,
    ): Promise<AssignHardwareTokenResponse> {
      this.loading = true;
      try {
        const data: AssignHardwareTokenResponse = (
          await twoFactorApi.privacyIdeaAdministrationControllerAssignHardwareToken(assignHardwareTokenBodyParams)
        ).data;
        return data;
      } finally {
        this.loading = false;
      }
    },
    async resetToken(personId: string): Promise<void> {
      this.loading = true;
      try {
        await twoFactorApi.privacyIdeaAdministrationControllerResetToken(personId);
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'UNSPECIFIED_ERROR';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
