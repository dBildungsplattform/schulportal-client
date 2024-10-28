import { OrganisationsTyp, type OrganisationRootChildrenResponse } from '@/api-client/generated';
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
          typ: OrganisationsTyp.Klasse,
          administriertVon: '1',
        },
      ];

      mockadapter.onGet('/api/organisationen?offset=0&limit=30').replyOnce(200, mockResponse);
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen?offset=0&limit=30').replyOnce(500, 'some mock server error');
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
      });
      expect(organisationStore.loading).toBe(true);
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen?offset=0&limit=30').replyOnce(500, { code: 'some mock server error' });
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
      });
      expect(organisationStore.loading).toBe(true);
      await getAllOrganisationenPromise;
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
          typ: OrganisationsTyp.Klasse,
        },
      ];

      mockadapter
        .onGet('/api/organisationen?offset=0&limit=30&searchString=searchString&systemrechte=ROLLEN_VERWALTEN')
        .replyOnce(200, mockResponse);
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
        searchString: 'searchString',
        systemrechte: ['ROLLEN_VERWALTEN'],
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allOrganisationen).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should accept filter for typ Klasse', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Klasse,
          schuleDetails: '---',
        },
      ];

      mockadapter.onGet('/api/organisationen?offset=0&limit=30&typ=KLASSE').replyOnce(200, mockResponse);
      mockadapter.onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULEN_VERWALTEN').replyOnce(200, []);
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
        includeTyp: OrganisationsTyp.Klasse,
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allKlassen).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should accept filter for typ Schule', async () => {
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

      mockadapter.onGet('/api/organisationen?offset=0&limit=30&typ=SCHULE').replyOnce(200, mockResponse, {
        'x-paging-total': '1',
      });
      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
        includeTyp: OrganisationsTyp.Schule,
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allSchulen).toEqual(mockResponse);
      expect(organisationStore.totalSchulen).toEqual(1);
      expect(organisationStore.loading).toBe(false);
    });
  });

  describe('getOrganisationById', () => {
    it('should load schule and update state', async () => {
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
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById(
        '1',
        OrganisationsTyp.Schule,
      );
      await getOrganisationByIdPromise;
      expect(organisationStore.currentOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should load klasse and update state', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '2',
          kennung: 'Org2',
          name: 'Organisation 2',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O2',
          typ: OrganisationsTyp.Klasse,
          administriertVon: '1',
        },
      ];

      mockadapter.onGet('/api/organisationen/2').replyOnce(200, mockResponse);
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById(
        '2',
        OrganisationsTyp.Klasse,
      );
      await getOrganisationByIdPromise;
      expect(organisationStore.currentKlasse).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, 'some mock server error');
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById(
        '1',
        OrganisationsTyp.Schule,
      );
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, { code: 'some mock server error' });
      const getOrganisationByIdPromise: Promise<Organisation> = organisationStore.getOrganisationById(
        '1',
        OrganisationsTyp.Schule,
      );
      expect(organisationStore.loading).toBe(true);
      await rejects(getOrganisationByIdPromise);
      expect(organisationStore.currentOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });

  describe('getLockingOrganisationById', () => {
    it('should load the locking Organisation and update state', async () => {
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
      const promise: Promise<void> = organisationStore.getLockingOrganisationById('1');
      await promise;
      expect(organisationStore.lockingOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('uses parentOrganisationen, if possible', async () => {
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
      organisationStore.parentOrganisationen = mockResponse;
      const promise: Promise<void> = organisationStore.getLockingOrganisationById('1');
      await promise;
      expect(organisationStore.lockingOrganisation).toEqual(mockResponse[0]);
      expect(organisationStore.loading).toBe(false);
    });

    it('uses allOrganisationen, if possible', async () => {
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
      organisationStore.allOrganisationen = mockResponse;
      const promise: Promise<void> = organisationStore.getLockingOrganisationById('1');
      await promise;
      expect(organisationStore.lockingOrganisation).toEqual(mockResponse[0]);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, 'some mock server error');
      const promise: Promise<void> = organisationStore.getLockingOrganisationById('1');
      await promise;
      expect(organisationStore.lockingOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/1').replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = organisationStore.getLockingOrganisationById('1');
      expect(organisationStore.loading).toBe(true);
      await promise;
      expect(organisationStore.lockingOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('some mock server error');
      expect(organisationStore.loading).toBe(false);
    });
  });

  describe('getParentOrganisationsByIds', () => {
    const mockOrganisationen: Organisation[] = [
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
    const requestIds: string[] = mockOrganisationen.map((o: Organisation) => o.id);
    const mockResponse: { parents: Organisation[] } = {
      parents: mockOrganisationen,
    };

    it('should load the Organisations and update state', async () => {
      mockadapter.onPost('/api/organisationen/parents-by-ids').replyOnce(200, mockResponse);
      await organisationStore.getParentOrganisationsByIds(requestIds);
      expect(organisationStore.parentOrganisationen).toEqual(mockOrganisationen);
      expect(organisationStore.errorCode).toEqual('');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/organisationen/parents-by-ids').replyOnce(500, 'some mock server error');
      const getParentOrganisationsByIdPromise: Promise<void> =
        organisationStore.getParentOrganisationsByIds(requestIds);
      await getParentOrganisationsByIdPromise;
      expect(organisationStore.parentOrganisationen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/organisationen/parents-by-ids').replyOnce(500, { code: 'some mock server error' });
      const getParentOrganisationsByIdPromise: Promise<void> =
        organisationStore.getParentOrganisationsByIds(requestIds);
      expect(organisationStore.loading).toBe(true);
      await getParentOrganisationsByIdPromise;
      expect(organisationStore.parentOrganisationen).toEqual([]);
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
          schuleDetails: '---',
        },
      ];

      mockadapter.onGet('/api/organisationen/1/administriert').replyOnce(200, mockResponse);
      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULEN_VERWALTEN&organisationIds=1')
        .replyOnce(200, []);
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
          .onGet('/api/organisationen?limit=25&searchString=klasse&typ=KLASSE&administriertVon=1')
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
          .onGet('/api/organisationen?limit=25&searchString=klasse&typ=KLASSE&administriertVon=1')
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
          .onGet('/api/organisationen?limit=25&searchString=hund&typ=KLASSE&administriertVon=100')
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
    describe('deleteOrganisationById', () => {
      it('should delete organisation and update state', async () => {
        mockadapter.onDelete('/api/organisationen/1/klasse').replyOnce(200);
        const deleteOrganisationPromise: Promise<void> = organisationStore.deleteOrganisationById('1');
        expect(organisationStore.loading).toBe(true);
        await deleteOrganisationPromise;
        expect(organisationStore.loading).toBe(false);
        expect(organisationStore.errorCode).toEqual('');
      });

      it('should handle string error', async () => {
        mockadapter.onDelete('/api/organisationen/1/klasse').replyOnce(500, 'some mock server error');
        const deleteOrganisationPromise: Promise<void> = organisationStore.deleteOrganisationById('1');
        expect(organisationStore.loading).toBe(true);
        await deleteOrganisationPromise;
        expect(organisationStore.loading).toBe(false);
        expect(organisationStore.errorCode).toEqual('KLASSE_ERROR');
      });

      it('should handle error code', async () => {
        mockadapter.onDelete('/api/organisationen/1/klasse').replyOnce(500, { i18nKey: 'KLASSE_ERROR' });
        const deleteOrganisationPromise: Promise<void> = organisationStore.deleteOrganisationById('1');
        expect(organisationStore.loading).toBe(true);
        await deleteOrganisationPromise;
        expect(organisationStore.loading).toBe(false);
        expect(organisationStore.errorCode).toEqual('KLASSE_ERROR');
      });
    });
  });
  describe('updateOrganisationById', () => {
    it('should update the organisation and update state', async () => {
      const mockResponse: Organisation = {
        id: '1',
        kennung: 'Org1',
        name: 'Updated Organisation 1',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O1',
        typ: OrganisationsTyp.Schule,
        administriertVon: '1',
      };

      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(200, mockResponse);
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(500, 'some mock server error');
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('KLASSE_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(500, { i18nKey: 'UPDATE_ERROR' });
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UPDATE_ERROR');
      expect(organisationStore.loading).toBe(false);
    });
  });
  describe('loadSchultraeger', () => {
    it('should update the schultraeger', async () => {
      const mockResponse: OrganisationRootChildrenResponse = {
        oeffentlich: {
          id: '2',
          name: 'Öffentliche Schulen',
          namensergaenzung: 'Ergänzung',
          kennung: null,
          kuerzel: '',
          traegerschaft: '01',
          typ: OrganisationsTyp.Land,
          administriertVon: '1',
        },
        ersatz: {
          id: '3',
          name: 'Ersatzschulen Schulen',
          namensergaenzung: 'Ergänzung',
          kennung: null,
          kuerzel: '',
          traegerschaft: '01',
          typ: OrganisationsTyp.Land,
          administriertVon: '1',
        },
      };

      mockadapter.onGet('/api/organisationen/root/children').replyOnce(200, mockResponse);
      const updateOrganisationPromise: Promise<void> = organisationStore.getSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([mockResponse.oeffentlich, mockResponse.ersatz]);
    });
    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/root/children').replyOnce(500, 'some mock server error');
      const updateOrganisationPromise: Promise<void> = organisationStore.getSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([]);
      expect(organisationStore.errorCode).toEqual('SCHULTRAEGER_ERROR');
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/root/children').replyOnce(500, { i18nKey: 'GET_ERROR' });
      const updateOrganisationPromise: Promise<void> = organisationStore.getSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([]);
      expect(organisationStore.errorCode).toEqual('GET_ERROR');
    });
  });

  describe('fetchSchuleDetailsForKlassen', () => {
    it('should fetch school details', async () => {
      const mockKlassen: {
        id: string;
        administriertVon: string;
        name: string;
        typ: 'KLASSE';
        schuleDetails: string;
      }[] = [
        {
          id: '1',
          administriertVon: '101',
          name: 'Klasse 1',
          typ: OrganisationsTyp.Klasse,
          schuleDetails: '123456 (Schule 1)',
        },
      ];

      // Set up initial state
      organisationStore.allKlassen = [...mockKlassen];
      organisationStore.klassen = [...mockKlassen];

      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULEN_VERWALTEN&organisationIds=101')
        .replyOnce(200, [
          {
            id: '101',
            kennung: '123456',
            name: 'Schule 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationsTyp.Schule,
            administriertVon: '1',
          },
        ]);

      const fetchSchuleDetailsForKlassenPromise: Promise<void> = organisationStore.fetchSchuleDetailsForKlassen(false);
      await fetchSchuleDetailsForKlassenPromise;
      expect(organisationStore.klassen).toEqual(mockKlassen);
      expect(organisationStore.allKlassen[0]?.schuleDetails).toBe('123456 (Schule 1)');
      expect(organisationStore.loadingKlassen).toBe(false);
    });
  });
});
