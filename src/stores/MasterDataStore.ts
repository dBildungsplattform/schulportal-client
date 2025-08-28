import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { RolleApiFactory, type RolleApiInterface, type SystemRechtResponse } from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';
import { SystemRecht } from './types/Systemrecht';

const rolleApi: RolleApiInterface = RolleApiFactory(undefined, '', axiosApiInstance);

export enum MasterDataStatus {
  Uninitialized = 'UNINITIALIZED',
  Initialized = 'INITIALIZED',
  Pending = 'PENDING',
  Failed = 'FAILED',
}

export type MasterDataState = {
  systemrechte: SystemRecht[];
  status: MasterDataStatus;
};

type MasterDataGetters = {};
type MasterDataActions = {
  initialise: () => Promise<void>;
  isInitialized: () => boolean;
  isHiddenSystemrecht: (enumValue: string) => boolean;
};

export type MasterDataStore = Store<'masterDataStore', MasterDataState, MasterDataGetters, MasterDataActions>;

export const useMasterDataStore: StoreDefinition<
  'masterDataStore',
  MasterDataState,
  MasterDataGetters,
  MasterDataActions
> = defineStore({
  id: 'masterDataStore',
  state: (): MasterDataState => {
    return {
      systemrechte: [],
      status: MasterDataStatus.Uninitialized,
    };
  },
  actions: {
    initialise: async function (): Promise<void> {
      try {
        const { data }: { data: SystemRechtResponse[] } = await rolleApi.rolleControllerGetAllSystemrechte();
        this.systemrechte = data.map((sr: SystemRechtResponse) => new SystemRecht(sr.name, sr.isTechnical));
        this.status = MasterDataStatus.Initialized;
      } catch (error) {
        this.status = MasterDataStatus.Failed;
      }
    },
    isInitialized: function (): boolean {
      return this.status === MasterDataStatus.Initialized;
    },
    isHiddenSystemrecht: function (enumValue: string): boolean {
      return this.systemrechte.find((sr) => sr.name === enumValue)?.isTechnical || false;
    },
  },
});
