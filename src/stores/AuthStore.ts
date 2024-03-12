import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { AuthApiFactory, type AuthApiInterface, type UserinfoResponse } from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import type { AxiosResponse } from 'axios';

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
};

type AuthState = {
  isAuthed: boolean;
  currentUser: UserInfo | null;
};

type AuthActions = {
  initializeAuthStatus: () => Promise<void>;
  getLoggedInUserInfo: () => Promise<void>;
};

type AuthGetters = {};

export type AuthStore = Store<'authStore', AuthState, AuthGetters, AuthActions>;

const authApi: AuthApiInterface = AuthApiFactory(undefined, '', axiosApiInstance);

export const useAuthStore: StoreDefinition<'authStore', AuthState, AuthGetters, AuthActions> = defineStore({
  id: 'authStore',
  state: (): AuthState => ({
    isAuthed: false as boolean,
    currentUser: null,
  }),
  actions: {
    async initializeAuthStatus() {
      try {
        const { status: loginStatus }: { status: number } = await authApi.authenticationControllerInfo({
          validateStatus: null,
        });
        this.isAuthed = loginStatus >= 200 && loginStatus < 400;
      } catch {
        this.isAuthed = false;
      }
    },
    async getLoggedInUserInfo() {
      try {
        const { data }: AxiosResponse<UserinfoResponse> = await authApi.authenticationControllerInfo({
          validateStatus: null,
        });
        this.currentUser = data;
      } catch {
        // If retrieving user informations can't be done then consider the user unauthenticated.
        this.isAuthed = false;
      }
    },
  },
});
