import { expect, type MockInstance, test } from 'vitest';
import { DOMWrapper, VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import { useAuthStore, type AuthStore, type UserInfo } from '@/stores/AuthStore';
import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
import {
  parseUserLock,
  PersonLockOccasion,
  usePersonStore,
  type Personendatensatz,
  type PersonStore,
  type PersonWithUebersicht,
  type UserLock,
} from '@/stores/PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { nextTick, type ComputedRef, type DefineComponent } from 'vue';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import PersonDetailsView from './PersonDetailsView.vue';
import { EmailAddressStatus } from '@/api-client/generated';
import {
  useTwoFactorAuthentificationStore,
  type TwoFactorAuthentificationStore,
} from '@/stores/TwoFactorAuthentificationStore';

let wrapper: VueWrapper | null = null;
let router: Router;

const authStore: AuthStore = useAuthStore();
const organisationStore: OrganisationStore = useOrganisationStore();
const personStore: PersonStore = usePersonStore();
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
const twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

const mockPerson: Personendatensatz = {
  person: {
    id: '1',
    name: {
      familienname: 'Orton',
      vorname: 'John',
    },
    referrer: 'jorton',
    personalnummer: '263578',
    isLocked: false,
    userLock: null,
    revision: '1',
    lastModified: '2024-05-22',
    email: {
      address: 'email@email.com',
      status: EmailAddressStatus.Enabled,
    },
  },
};

const mockCurrentUser: UserInfo = {
  middle_name: null,
  nickname: null,
  profile: null,
  picture: null,
  website: null,
  gender: null,
  birthdate: null,
  zoneinfo: null,
  locale: null,
  phone_number: null,
  updated_at: null,
  personId: '2',
  email: 'albert@test.de',
  email_verified: true,
  family_name: 'Test',
  given_name: 'Albert',
  name: 'Albert Test',
  preferred_username: 'albert',
  sub: 'c71be903-d0ec-4207-b653-40c114680b63',
  personenkontexte: [
    {
      organisationsId: '123456',
      rolle: {
        systemrechte: ['ROLLEN_VERWALTEN', 'SCHULEN_VERWALTEN'],
        serviceProviderIds: ['789897798'],
      },
    },
  ],
  password_updated_at: null,
};

const mockPersonenuebersicht: PersonWithUebersicht = {
  personId: '1',
  vorname: 'John',
  nachname: 'Orton',
  benutzername: 'jorton',
  lastModifiedZuordnungen: Date.now().toLocaleString(),
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Testschule Birmingham',
      sskDstNr: '123456',
      rolle: 'SuS',
      rollenArt: RollenArt.Lern,
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '2099-08-12',
      admins: ['test'],
    },
    {
      sskId: '3',
      rolleId: '4',
      sskName: 'Testschule London',
      sskDstNr: '123459',
      rolle: 'SuS',
      rollenArt: RollenArt.Lern,
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '',
      admins: ['test'],
    },
    {
      sskId: '2',
      rolleId: '1',
      sskName: '9a',
      sskDstNr: '123459',
      rolle: 'SuS',
      rollenArt: RollenArt.Lern,
      typ: OrganisationsTyp.Klasse,
      administriertVon: '1',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '',
      admins: ['test'],
    },
  ],
};

const mockPersonenuebersichtLehr: PersonWithUebersicht = {
  personId: '22',
  vorname: 'Randy',
  nachname: 'Cena',
  benutzername: 'rcena',
  lastModifiedZuordnungen: Date.now().toLocaleString(),
  zuordnungen: [
    {
      sskId: '1',
      rolleId: '1',
      sskName: 'Testschule Birmingham',
      sskDstNr: '123456',
      rolle: 'Lehrkraft',
      rollenArt: RollenArt.Lehr,
      typ: OrganisationsTyp.Schule,
      administriertVon: '2',
      editable: true,
      merkmale: [] as unknown as RollenMerkmal,
      befristung: '2099-08-12',
      admins: [],
    },
  ],
};

personenkontextStore.workflowStepResponse = {
  organisations: [
    {
      id: 'string',
      administriertVon: 'string',
      kennung: 'string',
      name: 'string',
      namensergaenzung: 'string',
      kuerzel: 'string',
      typ: 'ROOT',
    },
  ],
  rollen: [
    {
      id: '54321',
      createdAt: '2024-06-25T13:03:53.802Z',
      updatedAt: '2024-06-25T13:03:53.802Z',
      name: 'string',
      administeredBySchulstrukturknoten: 'string',
      rollenart: 'LERN',
      merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    },
    {
      id: '1',
      createdAt: '2024-06-25T13:03:53.802Z',
      updatedAt: '2024-06-25T13:03:53.802Z',
      name: 'SuS',
      administeredBySchulstrukturknoten: '1',
      rollenart: 'LERN',
      merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    },
  ],
  selectedOrganisation: 'string',
  selectedRolle: 'string',
  canCommit: true,
};

organisationStore.klassen = [
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

organisationStore.getParentOrganisationsByIds = async (_organisationIds: string[]): Promise<void> => {
  return;
};

authStore.currentUser = mockCurrentUser;
personStore.currentPerson = mockPerson;
personStore.personenuebersicht = mockPersonenuebersicht;

beforeEach(async () => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  router = createRouter({
    history: createWebHistory(),
    routes,
  });

  router.push('/');
  await router.isReady();

  wrapper = mount(PersonDetailsView, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        PersonDetailsView,
      },
      plugins: [router],
    },
  });
});

const setCurrentPerson = (emailStatus: EmailAddressStatus): void => {
  personStore.currentPerson = {
    person: {
      id: '123456',
      name: {
        familienname: 'Vimes',
        vorname: 'Susan',
      },
      referrer: '6978',
      personalnummer: '9183756',
      isLocked: false,
      userLock: null,
      revision: '1',
      lastModified: '2024-12-22',
      email: {
        address: 'test@example.com',
        status: emailStatus,
      },
    },
  };
};

describe('PersonDetailsView', () => {
  test('it renders the person details page and shows person data', async () => {
    expect(wrapper).toBeTruthy();
    expect(wrapper?.find('[data-testid="person-details-card"]').isVisible()).toBe(true);
    expect(wrapper?.find('[data-testid="person-vorname"]').text()).toBe('John');
    expect(wrapper?.find('[data-testid="person-familienname"]').text()).toBe('Orton');
    expect(wrapper?.find('[data-testid="person-username"]').text()).toBe('jorton');
    expect(wrapper?.find('[data-testid="person-email"]').text()).toBe('email@email.com');
    expect(wrapper?.find('[data-testid="person-zuordnung-1"]').text()).toBe(
      '123456 (Testschule Birmingham): SuS 9a  (befristet bis 11.08.2099)',
    );
    expect(wrapper?.getComponent({ name: 'PasswordReset' })).toBeTruthy();
  });

  test('it renders details for a locked person', async () => {
    const date: string = '01.01.2024';
    const datetime: string = `${date} 12:34:00`;
    const userLock: UserLock[] = [
      {
        personId: '1234',
        locked_by: 'test',
        created_at: datetime,
        lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
        locked_until: datetime,
      },
    ];

    // Mock the current person in the store
    personStore.currentPerson = {
      person: {
        id: '1234',
        name: {
          familienname: 'Vimes',
          vorname: 'Samuel',
        },
        referrer: '6978',
        personalnummer: '9183756',
        isLocked: true,
        userLock,
        revision: '1',
        lastModified: '2024-12-22',
        email: {
          address: 'email',
          status: EmailAddressStatus.Requested,
        },
      },
    };
    await nextTick();

    const vornameElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-vorname"]');
    const lockInfoContainer: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-lock-info"]');

    // Check if the element exists and has the correct text content
    expect(vornameElement?.text()).toBe('Samuel');
    expect(lockInfoContainer?.html()).toContain(userLock[0]!.locked_by);
    expect(lockInfoContainer?.html()).toContain(date);
  });

  test('it navigates back to user table', async () => {
    const push: MockInstance = vi.spyOn(router, 'push');
    await wrapper?.find('[data-testid="close-layout-card-button"]').trigger('click');
    expect(push).toHaveBeenCalledTimes(1);
  });

  test('it shows an error if error code exists', async () => {
    personStore.errorCode = 'ERROR_LOADING_USER';
    await nextTick();

    expect(wrapper?.find('[data-testid="alert-title"]').text()).toBe('Fehler beim Laden des Benutzers');
    personStore.errorCode = '';
  });

  // test('It cancels editing', async () => {
  //   await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
  //   await nextTick();

  //   const zuordnungCreateButton: VueWrapper | undefined = wrapper?.findComponent({ ref: 'zuordnung-create-button' });

  //   await wrapper?.find('[data-testid="zuordnung-edit-cancel"]').trigger('click');
  //   await nextTick();

  //   expect(zuordnungCreateButton?.exists()).toBe(false);
  // });

  // test('It triggers change Klasse and selects the first checkbox', async () => {
  //   // Trigger edit mode
  //   await wrapper?.find('[data-testid="zuordnung-edit-button"]').trigger('click');
  //   await nextTick();
  //   console.log('******')
  //   console.log(wrapper?.find('[data-testid="checkbox-zuordnung-1"').html());

  //   // Find the first checkbox
  //   const firstCheckbox: VueWrapper | undefined = wrapper?.findComponent({ ref: 'checkbox-zuordnung-1' });

  //   // Explicitly set the value of the checkbox via v-model
  //   await firstCheckbox?.setValue([
  //     {
  //       sskId: '1',
  //       rolleId: '1',
  //       sskName: 'Testschule Birmingham',
  //       sskDstNr: '123456',
  //       rolle: 'SuS',
  //       typ: OrganisationsTyp.Schule,
  //       administriertVon: '2',
  //       editable: true,
  //     },
  //   ]);
  //   await nextTick();

  //   // Trigger the Klasse change button
  //   await wrapper?.find('[data-testid="klasse-change-button"]').trigger('click');
  //   await nextTick();

  //   // Assert that the Klasse change form is displayed
  //   const klasseChangeFormComponent: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-change-form' });

  //   expect(klasseChangeFormComponent?.exists()).toBe(true);
  // });

  test('filteredRollen returns correct roles based on person context and selection', async () => {
    interface PersonDetailsViewType extends DefineComponent {
      filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined>;
    }
    const vm: PersonDetailsViewType = wrapper?.vm as unknown as PersonDetailsViewType;
    const filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = vm.filteredRollen;

    // Verify that filteredRollen contains only roles that are not already assigned and filtered correctly
    expect(filteredRollen).toEqual([
      {
        value: '54321',
        title: 'string',
        rollenart: RollenArt.Lern,
        merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      },
      {
        value: '1',
        title: 'SuS',
        rollenart: RollenArt.Lern,
        merkmale: new Set<RollenMerkmal>(['BEFRISTUNG_PFLICHT']),
      },
    ]);
  });

  test('it displays lockInfo if there is any', async () => {
    expect(personStore.currentPerson).toBeDefined();
    expect(wrapper).toBeDefined();
    personStore.currentPerson!.person.userLock = [];
    await nextTick();

    const activeStatusMessage: DOMWrapper<HTMLDivElement> = wrapper!.find('[data-testid="person-lock-info"]');
    expect(activeStatusMessage.exists()).toBe(true);
    expect(activeStatusMessage.text()).toContain('aktiv');
    expect(wrapper!.find('[data-testid="lock-info-0-key"]').exists()).toBe(false);
    expect(wrapper!.find('[data-testid="lock-info-0-attribute"]').exists()).toBe(false);
    expect(wrapper!.find('[data-testid="lock-info-1-key"]').exists()).toBe(false);
    expect(wrapper!.find('[data-testid="lock-info-1-attribute"]').exists()).toBe(false);

    const date: string = new Date().toUTCString();
    const formattedDate: string = new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const userLock: UserLock[] = [
      {
        personId: '1234',
        locked_by: 'Lady Lock',
        created_at: date,
        lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
        locked_until: date,
      },
    ];

    personStore.currentPerson!.person.isLocked = true;
    personStore.currentPerson!.person.userLock = parseUserLock(userLock);
    organisationStore.lockingOrganisation = {
      id: '1234',
      name: userLock[0]!.locked_by,
      typ: OrganisationsTyp.Schule,
    };
    await nextTick();

    const lockInfoArray: Array<[string, string]> = [
      ['Gesperrt durch:', userLock[0]!.locked_by],
      ['Gesperrt seit:', formattedDate],
    ];

    for (let index: number = 0; index < lockInfoArray.length; index++) {
      const [keyValue, attributeValue]: [string, string] = lockInfoArray[index]!;
      const keyElement: DOMWrapper<HTMLSpanElement> = wrapper!.find(`[data-testid="lock-info-${index}-key"]`);
      const attributeElement: DOMWrapper<HTMLSpanElement> = wrapper!.find(
        `[data-testid="lock-info-${index}-attribute"]`,
      );
      expect(keyElement.exists()).toBe(true);
      expect(keyElement.text()).toContain(keyValue);
      expect(attributeElement.text()).toContain(attributeValue);
    }
  });

  it('displays correct email status for Enabled', async () => {
    setCurrentPerson(EmailAddressStatus.Enabled);

    await nextTick();

    const emailElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-email-text"]');
    expect(emailElement?.text()).toBe('test@example.com');
  });

  it('displays correct email status for requested', async () => {
    setCurrentPerson(EmailAddressStatus.Requested);

    await nextTick();

    const emailElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-email-text"]');
    expect(emailElement?.text()).toBe('wird erzeugt');
  });

  it('displays correct email status for failed', async () => {
    setCurrentPerson(EmailAddressStatus.Failed);

    await nextTick();

    const emailElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-email-text"]');
    expect(emailElement?.text()).toBe('fehlerhaft');
  });

  it('displays correct email status for disabled', async () => {
    setCurrentPerson(EmailAddressStatus.Disabled);

    await nextTick();

    const emailElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-email-text"]');
    expect(emailElement?.text()).toBe('deaktiviert');
  });

  it('displays correct email status for unknown', async () => {
    setCurrentPerson('UnknownStatus' as EmailAddressStatus);

    await nextTick();

    const emailElement: DOMWrapper<Element> | undefined = wrapper?.find('[data-testid="person-email-text"]');
    expect(emailElement?.exists()).toBe(false);
  });

  test('it sets errorCode to PERSONALNUMMER_NICHT_EINDEUTIG and goes back to Form', async () => {
    personStore.errorCode = 'PERSONALNUMMER_NICHT_EINDEUTIG';
    await nextTick();

    await wrapper?.find('[data-testid="alert-button"]').trigger('click');
    const familienNameInput: DOMWrapper<Element> | undefined = await wrapper?.find(
      '[data-testid="person-familienname"]',
    );

    expect(familienNameInput?.exists()).toBe(true);
  });

  test('it checks for dirtiness when metadata Form is active', async () => {
    await wrapper?.find('[data-testid="metadata-edit-button"]').trigger('click');
    await nextTick();

    await wrapper
      ?.findComponent({ ref: 'person-metadata-change' })
      .findComponent({ ref: 'vorname-input' })
      .setValue('test');
    await nextTick();

    location.reload();

    await nextTick();

    const unsavedChangesDialogButton: VueWrapper | undefined = await wrapper?.findComponent({
      ref: 'unsaved-changes-dialog',
    });

    expect(unsavedChangesDialogButton?.exists()).toBe(true);
  });

  describe('error messages', () => {
    test('check 2fa connection error', async () => {
      twoFactorAuthenticationStore.loading = false;
      twoFactorAuthenticationStore.required = true;
      twoFactorAuthenticationStore.errorCode = 'PI_UNAVAILABLE_ERROR';
      await nextTick();

      expect(wrapper?.find('[data-testid="connection-error-text"]').isVisible()).toBe(true);
    });
    test('check 2fa state error', async () => {
      twoFactorAuthenticationStore.loading = false;
      twoFactorAuthenticationStore.required = true;
      twoFactorAuthenticationStore.errorCode = 'TOKEN_STATE_ERROR';
      await nextTick();

      expect(wrapper?.find('[data-testid="token-state-error-text"]').isVisible()).toBe(true);
    });
  });

  test('it shows loading spinner', async () => {
    personStore.loading = true;
    personStore.currentPerson = null;
    await flushPromises();

    expect(wrapper?.find('[data-testid="loading-spinner"]').isVisible()).toBe(true);
  });

  test('it shows befristung', async () => {
    expect(wrapper?.find('[data-testid="zuordnung-befristung-text"]').isVisible()).toBe(true);
  });

  test('it shows device password template for rollenart lehr', async () => {
    personStore.personenuebersicht = mockPersonenuebersichtLehr;
    await nextTick();
    expect(wrapper?.find('[data-testid="device-password-info"]').isVisible()).toBe(true);

    // reset personenuebersicht
    personStore.personenuebersicht = mockPersonenuebersicht;
  });
});
