import { useOrganisationStore, type OrganisationStore } from './OrganisationStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { type OrganisationResponse, OrganisationResponseTypEnum } from '../api-client/generated/api';
import { rejects } from 'assert';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('OrganisationStore', () => {
  let organisationStore: OrganisationStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    organisationStore = useOrganisationStore();
    mockadapter.reset();
  });

  it('should initialize state correctly', () => {
    expect(organisationStore.allOrganisationen).toEqual([]);
    expect(organisationStore.errorCode).toEqual('');
    expect(organisationStore.loading).toBe(false);
  });

  describe('getAllOrganisations', () => {
    it('should fetch all organisations and update state', async () => {
      const mockResponse: OrganisationResponse[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationResponseTypEnum.Anbieter,
        },
      ];

      mockadapter.onGet('/api/organisationen').replyOnce(200, mockResponse);
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen();
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen').replyOnce(500, 'some mock server error');
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen();
      expect(organisationStore.loading).toBe(true);
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen').replyOnce(500, { code: 'some mock server error' });
      const getAllOrgaisationsPromise: Promise<void> = organisationStore.getAllOrganisationen();
      expect(organisationStore.loading).toBe(true);
      await getAllOrgaisationsPromise;
      expect(organisationStore.allOrganisationen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });
  describe('getOrganisationById', () => {
    it('should load the Organisation and update state', async () => {
      const mockResponse: OrganisationResponse[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationResponseTypEnum.Anbieter,
        },
      ];

      mockadapter.onGet('/api/organisationen/1').replyOnce(200, mockResponse);
      const getOrganisationByIdPromise: Promise<OrganisationResponse> = organisationStore.getOrganisationById('1');
      await getOrganisationByIdPromise;
      expect(organisationStore.currentOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, 'some mock server error');
      const getOrganisationByIdPromise: Promise<OrganisationResponse> = organisationStore.getOrganisationById('1');
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, { code: 'some mock server error' });
      const getOrganisationByIdPromise: Promise<OrganisationResponse> = organisationStore.getOrganisationById('1');
      expect(organisationStore.loading).toBe(true);
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });
  describe('createOrganisation', () => {
    it('should create the Organisation and update state', async () => {
      const mockResponse: OrganisationResponse[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationResponseTypEnum.Anbieter,
        },
      ];

      mockadapter.onPost('/api/organisationen').replyOnce(200, mockResponse);
      const createOrganisationPromise: Promise<OrganisationResponse> = organisationStore.createOrganisation(
        'Org1',
        'Organisation 1',
        'Ergänzung',
        '01',
        OrganisationResponseTypEnum.Anbieter,
      );
      expect(organisationStore.loading).toBe(true);
      await createOrganisationPromise;
      expect(organisationStore.createdOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/organisationen').replyOnce(500, 'some mock server error');
      const createOrganisationPromise: Promise<OrganisationResponse> = organisationStore.createOrganisation(
        'Org1',
        'Organisation 1',
        'Ergänzung',
        '01',
        OrganisationResponseTypEnum.Anbieter,
      );
      expect(organisationStore.loading).toBe(true);
      await rejects(createOrganisationPromise);
      expect(organisationStore.createdOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/organisationen').replyOnce(500, { code: 'some mock server error' });
      const createOrganisationPromise: Promise<OrganisationResponse> = organisationStore.createOrganisation(
        'Org1',
        'Organisation 1',
        'Ergänzung',
        '01',
        OrganisationResponseTypEnum.Anbieter,
      );
      expect(organisationStore.loading).toBe(true);
      await expect(createOrganisationPromise).rejects.toEqual('some mock server error');
      expect(organisationStore.createdOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });
});
