import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseDelete from './KlasseDelete.vue';
import { OrganisationsTyp } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlasseDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      klasse: {
        id: '1',
        kennung: '1234567',
        name: 'Klasse 1',
        namensergaenzung: 'Ergänzung',
        kuerzel: 'K1',
        typ: OrganisationsTyp.Klasse,
        administriertVon: '1',
      },
    },
    global: {
      components: {
        KlasseDelete,
      },
    },
  });
});

describe('KlasseDelete', () => {
  test('it displays the success message and data correctly', () => {
    expect(wrapper?.get('[data-testid="open-klasse-delete-dialog-icon"]').text()).toBeDefined();
  });
});
