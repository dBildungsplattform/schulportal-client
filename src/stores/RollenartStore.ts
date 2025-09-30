import { RollenartApiFactory, type RollenartApiInterface } from '@/api-client/generated';
import axiosApiInstance from '@/services/ApiService';
import { defineStore, type Store, type StoreDefinition } from 'pinia';

export type RollenartListLms = {
  lmsName: string;
  rollenartList: string[];
};

const rollenartApi: RollenartApiInterface = RollenartApiFactory(undefined, '', axiosApiInstance);

type RollenartGetters = {};

type RollenartState = {
  rollenartList: string[];
};

type RollenartActions = {
  getAllRollenart: () => Promise<void>;
};
export type RollenartStore = Store<'rollenartStore', RollenartState, RollenartGetters, RollenartActions>;

export const useRollenartStore: StoreDefinition<'rollenartStore', RollenartState, RollenartGetters, RollenartActions> =
  defineStore('rollenartStore', {
    state: (): RollenartState => ({
      rollenartList: [],
    }),
    actions: {
      async getAllRollenart(): Promise<void> {
        const response: { data: string[] } = await rollenartApi.rollenartControllerGetAllLmsRollenarten();
        this.rollenartList = response.data;
      },
    },
  });
