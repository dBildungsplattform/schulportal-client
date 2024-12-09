import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError, type AxiosResponse } from 'axios';
import { ConfigApiFactory, type ConfigApiInterface, type FeatureFlagResponse } from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const configApi: ConfigApiInterface = ConfigApiFactory(undefined, '', axiosApiInstance);

type ConfigState = {
  errorCode: string | null;
  configData: FeatureFlagResponse | null;
  loading: boolean;
};

type ConfigGetters = {};
type ConfigActions = {
  getFeatureFlags: () => Promise<void>;
};

export type ConfigStore = Store<'configStore', ConfigState, ConfigGetters, ConfigActions>;

export const useConfigStore: StoreDefinition<'configStore', ConfigState, ConfigGetters, ConfigActions> = defineStore({
  id: 'configStore',
  state: (): ConfigState => {
    return {
      errorCode: null,
      configData: null,
      loading: false,
    };
  },
  actions: {
    async getFeatureFlags(): Promise<void> {
      this.loading = true;
      try {
        const response: AxiosResponse<FeatureFlagResponse> = await configApi.configControllerGetFeatureFlags();

        this.configData = response.data;
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
