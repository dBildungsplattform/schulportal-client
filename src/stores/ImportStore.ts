import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { isAxiosError } from 'axios';
import {
  ImportApiFactory,
  ImportStatus,
  type ImportApiInterface,
  type ImportUploadResponse,
  type ImportVorgangStatusResponse,
} from '../api-client/generated/api';
import axiosApiInstance from '@/services/ApiService';

const importApi: ImportApiInterface = ImportApiFactory(undefined, '', axiosApiInstance);

// Maximum polling duration (5 minutes)
const MAX_POLLING_TIME: number = 5 * 60 * 1000; // 5 minutes in milliseconds
const POLLING_INTERVAL: number = 5000; // 5 seconds between polls

export type ImportState = {
  errorCode: string | null;
  importedData: File | null;
  importIsLoading: boolean;
  uploadIsLoading: boolean;
  uploadResponse: ImportUploadResponse | null;
  importStatus: ImportStatus | null;
  importProgress: number;
  pollingInterval?: ReturnType<typeof setInterval>;
};

type ImportGetters = {};
type ImportActions = {
  executePersonenImport: (importVorgangId: string) => Promise<void>;
  uploadPersonenImportFile: (organisationId: string, rolleId: string, file: File) => Promise<void>;
  getPersonenImportStatus: (importVorgangId: string) => Promise<void>;
  startImportStatusPolling: (importvorgangId: string) => Promise<void>;
  stopImportStatusPolling: () => void;
  downloadPersonenImportFile: (importVorgangId: string) => Promise<void>;
};

export type ImportStore = Store<'importStore', ImportState, ImportGetters, ImportActions>;

export const useImportStore: StoreDefinition<'importStore', ImportState, ImportGetters, ImportActions> = defineStore({
  id: 'importStore',
  state: (): ImportState => {
    return {
      errorCode: null,
      importedData: null,
      importIsLoading: false,
      uploadIsLoading: false,
      uploadResponse: null,
      importStatus: null,
      importProgress: 0,
    };
  },
  actions: {
    async downloadPersonenImportFile(importvorgangId: string): Promise<void> {
      try {
        const { data }: { data: File } = await importApi.importControllerDownloadFile(importvorgangId);

        this.importedData = data;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ERROR_IMPORTING_FILE';
        }
      }
    },

    async startImportStatusPolling(importvorgangId: string): Promise<void> {
      // Reset progress and status
      this.importProgress = 0;
      this.importStatus = null;

      const startTime: number = Date.now();

      const pollStatus = async (): Promise<void> => {
        try {
          await this.getPersonenImportStatus(importvorgangId);

          // Calculate progress (simple linear progression)
          const elapsedTime: number = Date.now() - startTime;
          this.importProgress = Math.min(100, (elapsedTime / MAX_POLLING_TIME) * 1000);

          // Stop polling on final states
          if (
            this.importStatus === ImportStatus.Finished ||
            this.importStatus === ImportStatus.Failed ||
            this.importStatus === ImportStatus.Invalid
          ) {
            this.stopImportStatusPolling();

            if (this.importStatus === ImportStatus.Failed) {
              this.errorCode = 'ERROR_IMPORTING_FILE';
              this.importProgress = 0;
            } else if (this.importStatus === ImportStatus.Invalid) {
              this.errorCode = 'ERROR_UPLOADING_FILE';
              this.importProgress = 0;
            } else {
              this.importProgress = 100;
            }
            return;
          }

          // Stop polling if max time exceeded
          if (elapsedTime >= MAX_POLLING_TIME) {
            this.stopImportStatusPolling();
            this.errorCode = 'IMPORT_TIMEOUT';
            this.importProgress = 0;
          }
        } catch (error) {
          this.stopImportStatusPolling();
          this.errorCode = 'UNSPECIFIED_ERROR';
          this.importProgress = 0;
        }
      };
      // Initial immediate call
      await pollStatus();

      // Start periodic polling
      this.pollingInterval = setInterval(pollStatus, POLLING_INTERVAL);
    },

    stopImportStatusPolling(): void {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        delete this.pollingInterval;
      }
    },

    async getPersonenImportStatus(importvorgangId: string): Promise<void> {
      try {
        const { data }: { data: ImportVorgangStatusResponse } =
          await importApi.importControllerGetImportStatus(importvorgangId);

        this.importStatus = data.status;
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ERROR_IMPORTING_FILE';
        }
      }
    },

    async executePersonenImport(importvorgangId: string): Promise<void> {
      this.importIsLoading = true;
      try {
        await importApi.importControllerExecuteImport({
          importvorgangId,
        });
      } catch (error: unknown) {
        this.errorCode = 'UNSPECIFIED_ERROR';
        if (isAxiosError(error)) {
          this.errorCode = error.response?.data.i18nKey || 'ERROR_IMPORTING_FILE';
        }
      } finally {
        this.importIsLoading = false;
      }
    },

    async uploadPersonenImportFile(organisationId: string, rolleId: string, file: File): Promise<void> {
      this.uploadIsLoading = true;
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
        this.uploadIsLoading = false;
      }
    },
  },
});
