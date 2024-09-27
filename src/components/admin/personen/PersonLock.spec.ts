import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PersonLock from './PersonLock.vue';
import { usePersonStore, type Person, type Personendatensatz, type PersonStore } from '@/stores/PersonStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import {
  RollenMerkmal,
  type DBiamPersonenuebersichtResponse,
  type DBiamPersonenzuordnungResponse,
} from '@/api-client/generated/api';

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
  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        disabled: false,
        errorCode: '',
        person: getPersonendatensatz(false),
        adminId: 'adminid',
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
    expect(document.querySelector('[data-testid="schule-select"]')).not.toBeNull();
    const button: HTMLElement = document.querySelector('[data-testid="lock-user-button"]') as HTMLElement;
    expect(button).not.toBeNull();
  });
});

describe('Unlock user', () => {
  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        disabled: false,
        errorCode: '',
        person: getPersonendatensatz(true),
        adminId: 'adminid',
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
  });
});

describe('Error handling', () => {
  describe('if an error occurs', () => {
    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: 'TEST_ERROR',
          person: getPersonendatensatz(true),
          adminId: 'adminid',
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
    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: '',
          person: getPersonendatensatz(true),
          adminId: 'adminid',
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
