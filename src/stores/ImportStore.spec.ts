import { useImportStore, type ImportStore } from './ImportStore';
import { setActivePinia, createPinia } from 'pinia';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import type { ImportUploadResponse } from '@/api-client/generated';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('ImportStore', () => {
  let importStore: ImportStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    importStore = useImportStore();
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
  });
});
