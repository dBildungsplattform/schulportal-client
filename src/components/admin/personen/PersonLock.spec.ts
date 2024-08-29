import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PersonLock from './PersonLock.vue';
import type { Person, Personendatensatz } from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import {
  OrganisationsTyp,
  useOrganisationStore,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import type { DBiamPersonenuebersichtResponse, DBiamPersonenzuordnungResponse } from '@/api-client/generated/api';

let wrapper: VueWrapper | null = null;
let personenkontextStore: PersonenkontextStore | null = null;
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
    personenkontextStore = usePersonenkontextStore();
    organisationStore = useOrganisationStore();

    personenkontextStore!.personenuebersicht = personenuebersicht;
    organisationStore!.parentOrganisationen = [parentOrganisation];
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
