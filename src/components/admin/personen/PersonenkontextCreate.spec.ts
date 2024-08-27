import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import PersonenkontextCreate from './PersonenkontextCreate.vue';
import { nextTick } from 'vue';
import { RollenArt, RollenMerkmal, RollenSystemRecht, type DBiamPersonenkontextResponse } from '@/api-client/generated';
import { type PersonenkontextStore, usePersonenkontextStore } from '@/stores/PersonenkontextStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
let personenkontextStore: PersonenkontextStore;
let organisationStore: OrganisationStore;
beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
  wrapper = mount(PersonenkontextCreate, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      disabled: false,
      organisationen: [
        {
          title: 'orga',
          value: '1133',
        },
        {
          title: 'orga1',
          value: '1133',
        },
      ],
      rollen: [
        {
          value: '54321',
          title: 'Lern',
          rollenart: RollenArt.Lern,
        },
        {
          value: '54329',
          title: 'Lehr',
          rollenart: RollenArt.Lehr,
        },
      ],
      klassen: [
        {
          value: '1',
          title: 'Org1',
        },
        {
          value: '1',
          title: 'Org1',
        },
      ],
      selectedOrganisationProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedRolleProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedKlasseProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedOrganisation: '',
      selectedRolle: '',
      selectedKlasse: '',
      showHeadline: true,
    },
    global: {
      components: {
        PersonenkontextCreate,
      },
    },
  });

  personenkontextStore = usePersonenkontextStore();
  organisationStore = useOrganisationStore();

  personenkontextStore.workflowStepResponse = {
    organisations: [
      {
        id: 'string',
        kennung: '',
        name: 'Organisation1',
        namensergaenzung: 'string',
        kuerzel: 'string',
        typ: 'TRAEGER',
        administriertVon: '1',
      },
    ],
    rollen: [],
    selectedOrganisation: null,
    selectedRolle: null,
    canCommit: true,
  };

  personenkontextStore.createdPersonenkontextForOrganisation = {
    personId: '12345',
    organisationId: '67890',
    rolleId: '54321',
  } as DBiamPersonenkontextResponse;

  personenkontextStore.createdPersonenkontextForKlasse = {
    personId: '12345',
    organisationId: '55555',
    rolleId: '54321',
  } as DBiamPersonenkontextResponse;

  personenkontextStore.workflowStepResponse = {
    rollen: [
      {
        administeredBySchulstrukturknoten: '1234',
        rollenart: 'LERN',
        name: 'SuS',
        merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
        systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
        createdAt: '2022',
        updatedAt: '2022',
        id: '54321',
      },
    ],
    organisations: [],
    selectedOrganisation: null,
    selectedRolle: null,
    canCommit: true,
  };
});

describe('PersonenkontextCreate', () => {
  test('it renders the component', () => {
    expect(wrapper?.find('[data-testid="organisation-select"]').isVisible()).toBe(true);
  });
  test('it updates search and sets values selected rolle, organisation and klasse', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.vm.$emit('update:search', '01');
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.vm.$emit('update:search', '54321');
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('O1');
    await nextTick();

    const klasseAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klasseAutocomplete?.vm.$emit('update:search', '55555');
    await klasseAutocomplete?.setValue('55555');
    await nextTick();

    expect(klasseAutocomplete?.text()).toEqual('55555');
  });

  test('it resets field Rolle when Organisation is reset after being selected', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    expect(rolleAutocomplete?.exists()).toBe(false);
  });

  test('it resets field Klasse when Rolle is reset after being selected', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.setValue('O1');
    await nextTick();

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    expect(klassenAutocomplete?.exists()).toBe(false);
  });

  test('Fetches all Klassen if the searchValue is empty', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationStore.getKlassenByOrganisationId).toHaveBeenCalled();
  });

  test('it updates Organisation search correctly', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();
    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalled();
  });

  test('it updates Rollen search correctly', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue('org');
    await nextTick();

    const rollenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });

    await rollenAutocomplete?.setValue(undefined);
    await nextTick();

    await rollenAutocomplete?.vm.$emit('update:search', '');
    await nextTick();
    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalled();
  });

  test('it does nothing if the oldValue is equal to what is selected on Organisation', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    // Set a value in orga that will match with something given by the props and so the component will calculate the selectedOrganisationTitle
    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    // Set the searchValue to 'orga' which matches the title before
    await organisationAutocomplete?.vm.$emit('update:search', 'orga');
    await nextTick();

    // Set the newValue to '' and the oldValue is in this case 'orga' and so the method should just return
    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('orga');
  });

  test('it does nothing if the oldValue is equal to what is selected on Rolle', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    // Set a value in orga that will match with something given by the props and so the component will calculate the selectedRolleTitle
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    // Set the searchValue to 'Lern' which matches the title before
    await rolleAutocomplete?.vm.$emit('update:search', 'Lern');
    await nextTick();

    // Set the newValue to '' and the oldValue is in this case 'Lern' and so the method should just return
    await rolleAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(rolleAutocomplete?.text()).toEqual('Lern');
  });

  test('it sends a request if the newValue is empty and the selectedRolle is not defined', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    // Set a value in orga that will match with something given by the props and so the component will calculate the selectedRolleTitle
    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    // Set the searchValue to 'Lern' which matches the title before
    await rolleAutocomplete?.vm.$emit('update:search', 'Lern');
    await nextTick();

    await rolleAutocomplete?.setValue(undefined);
    await nextTick();

    // Set the newValue to '' and the oldValue is in this case 'Lern' and so the method should just return
    await rolleAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(rolleAutocomplete?.text()).toEqual('');
    expect(personenkontextStore.processWorkflowStep).toHaveBeenCalledWith({ organisationId: '1133', limit: 25 });
  });
  test('it sends a request if the newValue is empty and the selected Organisation is not defined', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', 'Lern');
    await nextTick();

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('');
  });
  test('it sends a request if the newValue is empty and the selected Organisation is defined', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });

    await organisationAutocomplete?.setValue('1133');
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', 'Lern');
    await nextTick();

    await organisationAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    expect(organisationAutocomplete?.text()).toEqual('orga');
  });
  test('Do nothing with Klassen if the orga was reset', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');
    await nextTick();

    const rolleAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    expect(klassenAutocomplete?.text()).toBeFalsy();
  });
});
