import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PersonInfoChange from './PersonenInfoChange.vue';

let wrapper: VueWrapper;

beforeEach(() => {
  document.body.innerHTML = `
      <div>
        <div id="app"></div>
      </div>
    `;

  wrapper = mount(PersonInfoChange, {
    attachTo: document.getElementById('app') || '',
    props: {
      confirmUnsavedChangesAction: () => vi.fn(),
      hasKopersRolle: true,
      selectedKopersNrPersonInfoProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedKopersNrPersonInfo: '123456',
      selectedVornameProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedVorname: 'John',
      selectedFamiliennameProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedFamilienname: 'Doe',
      showUnsavedChangesDialog: false,
    },
    global: {
      components: {
        PersonInfoChange,
      },
    },
  });
});

describe('PersonInfoChange', () => {
  it('renders Vorname input', () => {
    expect(wrapper.find('[data-testid="vorname-input"]').isVisible()).toBe(true);
  });
});
