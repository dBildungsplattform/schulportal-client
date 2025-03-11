import { OrganisationsTyp, RollenSystemRecht, type OrganisationRootChildrenResponse } from '@/api-client/generated';
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
      mockadapter.onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=KLASSEN_VERWALTEN').replyOnce(200, []);
      const getAllOrganisationenPromise: void = await organisationStore.getAllOrganisationen({
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

    it('should accept filter for typ Traeger', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1',
          kennung: 'Org1',
          name: 'Organisation 1',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Traeger,
        },
      ];

      mockadapter.onGet('/api/organisationen?offset=0&limit=30&typ=TRAEGER').replyOnce(200, mockResponse, {
        'x-paging-total': '1',
      });
      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULTRAEGER_VERWALTEN&administriertVon=999')
        .replyOnce(200, []);

      const getAllOrganisationenPromise: Promise<void> = organisationStore.getAllOrganisationen({
        offset: 0,
        limit: 30,
        includeTyp: OrganisationsTyp.Traeger,
      });
      await getAllOrganisationenPromise;
      expect(organisationStore.allSchultraeger).toEqual(mockResponse);
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
      const mockKlassenResponse: Organisation[] = [
        {
          id: '1000',
          name: '9a',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Klasse,
          administriertVon: '1',
          schuleDetails: '---',
        },
      ];
      const mockSchulenResponse: Organisation[] = [
        {
          id: '1',
          kennung: '0815',
          name: 'Testschule',
          namensergaenzung: 'Ergänzung',
          kuerzel: 'O1',
          typ: OrganisationsTyp.Klasse,
          administriertVon: '1',
          schuleDetails: '---',
        },
      ];
      const expectedKlassen: Organisation[] = mockKlassenResponse.map((k: Organisation) => ({
        ...k,
        schuleDetails: '0815 (Testschule)',
      }));

      mockadapter.onGet('/api/organisationen?typ=KLASSE&administriertVon=1').replyOnce(200, mockKlassenResponse);
      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=KLASSEN_VERWALTEN&organisationIds=1')
        .replyOnce(200, mockSchulenResponse);
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId({
        administriertVon: ['1'],
      });
      await getAllKlassenByOrganisationId;
      expect(organisationStore.klassen).toEqual(expectedKlassen);
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen?typ=KLASSE&administriertVon=1').replyOnce(500, 'some mock server error');
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId({
        administriertVon: ['1'],
      });
      expect(organisationStore.loadingKlassen).toBe(true);
      await rejects(getAllKlassenByOrganisationId);
      expect(organisationStore.klassen).toEqual([]);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter
        .onGet('/api/organisationen?typ=KLASSE&administriertVon=1')
        .replyOnce(500, { code: 'some mock server error' });
      const getAllKlassenByOrganisationId: Promise<void> = organisationStore.getKlassenByOrganisationId({
        administriertVon: ['1'],
      });
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
        const createOrganisationPromise: Promise<void> = organisationStore.createOrganisation(
          '1',
          '1',
          'Org1',
          'Organisation 1',
          'Ergänzung',
          'Org1',
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
        const createOrganisationPromise: Promise<void> = organisationStore.createOrganisation(
          '1',
          '1',
          'Org1',
          'Organisation 1',
          'Ergänzung',
          '01',
          OrganisationsTyp.Klasse,
          undefined,
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
        expect(organisationStore.createdKlasse).toEqual(mockResponse);
        expect(organisationStore.loading).toBe(false);
      });

      it('should create Schulträger and update state', async () => {
        const mockResponse: Organisation[] = [
          {
            id: '1',
            kennung: 'Traeger',
            name: 'Traeger 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationsTyp.Traeger,
            administriertVon: '1',
          },
        ];

        mockadapter.onPost('/api/organisationen').replyOnce(200, mockResponse);
        const createOrganisationPromise: Promise<void> = organisationStore.createOrganisation(
          '1',
          '1',
          'Org1',
          'Organisation 1',
          'Ergänzung',
          'Org1',
          OrganisationsTyp.Traeger,
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
        expect(organisationStore.createdSchultraeger).toEqual(mockResponse);
        expect(organisationStore.loading).toBe(false);
      });

      it('should handle string error', async () => {
        mockadapter.onPost('/api/organisationen').replyOnce(500, 'some mock server error');
        const createOrganisationPromise: Promise<void> = organisationStore.createOrganisation(
          '1',
          '1',
          'Org1',
          'Organisation 1',
          'Ergänzung',
          'Org1',
          OrganisationsTyp.Schule,
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
        expect(organisationStore.createdSchule).toEqual(null);
        expect(organisationStore.errorCode).toEqual('ORGANISATION_SPECIFICATION_ERROR');
        expect(organisationStore.loading).toBe(false);
      });

      it('should handle error code', async () => {
        mockadapter.onPost('/api/organisationen').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
        const createOrganisationPromise: Promise<void> = organisationStore.createOrganisation(
          '1',
          '1',
          'Org1',
          'Organisation 1',
          'Ergänzung',
          'Org1',
          OrganisationsTyp.Schule,
        );
        expect(organisationStore.loading).toBe(true);
        await createOrganisationPromise;
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

    describe('getFilteredSchulen', () => {
      const url: string = '/api/organisationen?limit=25&searchString=astrid&typ=SCHULE&systemrechte=KLASSEN_VERWALTEN';
      const sut: OrganisationStore['getFilteredSchulen'] = () =>
        organisationStore.getFilteredSchulen({
          searchString: 'astrid',
          systemrechte: [RollenSystemRecht.KlassenVerwalten],
        });
      it('should get all schulen with search string', async () => {
        const mockResponse: Organisation[] = [
          {
            id: '1',
            kennung: '1234567',
            name: 'Astrid-Lindgren-Schule',
            typ: OrganisationsTyp.Schule,
          },
        ];

        mockadapter.onGet(url).replyOnce(200, mockResponse, { 'x-paging-total': '1' });
        const getFilteredSchulenPromise: Promise<void> = sut();

        expect(organisationStore.filteredSchulen.loading).toBe(true);
        await getFilteredSchulenPromise;
        expect(organisationStore.filteredSchulen.schulen).toEqual(mockResponse);
        expect(organisationStore.filteredSchulen.total).toEqual(1);
        expect(organisationStore.filteredSchulen.loading).toBe(false);
      });

      it('should handle string error', async () => {
        mockadapter.onGet(url).replyOnce(500, 'some mock server error');
        const getFilteredSchulenPromise: Promise<void> = sut();

        expect(organisationStore.filteredSchulen.loading).toBe(true);
        await getFilteredSchulenPromise;
        expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
        expect(organisationStore.filteredSchulen.loading).toBe(false);
      });

      it('should handle error code', async () => {
        mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
        const getFilteredSchulenPromise: Promise<void> = sut();

        expect(organisationStore.filteredSchulen.loading).toBe(true);
        await getFilteredSchulenPromise;
        expect(organisationStore.errorCode).toEqual('some mock server error');
        expect(organisationStore.filteredSchulen.loading).toBe(false);
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
        version: 1,
      };

      organisationStore.currentKlasse = {
        id: '2',
        kennung: 'Org2',
        name: 'Organisation 2',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O2',
        typ: OrganisationsTyp.Klasse,
        administriertVon: '1',
        version: 1,
      };

      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(200, mockResponse);
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
        OrganisationsTyp.Klasse,
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(mockResponse);
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      organisationStore.currentKlasse = {
        id: '2',
        kennung: 'Org2',
        name: 'Organisation 2',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O2',
        typ: OrganisationsTyp.Klasse,
        administriertVon: '1',
        version: 1,
      };
      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(500, 'some mock server error');
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
        OrganisationsTyp.Klasse,
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('KLASSE_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      organisationStore.currentKlasse = {
        id: '2',
        kennung: 'Org2',
        name: 'Organisation 2',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O2',
        typ: OrganisationsTyp.Klasse,
        administriertVon: '1',
        version: 1,
      };
      mockadapter.onPatch('/api/organisationen/1/name').replyOnce(500, { i18nKey: 'UPDATE_ERROR' });
      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
        OrganisationsTyp.Klasse,
      );
      expect(organisationStore.loading).toBe(true);
      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UPDATE_ERROR');
      expect(organisationStore.loading).toBe(false);
    });
    it('should throw error when organisation version is not found', async () => {
      // Set currentKlasse to null to trigger the error
      organisationStore.currentKlasse = {
        id: '2',
        kennung: 'Org2',
        name: 'Organisation 2',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O2',
        typ: OrganisationsTyp.Klasse,
        administriertVon: '1',
        version: undefined,
      };

      const updateOrganisationPromise: Promise<void> = organisationStore.updateOrganisationById(
        '1',
        'Updated Organisation 1',
        OrganisationsTyp.Klasse,
      );

      await updateOrganisationPromise;
      expect(organisationStore.updatedOrganisation).toEqual(null);
      expect(organisationStore.errorCode).toEqual('UNSPECIFIED_ERROR');
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
          zugehoerigZu: '1',
          version: 1,
          itslearningEnabled: true,
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
          zugehoerigZu: '1',
          version: 1,
          itslearningEnabled: true,
        },
      };

      mockadapter.onGet('/api/organisationen/root/children').replyOnce(200, mockResponse);
      const updateOrganisationPromise: Promise<void> = organisationStore.getRootKinderSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([mockResponse.oeffentlich, mockResponse.ersatz]);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/organisationen/root/children').replyOnce(500, 'some mock server error');
      const updateOrganisationPromise: Promise<void> = organisationStore.getRootKinderSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([]);
      expect(organisationStore.errorCode).toEqual('SCHULTRAEGER_ERROR');
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/organisationen/root/children').replyOnce(500, { i18nKey: 'GET_ERROR' });
      const updateOrganisationPromise: Promise<void> = organisationStore.getRootKinderSchultraeger();
      await updateOrganisationPromise;
      expect(organisationStore.schultraeger).toEqual([]);
      expect(organisationStore.errorCode).toEqual('GET_ERROR');
    });
  });

  describe('fetchSchuleDetailsForKlassen', () => {
    const mockKlassen: Organisation[] = [
      {
        id: '1',
        administriertVon: '101',
        name: 'Klasse 1',
        typ: OrganisationsTyp.Klasse,
        schuleDetails: '123456 (Schule 1)',
      },
    ];

    beforeEach(() => {
      organisationStore.allKlassen = [...mockKlassen];
      organisationStore.klassen = [...mockKlassen];
      organisationStore.loading = false;
    });

    it('should fetch schule details', async () => {
      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=KLASSEN_VERWALTEN&organisationIds=101')
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

      await organisationStore.fetchSchuleDetailsForKlassen(false);

      expect(organisationStore.klassen).toEqual(mockKlassen);
      expect(organisationStore.allKlassen[0]?.schuleDetails).toBe('123456 (Schule 1)');
      expect(organisationStore.loadingKlassen).toBe(false);
    });

    it.each([
      ['some mock server error', 'UNSPECIFIED_ERROR'],
      [{ i18nKey: 'GET_ERROR' }, 'GET_ERROR'],
    ])(
      'should handle error response %p',
      async (
        response:
          | string
          | {
              i18nKey: string;
            },
        expectedError: string,
      ) => {
        mockadapter
          .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=KLASSEN_VERWALTEN&organisationIds=101')
          .replyOnce(500, response);

        await organisationStore.fetchSchuleDetailsForKlassen(false);

        expect(organisationStore.schultraeger).toEqual([]);
        expect(organisationStore.errorCode).toEqual(expectedError);
      },
    );
  });

  describe('fetchSchuleDetailsForSchultraeger', () => {
    const mockSchultraeger: Organisation[] = [
      {
        id: '999',
        kennung: 'TR001',
        name: 'Schulträger 1',
        namensergaenzung: 'Zusatz',
        kuerzel: 'ST1',
        typ: OrganisationsTyp.Traeger,
        administriertVon: '',
        zugehoerigZu: '',
        version: 1,
      },
    ];

    beforeEach(() => {
      organisationStore.allSchultraeger = [...mockSchultraeger];
      organisationStore.errorCode = '';
      organisationStore.loading = false;
    });

    it('should fetch Schule details for Schulträger', async () => {
      const mockResponse: Organisation[] = [
        {
          id: '1000',
          kennung: '123456',
          name: 'Schule A',
          namensergaenzung: 'Zusatz A',
          kuerzel: 'S1',
          typ: OrganisationsTyp.Schule,
          zugehoerigZu: '999',
          version: 1,
          schuleDetails: '',
        },
      ];
      mockadapter
        .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULTRAEGER_VERWALTEN&zugehoerigZu=999')
        .replyOnce(200, mockResponse);

      await organisationStore.fetchSchuleDetailsForSchultraeger();

      expect(organisationStore.allSchultraeger[0]?.schuleDetails).toBe('123456');
      expect(organisationStore.loading).toBe(false);
    });

    it.only.each([
      ['some mock server error', 'UNSPECIFIED_ERROR'],
      [{ i18nKey: 'GET_ERROR' }, 'GET_ERROR'],
    ])(
      'should handle error response %p',
      async (
        response:
          | string
          | {
              i18nKey: string;
            },
        expectedError: string,
      ) => {
        mockadapter
          .onGet('/api/organisationen?limit=30&typ=SCHULE&systemrechte=SCHULTRAEGER_VERWALTEN&zugehoerigZu=999')
          .replyOnce(500, response);

        await organisationStore.fetchSchuleDetailsForSchultraeger();

        expect(organisationStore.errorCode).toBe(expectedError);
        expect(organisationStore.loading).toBe(false);
      },
    );
  });

  describe('setItsLearningForSchule', () => {
    it('should successfully activate itslearning for an organisation and update state', async () => {
      const mockResponse: Organisation = {
        id: '1',
        kennung: 'Org1',
        name: 'Organisation 1',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'O1',
        typ: OrganisationsTyp.Schule,
        administriertVon: '1',
        itslearningEnabled: true,
      };

      mockadapter.onPut('/api/organisationen/1/enable-for-its-learning').replyOnce(200, mockResponse);

      const promise: Promise<void> = organisationStore.setItsLearningForSchule('1');
      expect(organisationStore.loading).toBe(true);
      await promise;

      expect(organisationStore.activatedItslearningOrganisation).toEqual(mockResponse);
      expect(organisationStore.errorCode).toBe('');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle a generic error and set UNSPECIFIED_ERROR', async () => {
      mockadapter.onPut('/api/organisationen/1/enable-for-its-learning').networkErrorOnce();

      const promise: Promise<void> = organisationStore.setItsLearningForSchule('1');
      expect(organisationStore.loading).toBe(true);
      await promise;

      expect(organisationStore.activatedItslearningOrganisation).toBeNull();
      expect(organisationStore.errorCode).toBe('ORGANISATION_SPECIFICATION_ERROR');
      expect(organisationStore.loading).toBe(false);
    });

    it('should handle Axios-specific error with i18nKey or default error code', async () => {
      mockadapter.onPut('/api/organisationen/1/enable-for-its-learning').replyOnce(500, { i18nKey: 'ENABLE_ERROR' });

      const promise: Promise<void> = organisationStore.setItsLearningForSchule('1');
      expect(organisationStore.loading).toBe(true);
      await promise;

      expect(organisationStore.activatedItslearningOrganisation).toBeNull();
      expect(organisationStore.errorCode).toBe('ENABLE_ERROR');
      expect(organisationStore.loading).toBe(false);
    });
  });
});
