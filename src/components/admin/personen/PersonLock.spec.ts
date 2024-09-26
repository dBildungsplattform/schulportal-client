import {
  RollenMerkmal,
  type DBiamPersonenuebersichtResponse,
  type DBiamPersonenzuordnungResponse,
} from '@/api-client/generated/api';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { usePersonStore, type Person, type Personendatensatz, type PersonStore } from '@/stores/PersonStore';
import { createTestingPinia } from '@pinia/testing';
import { mount, VueWrapper } from '@vue/test-utils';
import { expect, test, type Mock } from 'vitest';
import PersonLock from './PersonLock.vue';

let wrapper: VueWrapper | null = null;
let personStore: PersonStore | null = null;
let organisationStore: OrganisationStore | null = null;

const zuordnung: DBiamPersonenzuordnungResponse = {
  sskId: 'sskId',
  rolleId: 'rolleId',
  sskName: 'sskName',
  sskDstNr: 'sskDstNr',
  rolle: 'rolle',
  administriertVon: 'administriertVon',
  typ: OrganisationsTyp.Schule,
  editable: false,
  merkmale: RollenMerkmal.KopersPflicht,
  befristung: 'befristung',
};
const parentOrganisation: Organisation = {
  id: zuordnung.sskId,
  kennung: zuordnung.sskDstNr,
  name: zuordnung.sskName,
  namensergaenzung: null,
  kuerzel: undefined,
  typ: zuordnung.typ,
  administriertVon: null,
};
const personenuebersicht: DBiamPersonenuebersichtResponse = {
  personId: 'id',
  vorname: 'firstname',
  nachname: 'lastname',
  benutzername: 'flastname',
  lastModifiedZuordnungen: null,
  zuordnungen: [zuordnung],
};

function getPersonendatensatz(locked: boolean): Personendatensatz {
  const person: Person = {
    id: 'testid',
    name: {
      familienname: 'tester',
      vorname: 'theo',
    },
    referrer: null,
    personalnummer: null,
    isLocked: locked,
    revision: '1',
    lastModified: '2024-05-22',
    lockInfo: locked
      ? {
          lock_locked_from: 'Amanda Admin',
          lock_timestamp: Date.now().toString(),
        }
      : null,
  };
  return { person };
}

function getIntersectingOrganisations(): Set<Organisation> {
  return new Set([parentOrganisation]);
}

async function openDialog(): Promise<void> {
  wrapper?.get('[data-testid="open-lock-dialog-icon"]').trigger('click');
}

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
});

describe('Lock user', () => {
  const formatOrganisationName: Mock = vi.fn();

  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        disabled: false,
        errorCode: '',
        person: getPersonendatensatz(false),
        adminId: 'adminid',
        formatOrganisationName: formatOrganisationName,
        intersectingOrganisations: getIntersectingOrganisations(),
      },
      global: {
        components: {
          PersonLock,
        },
        //plugins: [vuetify, createTestingPinia()],
        plugins: [createTestingPinia()],
      },
    });
    personStore = usePersonStore();
    organisationStore = useOrganisationStore();

    personStore.personenuebersicht = personenuebersicht;
    organisationStore.parentOrganisationen = [parentOrganisation];
  });

  test('it opens the dialog', async () => {
    expect(document.querySelector('[data-testid="lock-user-info-text"]')).toBeNull();

    await openDialog();

    expect(document.querySelector('[data-testid="lock-user-info-text"]')).not.toBeNull();
    const selectElement: HTMLSelectElement | null = document.querySelector('[data-testid="schule-select"]');
    expect(selectElement).not.toBeNull();

    const button: HTMLElement = document.querySelector('[data-testid="lock-user-button"]') as HTMLElement;
    expect(button).not.toBeNull();

    expect(formatOrganisationName).toHaveBeenCalled();
  });
});

describe('Unlock user', () => {
  const formatOrganisationName: Mock = vi.fn();

  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        disabled: false,
        errorCode: '',
        person: getPersonendatensatz(true),
        adminId: 'adminid',
        formatOrganisationName: formatOrganisationName,
        intersectingOrganisations: getIntersectingOrganisations(),
      },
      global: {
        components: {
          PersonLock,
        },
      },
    });
  });

  test('it opens the dialog', async () => {
    await openDialog();

    expect(document.querySelector('[data-testid="lock-user-info-text"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="schule-select"]')).toBeNull();
    const button: HTMLElement = document.querySelector('[data-testid="lock-user-button"]') as HTMLElement;
    expect(button).not.toBeNull();
    expect(formatOrganisationName).toHaveBeenCalled();
  });
});

describe('Error handling', () => {
  describe('if an error occurs', () => {
    const formatOrganisationName: Mock = vi.fn();

    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: 'TEST_ERROR',
          person: getPersonendatensatz(true),
          adminId: 'adminid',
          formatOrganisationName: formatOrganisationName,
          intersectingOrganisations: getIntersectingOrganisations(),
        },
        global: {
          components: {
            PersonLock,
          },
        },
      });
    });

    test('it displays an error message', async () => {
      await openDialog();

      const errorText: HTMLElement = document.querySelector('[data-testid="error-text"]') as HTMLElement;
      expect(errorText).not.toBeNull();
    });
  });

  describe('if no error occurs', () => {
    const formatOrganisationName: Mock = vi.fn();

    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: '',
          person: getPersonendatensatz(true),
          adminId: 'adminid',
          intersectingOrganisations: getIntersectingOrganisations(),
          formatOrganisationName: formatOrganisationName,
        },
        global: {
          components: {
            PersonLock,
          },
        },
      });
    });

    test('it displays no error message', async () => {
      await openDialog();

      const errorText: HTMLElement = document.querySelector('[data-testid="error-text"]') as HTMLElement;
      expect(errorText).toBeNull();
    });
  });
});
