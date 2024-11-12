import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseChange from './KlasseChange.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;
const schulen: Array<{ value: string; title: string }> = [
  {
    value: '1',
    title: 'Schule 1',
  },
  {
    value: '2',
    title: 'Schule 2',
  },
];

const klassen: Array<{ value: string; title: string }> = [
  {
    value: '1',
    title: 'Klasse 1',
  },
  {
    value: '2',
    title: 'Klasse 2',
  },
];

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(KlasseChange, {
    attachTo: document.getElementById('app') || '',
    props: {
      schulen,
      klassen,
      readonly: false,
      selectedSchuleProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      selectedNewKlasseProps: {
        error: false,
        'error-messages': [],
        onBlur: () => vi.fn(),
        onChange: () => vi.fn(),
        onInput: () => vi.fn(),
      },
      isEditActive: true,
      onSubmit: () => vi.fn(),
    },
    global: {
      components: {
        KlasseChange,
      },
    },
  });
});

describe('KlasseChange', () => {
  test('it renders the component', () => {
    expect(wrapper?.find('[data-testid="klasse-change-form"]').isVisible()).toBe(true);
  });

  test('it selects values and emits submit event', async () => {
    await wrapper?.findComponent({ ref: 'schule-select' }).setValue('2');
    await wrapper?.find('[data-testid="schule-select"]').trigger('change');
    await nextTick();

    await wrapper?.findComponent({ ref: 'klasse-select' }).setValue('2');
    await wrapper?.findComponent({ ref: 'klasse-select' }).trigger('change');

    await wrapper?.find('[data-testid="klasse-change-form"]').trigger('submit');
    expect(wrapper?.emitted('submit')).toBeTruthy();
  });

  test('Do nothing with Klassen if the orga was reset', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('1');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.vm.$emit('update:search', '');
    await nextTick();

    await organisationAutocomplete?.setValue(undefined);
    await nextTick();

    expect(klassenAutocomplete?.text()).toBeFalsy();
  });

  test('Trigger Klassen search if the klasse was set', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('1');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.setValue('1');
    await nextTick();

    expect(klassenAutocomplete?.text()).toBeTruthy();
  });
});
