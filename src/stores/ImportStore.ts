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
const MAX_POLLING_TIME: number = 5 * 60 * 1000;

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

      // Dynamically calculate polling interval: 100ms per item, min 1s (Small imports), max 10s (Medium to large imports)
      // This ensures faster polling for small imports and prevents overwhelming the server for large imports
      const totalItems: number = this.uploadResponse?.totalImportDataItems || 1;
      const dynamicPollingInterval: number = Math.max(1000, Math.min(10000, Math.floor(totalItems * 100)));

      const pollStatus = async (): Promise<void> => {
        try {
          await this.getPersonenImportStatus(importvorgangId);

          // Calculate progress (simple linear progression)
          const elapsedTime: number = Date.now() - startTime;
          const progressCurve: number = 1 - Math.exp(-elapsedTime / (MAX_POLLING_TIME / 6));
          // The fake progress bar will never reach 100% unless the status is Finished. For large imports the bar will cap at 95% and poll from there until it's finished
          this.importProgress =
            this.importStatus === ImportStatus.Finished
              ? 100
              : Math.max(1, Math.min(95, Math.floor(progressCurve * 100)));

          // Stop polling on final states
          switch (this.importStatus) {
            case ImportStatus.Finished:
              this.stopImportStatusPolling();
              this.importProgress = 100;
              break;
            case ImportStatus.Failed:
              this.stopImportStatusPolling();
              this.errorCode = 'ERROR_IMPORTING_FILE';
              this.importProgress = 0;
              break;
            case ImportStatus.Invalid:
              this.stopImportStatusPolling();
              this.errorCode = 'ERROR_UPLOADING_FILE';
              this.importProgress = 0;
              break;
            default:
              // Continue polling if not in a final state
              break;
          }

          // Stop polling if max time of 5 minutes is exceeded
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

      // Start periodic polling with dynamic interval
      this.pollingInterval = setInterval(pollStatus, dynamicPollingInterval);
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
