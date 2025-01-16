import { defineStore, type Store, type StoreDefinition } from 'pinia';
import {
  AuthApiFactory,
  type AuthApiInterface,
  type PersonTimeLimitInfoResponse,
  type PersonenkontextRolleFieldsResponse,
  type UserinfoResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import type { UserinfoPersonenkontext } from './PersonenkontextStore';

export enum StepUpLevel {
  NONE = 'none',
  SILVER = 'silver',
  GOLD = 'gold',
}

export type UserInfo = {
  sub: string;
  name: string | null;
  given_name: string | null;
  family_name: string | null;
  middle_name: string | null;
  nickname: string | null;
  preferred_username: string | null;
  profile: string | null;
  picture: string | null;
  website: string | null;
  email: string | null;
  email_verified: boolean | null;
  gender: string | null;
  birthdate: string | null;
  zoneinfo: string | null;
  locale: string | null;
  phone_number: string | null;
  updated_at: string | null;
  personId: string | null;
  personenkontexte: Array<PersonenkontextRolleFieldsResponse> | null;
  password_updated_at: string | null;
};

type AuthState = {
  currentUser: UserInfo | null;
  currentUserPermissions: Array<string>;
  hasImportPermission: boolean;
  hasKlassenverwaltungPermission: boolean;
  hasPersonenAnlegenPermission: boolean;
  hasPersonenLoeschenPermission: boolean;
  hasPersonenSyncPermission: boolean;
  hasPersonenverwaltungPermission: boolean;
  hasRollenverwaltungPermission: boolean;
  hasSchulverwaltungPermission: boolean;
  hasSchultraegerverwaltungPermission: boolean;
  isAuthed: boolean;
  acr: StepUpLevel;
  timeLimitInfos: PersonTimeLimitInfoResponse[];
};

type AuthActions = {
  initializeAuthStatus: () => Promise<void>;
};

type AuthGetters = {};

export type AuthStore = Store<'authStore', AuthState, AuthGetters, AuthActions>;

const authApi: AuthApiInterface = AuthApiFactory(undefined, '', axiosApiInstance);

export const useAuthStore: StoreDefinition<'authStore', AuthState, AuthGetters, AuthActions> = defineStore({
  id: 'authStore',
  state: (): AuthState => ({
    currentUser: null,
    currentUserPermissions: [],
    hasImportPermission: false,
    hasKlassenverwaltungPermission: false,
    hasPersonenAnlegenPermission: false,
    hasPersonenLoeschenPermission: false,
    hasPersonenSyncPermission: false,
    hasPersonenverwaltungPermission: false,
    hasRollenverwaltungPermission: false,
    hasSchulverwaltungPermission: false,
    hasSchultraegerverwaltungPermission: false,
    isAuthed: false,
    acr: StepUpLevel.NONE,
    timeLimitInfos: [],
  }),
  actions: {
    async initializeAuthStatus() {
      try {
        const { data, status: loginStatus }: { data: UserinfoResponse; status: number } =
          await authApi.authenticationControllerInfo({
            validateStatus: null,
          });

        if (loginStatus >= 200 && loginStatus < 400) {
          this.isAuthed = true;
          this.currentUser = data;
          this.acr = data.acr as StepUpLevel;
          this.timeLimitInfos = data.timeLimits;

          /* extract all system permissions from current user's personenkontexte */
          const personenkontexte: Array<UserinfoPersonenkontext> | null = this.currentUser.personenkontexte;
          personenkontexte?.forEach((personenkontext: UserinfoPersonenkontext) => {
            personenkontext.rolle.systemrechte.forEach((systemrecht: string) => {
              /* push unique permissions only */
              if (systemrecht && this.currentUserPermissions.indexOf(systemrecht) === -1)
                this.currentUserPermissions.push(systemrecht);
            });
          });

          /* set permission aliases for easier global access */
          this.hasImportPermission = this.currentUserPermissions.includes('IMPORT_DURCHFUEHREN');
          this.hasKlassenverwaltungPermission = this.currentUserPermissions.includes('KLASSEN_VERWALTEN');
          this.hasPersonenAnlegenPermission = this.currentUserPermissions.includes('PERSONEN_ANLEGEN');
          this.hasPersonenLoeschenPermission = this.currentUserPermissions.includes('PERSONEN_SOFORT_LOESCHEN');
          this.hasPersonenSyncPermission = this.currentUserPermissions.includes('PERSON_SYNCHRONISIEREN');
          this.hasPersonenverwaltungPermission = this.currentUserPermissions.includes('PERSONEN_VERWALTEN');
          this.hasRollenverwaltungPermission = this.currentUserPermissions.includes('ROLLEN_VERWALTEN');
          this.hasSchulverwaltungPermission = this.currentUserPermissions.includes('SCHULEN_VERWALTEN');
          this.hasSchultraegerverwaltungPermission = this.currentUserPermissions.includes('SCHULTRAEGER_VERWALTEN');
        } else {
          throw new Error('User info could not be retrieved.');
        }
      } catch {
        // If user info can't be retrieved, consider the user unauthenticated.
        this.isAuthed = false;
      }
    },
  },
});
