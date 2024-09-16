import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KopersInput from './KopersInput.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KopersInput, {
    attachTo: document.getElementById('app') || '',
    props: {
      hasNoKopersNr: false,
      selectedKopersNr: undefined,
      selectedKopersNrProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
    },
    global: {
      components: {
        KopersInput,
      },
    },
  });
});

describe('kopers input', () => {
  test('it renders the component', async () => {
    expect(wrapper?.get('[data-testid="has-no-kopersnr-checkbox"]').isVisible()).toBe(true);
    expect(wrapper?.get('[data-testid="kopersnr-input"]').isVisible()).toBe(true);
  });

  // TODO: this doesn't work, the component does not emit anything on clicking the checkbox
  // test('it hides the input when the checkbox is checked', async () => {
  //   // expect(wrapper?.get('[data-testid="kopersnr-input"]').isVisible()).toBe(true);
  //   // await wrapper?.get('[data-testid="has-no-kopersnr-checkbox"] .v-selection-control__input i.v-icon').trigger('click');
  //   // await nextTick();
  //   // console.log('******* emits', wrapper?.emitted())
  //   // expect(wrapper?.get('[data-testid="kopersnr-input"]').isVisible()).toBe(false);
  // });

  test('it disables the checkbox when the input is filled', async () => {
    await wrapper?.get('[data-testid="kopersnr-input"] input').setValue('123456');
    await nextTick();
    expect(wrapper?.get('[data-testid="has-no-kopersnr-checkbox"].v-input--disabled').isVisible()).toBe(true);
  });
});
