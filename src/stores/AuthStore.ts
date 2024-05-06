import { defineStore, type Store, type StoreDefinition } from 'pinia';
import {
  AuthApiFactory,
  type AuthApiInterface,
  type PersonenkontextRolleFieldsResponse,
  type UserinfoResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import type { UserinfoPersonenkontext } from './PersonenkontextStore';

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
  updated_at: number | null;
  personId: string | null;
  personenkontexte: Array<PersonenkontextRolleFieldsResponse> | null;
};

type AuthState = {
  currentUser: UserInfo | null;
  currentUserPermissions: Array<string>;
  hasKlassenverwaltungPermission: boolean;
  hasPersonenverwaltungPermission: boolean;
  hasRollenverwaltungPermission: boolean;
  hasSchulverwaltungPermission: boolean;
  hasSchultraegerverwaltungPermission: boolean;
  isAuthed: boolean;
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
    hasKlassenverwaltungPermission: false,
    hasPersonenverwaltungPermission: false,
    hasRollenverwaltungPermission: false,
    hasSchulverwaltungPermission: false,
    hasSchultraegerverwaltungPermission: false,
    isAuthed: false,
  }),
  actions: {
    async initializeAuthStatus() {
      try {
        const { data, status: loginStatus }: { data: UserinfoResponse; status: number } =
          await authApi.authenticationControllerInfo({
            validateStatus: null,
          });

        this.isAuthed = loginStatus >= 200 && loginStatus < 400;
        this.currentUser = data;

        /* extract all system permissions from current user's personenkontexte */
        const personenkontexte: Array<UserinfoPersonenkontext> | null = this.currentUser.personenkontexte;
        personenkontexte?.forEach((personenkontext: UserinfoPersonenkontext) => {
          personenkontext.rolle.systemrechte.forEach((systemrecht: string) => {
            /* push unique permissions only */
            if (this.currentUserPermissions.indexOf(systemrecht) === -1) this.currentUserPermissions.push(systemrecht);
          });
        });

        /* set permission aliases for easier global access */
        this.hasKlassenverwaltungPermission = this.currentUserPermissions.includes('KLASSEN_VERWALTEN');
        this.hasPersonenverwaltungPermission = this.currentUserPermissions.includes('PERSONEN_VERWALTEN');
        this.hasRollenverwaltungPermission = this.currentUserPermissions.includes('ROLLEN_VERWALTEN');
        this.hasSchulverwaltungPermission = this.currentUserPermissions.includes('SCHULEN_VERWALTEN');
        this.hasSchultraegerverwaltungPermission = this.currentUserPermissions.includes('SCHULTRAEGER_VERWALTEN');
      } catch {
        // If user info can't be retrieved, consider the user unauthenticated.
        this.isAuthed = false;
      }
    },
  },
});
