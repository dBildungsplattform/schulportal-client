import { useImportStore, type ImportStore } from './ImportStore';
import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { ImportStatus, type ImportUploadResponse } from '@/api-client/generated';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('ImportStore', () => {
  let importStore: ImportStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    importStore = useImportStore();

    vi.useFakeTimers();
    // Mock setInterval and clearInterval to control timing
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');

    // Reset the store state
    importStore.$reset();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  it('should initalize state correctly', () => {
    expect(importStore.errorCode).toBeNull();
    expect(importStore.importedData).toBeNull();
    expect(importStore.importIsLoading).toBeFalsy();
    expect(importStore.uploadIsLoading).toBeFalsy();
    expect(importStore.uploadResponse).toBeNull();
  });

  describe('import personen', () => {
    it('should upload personen import file', async () => {
      expect(importStore.uploadIsLoading).toBe(false);

      const mockResponse: ImportUploadResponse = {
        importvorgangId: '1234567890',
        isValid: true,
        totalImportDataItems: 2,
        totalInvalidImportDataItems: 0,
        invalidImportDataItems: [],
      };

      mockadapter.onPost('/api/import/upload').replyOnce(200, mockResponse);

      const organisationId: string = '123';
      const rolleId: string = '456';
      const personImportFile: File = new File([''], 'personen.csv', { type: 'text/csv' });

      const uploadPersonenImportFilePromise: Promise<void> = importStore.uploadPersonenImportFile(
        organisationId,
        rolleId,
        personImportFile,
      );
      await uploadPersonenImportFilePromise;

      expect(importStore.uploadResponse).toEqual(mockResponse);
      expect(importStore.uploadIsLoading).toBe(false);
    });

    it('should handle string error while uploading a file', async () => {
      mockadapter.onPost('/api/import/upload').replyOnce(500, 'some mock server error');

      const organisationId: string = '123';
      const rolleId: string = '456';
      const personImportFile: File = new File([''], 'personen.csv', { type: 'text/csv' });

      const uploadPersonenImportFilePromise: Promise<void> = importStore.uploadPersonenImportFile(
        organisationId,
        rolleId,
        personImportFile,
      );

      expect(importStore.uploadIsLoading).toBe(true);
      await uploadPersonenImportFilePromise;
      expect(importStore.uploadResponse).toEqual(null);
      expect(importStore.errorCode).toEqual('ERROR_UPLOADING_FILE');
      expect(importStore.uploadIsLoading).toBe(false);
    });

    it('should handle error code while uploading a file', async () => {
      mockadapter.onPost('/api/import/upload').replyOnce(500, { code: 'ERROR_UPLOADING_FILE' });

      const organisationId: string = '123';
      const rolleId: string = '456';
      const personImportFile: File = new File([''], 'personen.csv', { type: 'text/csv' });

      const uploadPersonenImportFilePromise: Promise<void> = importStore.uploadPersonenImportFile(
        organisationId,
        rolleId,
        personImportFile,
      );

      expect(importStore.uploadIsLoading).toBe(true);
      await uploadPersonenImportFilePromise;
      expect(importStore.uploadResponse).toEqual(null);
      expect(importStore.errorCode).toEqual('ERROR_UPLOADING_FILE');
      expect(importStore.uploadIsLoading).toBe(false);
    });

    describe('import personen', () => {
      it('should import personen', async () => {
        expect(importStore.importIsLoading).toBe(false);

        const mockResponse: File = new File([''], 'personen.txt', { type: 'text/plain' });

        mockadapter.onPost('/api/import/execute').replyOnce(200, mockResponse);

        const importvorgangId: string = '123';

        const executePersonenImportPromise: Promise<void> = importStore.executePersonenImport(importvorgangId);
        await executePersonenImportPromise;

        expect(importStore.importIsLoading).toBe(false);
      });

      it('should handle string error while importing personen', async () => {
        mockadapter.onPost('/api/import/execute').replyOnce(500, 'some mock server error');

        const importvorgangId: string = '123';

        const executePersonenImportPromise: Promise<void> = importStore.executePersonenImport(importvorgangId);

        expect(importStore.importIsLoading).toBe(true);
        await executePersonenImportPromise;
        expect(importStore.errorCode).toEqual('ERROR_IMPORTING_FILE');
        expect(importStore.importIsLoading).toBe(false);
      });

      it('should handle error code while importing personen', async () => {
        mockadapter.onPost('/api/import/execute').replyOnce(500, { code: 'ERROR_IMPORTING_FILE' });

        const importvorgangId: string = '123';
        const executePersonenImportPromise: Promise<void> = importStore.executePersonenImport(importvorgangId);

        expect(importStore.importIsLoading).toBe(true);
        await executePersonenImportPromise;
        expect(importStore.errorCode).toEqual('ERROR_IMPORTING_FILE');
        expect(importStore.importIsLoading).toBe(false);
      });
    });

    describe('downloadPersonenImportFile', () => {
      it('should download personenFile', async () => {
        const mockResponse: File = new File([''], 'personen.txt', { type: 'text/plain' });

        mockadapter.onGet('/api/import/123/download').replyOnce(200, mockResponse);

        const importvorgangId: string = '123';

        await importStore.downloadPersonenImportFile(importvorgangId);

        expect(importStore.importedData).toEqual(mockResponse);
      });

      it('should handle string error while importing personen', async () => {
        mockadapter.onGet('/api/import/123/download').replyOnce(500, 'some mock server error');

        const importvorgangId: string = '123';

        await importStore.downloadPersonenImportFile(importvorgangId);

        expect(importStore.importedData).toEqual(null);
        expect(importStore.errorCode).toEqual('ERROR_IMPORTING_FILE');
      });

      it('should handle error code while importing personen', async () => {
        mockadapter.onGet('/api/import/123/download').replyOnce(500, { code: 'ERROR_IMPORTING_FILE' });

        const importvorgangId: string = '123';

        await importStore.downloadPersonenImportFile(importvorgangId);

        expect(importStore.importedData).toEqual(null);
        expect(importStore.errorCode).toEqual('ERROR_IMPORTING_FILE');
      });
    });

    describe('downloadPersonenImportFile', () => {
      it('should poll and update status to finished', async () => {
        const importvorgangId: string = '123';

        mockadapter.onGet(`/api/import/${importvorgangId}/status`).replyOnce(200, { status: ImportStatus.Finished });

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        // Fast forward timer to trigger first poll
        vi.advanceTimersByTime(30000);
        await Promise.resolve(); // Allow async actions to settle

        await pollingPromise;

        expect(importStore.importStatus?.status).toEqual(ImportStatus.Finished);
        expect(importStore.importProgress).toEqual(100);
      });

      it('should poll and update progress bar to 50%', async () => {
        const importvorgangId: string = '123';

        mockadapter
          .onGet(`/api/import/${importvorgangId}/status`)
          .replyOnce(200, { status: ImportStatus.Inprogress, dataItemCount: 10, totalDataItemImported: 5 });

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        // Fast forward timer to trigger first poll
        vi.advanceTimersByTime(30000);
        await Promise.resolve(); // Allow async actions to settle

        await pollingPromise;

        expect(importStore.importStatus?.status).toEqual(ImportStatus.Inprogress);
        expect(importStore.importProgress).toEqual(50);
      });

      it('should not poll for FAILED and should throw ERROR_IMPORTING_FILE', async () => {
        const importvorgangId: string = '123';

        mockadapter.onGet(`/api/import/${importvorgangId}/status`).replyOnce(200, { status: ImportStatus.Failed });

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        // Fast forward timer to trigger first poll
        vi.advanceTimersByTime(30000);
        await Promise.resolve(); // Allow async actions to settle

        await pollingPromise;

        expect(importStore.errorCode).toEqual('ERROR_IMPORTING_FILE');
        expect(importStore.importStatus?.status).toEqual(ImportStatus.Failed);
        expect(importStore.importProgress).toEqual(0);
      });

      it('should not poll for INVALID and should throw ERROR_UPLOADING_FILE', async () => {
        const importvorgangId: string = '123';

        mockadapter.onGet(`/api/import/${importvorgangId}/status`).replyOnce(200, { status: ImportStatus.Invalid });

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        // Fast forward timer to trigger first poll
        vi.advanceTimersByTime(30000);
        await Promise.resolve(); // Allow async actions to settle

        await pollingPromise;

        expect(importStore.errorCode).toEqual('ERROR_UPLOADING_FILE');
        expect(importStore.importStatus?.status).toEqual(ImportStatus.Invalid);
        expect(importStore.importProgress).toEqual(0);
      });

      it('should stop polling after timeout', async () => {
        const importvorgangId: string = '123';

        mockadapter.onGet(`/api/import/${importvorgangId}/status`).reply(200, { status: ImportStatus.Inprogress });

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        // Fast forward timer to exceed max polling time (60 minutes)
        vi.advanceTimersByTime(60 * 60 * 1000 + 1);
        await pollingPromise;

        expect(importStore.errorCode).toEqual('IMPORT_TIMEOUT');
        expect(importStore.importProgress).toEqual(0);
      });

      it('should not poll if there is an error', async () => {
        const importvorgangId: string = '123';

        mockadapter.onGet(`/api/import/${importvorgangId}/status`).reply(500);

        const pollingPromise: Promise<void> = importStore.startImportStatusPolling(importvorgangId);

        await pollingPromise;

        expect(importStore.errorCode).toEqual('UNSPECIFIED_ERROR');
        expect(importStore.importProgress).toEqual(0);
      });
    });

    describe('ImportStore stopImportStatusPolling', () => {
      it('should clear interval and delete pollingInterval when interval exists', () => {
        // Simulate an existing interval
        const mockInterval: NodeJS.Timeout = setInterval(() => {}, 1000);
        importStore.pollingInterval = mockInterval;

        importStore.stopImportStatusPolling();

        expect(vi.mocked(clearInterval)).toHaveBeenCalledWith(mockInterval);
        expect(importStore.pollingInterval).toBeUndefined();
      });

      it('should do nothing when no polling interval exists', () => {
        // Ensure no interval is set
        importStore.pollingInterval = undefined;

        importStore.stopImportStatusPolling();

        expect(vi.mocked(clearInterval)).not.toHaveBeenCalled();
      });
    });
  });
});
