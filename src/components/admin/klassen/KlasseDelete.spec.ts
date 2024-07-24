import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseDelete from './KlasseDelete.vue';

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
      klassenId: '1',
      klassenname: '1A',
      useIconActivator: true,
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
