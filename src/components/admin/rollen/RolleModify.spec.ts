import { test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import routes from '@/router/routes';
import RolleModify from './RolleModify.vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';

let wrapper: VueWrapper | null = null;
let router: Router;
const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
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

  wrapper = mount(RolleModify, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      errorCode: '',
      isDialogVisible: true,
      personIDs: ['person1', 'person2'],
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
          merkmale: new Set<RollenMerkmal>(['KOPERS_PFLICHT']),
          rollenart: RollenArt.Lehr,
        },
      ],
    },
    global: {
      components: {
        RolleModify,
      },
      plugins: [router],
    },
  });
});

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
      administeredBySchulstrukturknotenName: 'Land SH',
      administeredBySchulstrukturknotenKennung: '',
      version: 1,
    },
  ],
  organisations: [
    {
      id: 'O1',
      kennung: '',
      name: 'Organisation1',
      namensergaenzung: 'string',
      kuerzel: 'string',
      typ: 'TRAEGER',
      administriertVon: '1',
    },
  ],
  selectedOrganisation: null,
  selectedRolle: null,
  canCommit: true,
};

describe('RolleModify', () => {
  test('renders the dialog when isDialogVisible is true', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'organisation-select' });
    await organisationAutocomplete?.setValue('O1');

    const rolleAutocomplete: VueWrapper | undefined = wrapper
      ?.findComponent({ ref: 'personenkontext-create' })
      .findComponent({ ref: 'rolle-select' });
    await rolleAutocomplete?.setValue('54321');

    expect(document.querySelector('[data-testid="layout-card"]')).not.toBeNull();
  });
});
