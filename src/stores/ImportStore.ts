import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import { ImportApiFactory, type ImportApiInterface, type ImportUploadResponse } from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const importApi: ImportApiInterface = ImportApiFactory(undefined, '', axiosApiInstance);

type ImportState = {
  errorCode: string | null;
  loading: boolean;
  uploadResponse: ImportUploadResponse | null;
};

type ImportGetters = {};
type ImportActions = {
  resetState: () => void;
  uploadPersonenImportFile: (organisationId: string, rolleId: string, file: File) => Promise<void>;
};

export type ImportStore = Store<'importStore', ImportState, ImportGetters, ImportActions>;

export const useImportStore: StoreDefinition<'importStore', ImportState, ImportGetters, ImportActions> = defineStore({
  id: 'importStore',
  state: (): ImportState => {
    return {
      errorCode: null,
      loading: false,
      uploadResponse: null,
    };
  },
  actions: {
    resetState() {
      this.$reset();
    },

    async uploadPersonenImportFile(organisationId: string, rolleId: string, file: File): Promise<void> {
      this.loading = true;
      try {
        const { data }: { data: ImportUploadResponse } = await importApi.importControllerUploadFile(
          organisationId,
          rolleId,
          file,
        );

        this.uploadResponse = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ERROR_UPLOADING_FILE';
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
