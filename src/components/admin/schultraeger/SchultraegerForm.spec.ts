import {
  useOrganisationStore,
  OrganisationsTyp,
  type Organisation,
  type OrganisationStore,
} from '@/stores/OrganisationStore';
import { VueWrapper, mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import SchultraegerForm from './SchultraegerForm.vue';

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();

const rootChildSchultraegerList: Array<Organisation> = [
  {
    id: '9257685',
    name: 'Albert-Einstein-Gymnasium',
    typ: OrganisationsTyp.Schule,
  },
  {
    id: '3568865',
    name: 'Marie-Curie-Gymnasium',
    typ: OrganisationsTyp.Schule,
  },
];

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SchultraegerForm, {
    attachTo: document.getElementById('app') || '',
    props: {
      isLoading: false,
      onHandleConfirmUnsavedChanges: () => vi.fn(),
      onHandleDiscard: () => vi.fn(),
      onShowDialogChange: (value?: boolean) => value,
      onSubmit: () => vi.fn(),
      rootChildSchultraegerList,
    },
    global: {
      components: {
        SchultraegerForm,
      },
    },
  });
  organisationStore.$reset();
});

describe('SchultraegerForm', () => {
  test('it renders the Schultraeger form', () => {
    expect(wrapper?.find('[data-testid="schultraeger-form"]').isVisible()).toBe(true);
  });
});
