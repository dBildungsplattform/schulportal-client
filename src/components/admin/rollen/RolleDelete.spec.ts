import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import RolleDelete from './RolleDelete.vue';
import { RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(RolleDelete, {
    attachTo: document.getElementById('app') || '',
    props: {
      errorCode: '',
      rolle: {
        id: '1',
        administeredBySchulstrukturknoten: '3',
        merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
      },
    },
    global: {
      components: {
        RolleDelete,
      },
    },
  });
});

describe('Delete Rolle', () => {
  test('it opens the dialog', async () => {
    wrapper?.get('[data-testid="open-rolle-delete-dialog-icon"]').trigger('click');
    await document.querySelector('[data-testid="rolle-delete-confirmation-text"]');
    expect(document.querySelector('[data-testid="rolle-delete-confirmation-text"]')).not.toBeNull();
  });
});
