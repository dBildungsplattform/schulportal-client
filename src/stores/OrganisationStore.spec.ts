import { OrganisationsTyp } from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';
import { useOrganisationStore, type OrganisationStore, type Organisation } from './OrganisationStore';

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
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Schule,
          administriertVon: '1',
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

    it('should accept filter', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Schule,
        },
      ];

      mockadapter
        .onGet('/api/organisationen?searchString=searchString&systemrechte=ROLLEN_VERWALTEN')
        .replyOnce(200, mockResponse);
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        searchString: 'searchString',
        systemrechte: ['ROLLEN_VERWALTEN'],
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });
  });
  describe('getOrganisationById', () => {
    it('should load the Organisation and update state', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Schule,
          administriertVon: '1',
        },
      ];

      mockadapter.onGet('/api/organisationen/1').replyOnce(200, mockResponse);
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById('1');
      await getOrganisationByIdPromise;
      expect(organisationStore.currentOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, 'some mock server error');
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById('1');
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, { code: 'some mock server error' });
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById('1');
      expect(organisationStore.loading).toBe(true);
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });

  describe('getKlassenByOrganisationId', () => {
    it('should fetch all Klassen and update state', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: '9a',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Klasse,
          administriertVon: '1',
        },
      ];

      mockadapter.onGet('/api/organisationen/1/administriert').replyOnce(200, mockResponse);
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId('1');
      await getAllKlassenByOrganisationId;
      expect(organisationStore.klassen).toEqual(mockResponse);
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/1/administriert').replyOnce(500, 'some mock server error');
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId('1');
      expect(organisationStore.loadingKlassen).toBe(true);
      await rejects(getAllKlassenByOrganisationId);
      expect(organisationStore.klassen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/1/administriert').replyOnce(500, { code: 'some mock server error' });
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId('1');
      expect(organisationStore.loadingKlassen).toBe(true);
      await rejects(getAllKlassenByOrganisationId);
      expect(organisationStore.klassen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    describe('createOrganisation', () => {
      it('should create schule and update state', async () => {
        const mockResponse: Organisation[] = [
          {
            id: '1',
            kennung: 'Org1',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationsTyp.Schule,
            administriertVon: '1',
          },
        ];

        mockadapter.onPost('/api/organisationen').replyOnce(200, mockResponse);
        const createOrganisationPromise: Promise<Organisation> = organisationStore.createOrganisation(
          'Org1',
          'Organisation 1',
          'Ergänzung',
          '01',
          OrganisationsTyp.Schule,
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
        expect(organisationStore.createdSchule).toEqual(mockResponse);
        expect(organisationStore.loading).toBe(false);
      });

      it('should create klasse and update state', async () => {
        const mockResponse: Organisation[] = [
          {
            id: '1',
            kennung: 'Org1',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationsTyp.Klasse,
            administriertVon: '1',
          },
        ];

        mockadapter.onPost('/api/organisationen').replyOnce(200, mockResponse);
        const createOrganisationPromise: Promise<Organisation> = organisationStore.createOrganisation(
          'Org1',
          'Organisation 1',
          'Ergänzung',
          '01',
          OrganisationsTyp.Klasse,
          undefined,
          '1',
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
        expect(organisationStore.createdKlasse).toEqual(mockResponse);
        expect(organisationStore.loading).toBe(false);
      });

      it('should handle string error', async () => {
        mockadapter.onPost('/api/organisationen').replyOnce(500, 'some mock server error');
        const createOrganisationPromise: Promise<Organisation> = organisationStore.createOrganisation(
          'Org1',
          'Organisation 1',
          'Ergänzung',
          '01',
          OrganisationsTyp.Schule,
        );
        expect(organisationStore.loading).toBe(true);
        await rejects(createOrganisationPromise);
        expect(organisationStore.createdSchule).toEqual(null);
        expect(organisationStore.errorCode).toEqual('ORGANISATION_SPECIFICATION_ERROR');
        expect(organisationStore.loading).toBe(false);
      });

      it('should handle error code', async () => {
        mockadapter.onPost('/api/organisationen').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
        const createOrganisationPromise: Promise<Organisation> = organisationStore.createOrganisation(
          'Org1',
          'Organisation 1',
          'Ergänzung',
          '01',
          OrganisationsTyp.Schule,
        );
        expect(organisationStore.loading).toBe(true);
        await expect(createOrganisationPromise).rejects.toEqual('SOME_MOCK_SERVER_ERROR');
        expect(organisationStore.createdSchule).toEqual(null);
        expect(organisationStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
        expect(organisationStore.loading).toBe(false);
      });
    });

    describe('getFilteredKlassen', () => {
      it('should get all klassen for a schule with search string', async () => {
        const mockResponse: Organisation[] = [
          {
            id: '1',
            kennung: '1234567',
            name: 'Klasse 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'K1',
            typ: OrganisationsTyp.Klasse,
            administriertVon: '1',
          },
        ];

        mockadapter
          .onGet('/api/organisationen?searchString=klasse&typ=KLASSE&administriertVon=1')
          .replyOnce(200, mockResponse, { 'x-paging-total': '1' });
        const getFilteredKlassenPromise: Promise<void> = organisationStore.getFilteredKlassen({
          searchString: 'klasse',
          administriertVon: ['1'],
        });

        expect(organisationStore.loadingKlassen).toBe(true);
        await getFilteredKlassenPromise;
        expect(organisationStore.klassen).toEqual(mockResponse);
        expect(organisationStore.totalKlassen).toEqual(1);
        expect(organisationStore.loadingKlassen).toBe(false);
      });

      it('should handle string error', async () => {
        mockadapter
          .onGet('/api/organisationen?searchString=klasse&typ=KLASSE&administriertVon=1')
          .replyOnce(500, 'some mock server error');
        const getFilteredKlassenPromise: Promise<void> = organisationStore.getFilteredKlassen({
          searchString: 'klasse',
          administriertVon: ['1'],
        });

        expect(organisationStore.loadingKlassen).toBe(true);
        await rejects(getFilteredKlassenPromise);
        expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
        expect(organisationStore.loadingKlassen).toBe(false);
      });

      it('should handle error code', async () => {
        mockadapter
          .onGet('/api/organisationen?searchString=hund&typ=KLASSE&administriertVon=100')
          .replyOnce(500, { code: 'some mock server error' });
        const getFilteredKlassenPromise: Promise<void> = organisationStore.getFilteredKlassen({
          searchString: 'hund',
          administriertVon: ['100'],
        });

        expect(organisationStore.loadingKlassen).toBe(true);
        await rejects(getFilteredKlassenPromise);
        expect(organisationStore.errorCode).toEqual('some mock server error');
        expect(organisationStore.loadingKlassen).toBe(false);
      });
    });
  });
});
