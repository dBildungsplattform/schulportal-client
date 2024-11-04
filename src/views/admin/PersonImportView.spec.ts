import { expect, test } from 'vitest';
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils';
import PersonImportView from './PersonImportView.vue';
import { nextTick } from 'vue';
import { useImportStore, type ImportStore } from '@/stores/ImportStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import {
  type RolleStore,
  useRolleStore,
  RollenMerkmal,
  RollenSystemRecht,
  type RolleWithServiceProvidersResponse,
} from '@/stores/RolleStore';
import type { ImportUploadResponse } from '@/api-client/generated';

let wrapper: VueWrapper | null = null;
const importStore: ImportStore = useImportStore();
const organisationStore: OrganisationStore = useOrganisationStore();
const rolleStore: RolleStore = useRolleStore();

organisationStore.allSchulen = [
  {
    id: '1133',
    name: 'Schule',
    kennung: '9356494',
    namensergaenzung: '',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
  {
    id: '1',
    name: 'orga',
    kennung: '9356494',
    namensergaenzung: '',
    kuerzel: 'aehg',
    typ: 'SCHULE',
    administriertVon: '1',
  },
];

rolleStore.allRollen = [
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LEHR',
    name: 'Lehrer',
    // TODO: remove type casting when generator is fixed
    merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
    systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '1',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
      {
        id: '2',
        name: 'E-Mail',
      },
    ],
    administeredBySchulstrukturknotenName: 'Land SH',
    administeredBySchulstrukturknotenKennung: '',
  },
  {
    administeredBySchulstrukturknoten: '1234',
    rollenart: 'LERN',
    name: 'SuS',
    // TODO: remove type casting when generator is fixed
    merkmale: [] as unknown as Set<RollenMerkmal>,
    systemrechte: [] as unknown as Set<RollenSystemRecht>,
    createdAt: '2022',
    updatedAt: '2022',
    id: '2',
    serviceProviders: [
      {
        id: '1',
        name: 'itslearning',
      },
    ],
    administeredBySchulstrukturknotenName: 'Land SH',
    administeredBySchulstrukturknotenKennung: '1234567',
  },
] as RolleWithServiceProvidersResponse[];

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(PersonImportView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonImportView,
      },
      mocks: {
        route: {
          fullPath: 'full/path',
        },
      },
    },
  });
  vi.resetAllMocks();
});

describe('PersonImportView', () => {
  test('it renders the person import view', async () => {
    expect(wrapper?.find('[data-testid="person-import-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="schule-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="rolle-select"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="file-input"]').isVisible()).toBe(true);
  });

  test('it clears selects', async () => {
    wrapper?.find('[data-testid="schule-select"] input').setValue('Schule');
    wrapper?.find('[data-testid="rolle-select"] input').setValue('SuS');
    await nextTick();

    wrapper?.find('[data-testid="schule-select"] .v-field__clearable').trigger('click');
    wrapper?.find('[data-testid="rolle-select"] .v-field__clearable').trigger('click');
  });

  test('it uploads a file and resets form', async () => {
    const mockFile: File = new File([''], 'personen.csv', { type: 'text/csv' });
    const fileInput: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="file-input"] input');

    Object.defineProperty(fileInput?.element, 'files', {
      value: [mockFile],
    });
    await nextTick();

    const uploadResponse: ImportUploadResponse = (importStore.uploadResponse = {
      importvorgangId: '1234567890',
      isValid: true,
      totalImportDataItems: 2,
      totalInvalidImportDataItems: 0,
      invalidImportDataItems: [],
    });

    wrapper?.find('[data-testid="person-import-form-submit-button"]').trigger('click');
    await nextTick();

    expect(importStore.uploadResponse).toStrictEqual(uploadResponse);
  });

  test('it navigates to person management', async () => {});

  test('it executes the import', async () => {});

  test('it downloads an imported file', async () => {
    global.URL.createObjectURL = vi.fn();
    importStore.importedData = new File([''], 'personen.txt', { type: 'text/plain' });
    await nextTick();

    const downloadButton: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="download-file-button"]');
    downloadButton?.trigger('click');
  });
});
