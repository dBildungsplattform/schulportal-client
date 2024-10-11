import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';
import { type Person, type Personendatensatz } from '@/stores/PersonStore';
import { mount, VueWrapper } from '@vue/test-utils';
import { expect, test, type Mock } from 'vitest';
import { nextTick } from 'vue';
import PersonLock from './PersonLock.vue';

let wrapper: VueWrapper | null = null;

const parentOrganisationen: Array<Organisation> = [
  {
    id: '1',
    kennung: '1',
    name: 'Peter-Pille-Palle-Schule',
    namensergaenzung: null,
    kuerzel: undefined,
    typ: OrganisationsTyp.Schule,
    administriertVon: null,
  },
  {
    id: '2',
    kennung: '2',
    name: 'Sarah-Sanddorn-Schule',
    namensergaenzung: null,
    kuerzel: undefined,
    typ: OrganisationsTyp.Schule,
    administriertVon: null,
  },
];

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
    userLock: locked
      ? {
          personId: '123',
          locked_by: 'Amanda Admin',
          locked_until: Date.now().toString(),
          created_at: Date.now().toString(),
        }
      : null,
  };
  return { person };
}

async function openDialog(): Promise<void> {
  wrapper?.get('[data-testid="open-lock-dialog-icon"]').trigger('click');
  await nextTick();
}

function getInfoText(): Element | null {
  return document.querySelector('[data-testid="lock-user-info-text"]');
}

function getSelectElement(): HTMLDivElement | null {
  return document.querySelector('[data-testid="schule-select"]');
}

function getLockButton(): HTMLButtonElement | null {
  return document.querySelector('[data-testid="lock-user-button"]');
}

function getErrorText(): HTMLSpanElement | null {
  return document.querySelector('[data-testid="error-text"]');
}

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
});

describe('Lock user', () => {
  describe('with one organisation', () => {
    const formatOrganisationName: Mock = vi.fn();
    formatOrganisationName.mockImplementation((organisation: Organisation) => {
      return organisation.kennung ? `${organisation.kennung} (${organisation.name})` : organisation.name;
    });

    const person: Personendatensatz = getPersonendatensatz(false);
    const intersectingOrganisation: Organisation = parentOrganisationen[0]!;

    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: '',
          person,
          adminId: 'adminid',
          formatOrganisationName,
          intersectingOrganisations: new Set([intersectingOrganisation]),
        },
        global: {
          components: {
            PersonLock,
          },
        },
      });
    });

    test('it opens the dialog', async () => {
      expect(getInfoText()).toBeNull();

      await openDialog();

      expect(getInfoText()).not.toBeNull();
      let selectDiv: HTMLDivElement | null = getSelectElement();
      expect(selectDiv).not.toBeNull();

      const button: HTMLButtonElement | null = getLockButton();
      expect(button).not.toBeNull();
      expect(button!.attributes.getNamedItem('disabled')?.value).toBeUndefined();

      expect(formatOrganisationName).toHaveBeenCalledWith(intersectingOrganisation);

      selectDiv = getSelectElement();
      expect(selectDiv).not.toBeNull();

      expect(selectDiv!.textContent).toContain(formatOrganisationName(intersectingOrganisation));
    });

    test('it triggers the lock function', async () => {
      await openDialog();

      const button: HTMLButtonElement | null = getLockButton();
      expect(button).not.toBeNull();
      button!.click();

      const emitArgs: Array<unknown> | undefined = wrapper?.emitted()['onLockUser'];
      expect(emitArgs).toBeDefined();
      expect(emitArgs![0]).toStrictEqual([person.person.id, !person.person.isLocked, intersectingOrganisation.id]);
    });
  });

  describe('with two organisationen', () => {
    const formatOrganisationName: Mock = vi.fn();
    formatOrganisationName.mockImplementation((organisation: Organisation) => {
      return organisation.kennung ? `${organisation.kennung} (${organisation.name})` : organisation.name;
    });

    const person: Personendatensatz = getPersonendatensatz(false);

    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: '',
          person,
          adminId: 'adminid',
          formatOrganisationName,
          intersectingOrganisations: new Set(parentOrganisationen),
        },
        global: {
          components: {
            PersonLock,
          },
        },
      });
    });

    test('it opens the dialog', async () => {
      expect(getInfoText()).toBeNull();

      await openDialog();

      expect(getInfoText()).not.toBeNull();
      const selectDiv: HTMLDivElement | null = getSelectElement();
      expect(selectDiv).not.toBeNull();

      const disabledButton: HTMLButtonElement | null = getLockButton();
      expect(disabledButton).not.toBeNull();
      expect(disabledButton!.attributes.getNamedItem('disabled')?.value).toBeDefined();

      expect(formatOrganisationName).toHaveBeenCalledTimes(parentOrganisationen.length);

      selectDiv!.click();
      await nextTick();
      // TODO: figure out a way to select an item

      // parentOrganisationen.forEach((org: Organisation) => {
      //   expect(document.body.textContent).toContain(formatOrganisationName(org));
      // });

      const enabledButton: HTMLButtonElement | null = getLockButton();
      expect(enabledButton).not.toBeNull();
      //expect(enabledButton!.attributes.getNamedItem('disabled')?.value).toBeUndefined();
    });

    test.skip('it triggers the lock function', async () => {
      await openDialog();

      // TODO: select item
      // ...
      const selectedOrganisationId: string = '...';
      const button: HTMLButtonElement | null = getLockButton();
      expect(button).not.toBeNull();
      button!.click();

      const emitArgs: Array<unknown> | undefined = wrapper?.emitted()['onLockUser'];
      expect(emitArgs).toBeDefined();
      expect(emitArgs![0]).toStrictEqual([person.person.id, !person.person.isLocked, selectedOrganisationId]);
    });
  });
});

describe('Unlock user', () => {
  const formatOrganisationName: Mock = vi.fn();
  const person: Personendatensatz = getPersonendatensatz(true);

  beforeEach(() => {
    wrapper = mount(PersonLock, {
      attachTo: document.getElementById('app') || '',
      props: {
        disabled: false,
        errorCode: '',
        person,
        adminId: 'adminid',
        formatOrganisationName,
        intersectingOrganisations: new Set(parentOrganisationen.slice(0, 1)),
      },
      global: {
        components: {
          PersonLock,
        },
      },
    });
  });

  test('it opens the dialog', async () => {
    expect(getInfoText()).toBeNull();

    await openDialog();

    expect(getInfoText()).not.toBeNull();
    const selectElement: HTMLDivElement | null = getSelectElement();
    expect(selectElement).toBeNull();

    const button: HTMLButtonElement | null = getLockButton();
    expect(button).not.toBeNull();
    expect(button!.attributes.getNamedItem('disabled')?.value).toBeUndefined();
  });

  test('it triggers the unlock function', async () => {
    await openDialog();

    const button: HTMLButtonElement | null = getLockButton();
    expect(button).not.toBeNull();
    button!.click();

    await nextTick();

    const emitArgs: Array<unknown> | undefined = wrapper?.emitted()['onLockUser'];
    expect(emitArgs).toBeDefined();
    expect(emitArgs![0]).toStrictEqual([person.person.id, !person.person.isLocked, person.person.userLock?.locked_by]);
    await nextTick();
  });
});

describe.each([
  ['locking', false],
  ['unlocking', true],
])('Error handling for %s', (_testTitle: string, locked: boolean) => {
  describe('if an error occurs', () => {
    const formatOrganisationName: Mock = vi.fn();

    beforeEach(() => {
      wrapper = mount(PersonLock, {
        attachTo: document.getElementById('app') || '',
        props: {
          disabled: false,
          errorCode: 'TEST_ERROR',
          person: getPersonendatensatz(locked),
          adminId: 'adminid',
          formatOrganisationName: formatOrganisationName,
          intersectingOrganisations: new Set(parentOrganisationen.slice(0, 1)),
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

      const errorText: HTMLSpanElement | null = getErrorText();
      expect(errorText).not.toBeNull();
      expect(errorText?.textContent).toContain(
        `Der Benutzer konnte nicht ${locked ? 'entsperrt' : 'gesperrt'} werden.`,
      );
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
          person: getPersonendatensatz(locked),
          adminId: 'adminid',
          intersectingOrganisations: new Set(parentOrganisationen.slice(0, 1)),
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

      const errorText: HTMLSpanElement | null = getErrorText();
      expect(errorText).toBeNull();
    });
  });
});
