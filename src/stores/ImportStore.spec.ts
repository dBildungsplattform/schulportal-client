import { useImportStore, type ImportStore } from './ImportStore';
import { setActivePinia, createPinia } from 'pinia';

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
    it('should upload personen import file', () => {
      expect(importStore.uploadIsLoading).toBeFalsy();
    });

    it('should import personen', () => {
      expect(importStore.importIsLoading).toBeFalsy();
    });
  });
});
