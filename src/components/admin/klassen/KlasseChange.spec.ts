import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import KlasseChange from './KlasseChange.vue';
import { nextTick } from 'vue';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

let wrapper: VueWrapper | null = null;
const organisationStore: OrganisationStore = useOrganisationStore();
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
  vi.useFakeTimers();
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

afterEach(() => {
  vi.clearAllTimers();
  vi.clearAllMocks();
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

  test('should not call getKlassenByOrganisationId when no organisation is selected', async () => {
    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.vm.$emit('update:search', 'test');
    vi.advanceTimersByTime(500);
    await nextTick();

    expect(organisationStore.getKlassenByOrganisationId).not.toHaveBeenCalled();
  });
  test('should not search when search value matches selected class title', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('1');

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });
    await klassenAutocomplete?.setValue('1'); // Select Klasse 1
    await klassenAutocomplete?.vm.$emit('update:search', 'Klasse 1'); // Search with same title

    vi.advanceTimersByTime(500);
    expect(organisationStore.getKlassenByOrganisationId).not.toHaveBeenCalled();
  });

  test('should update selectedNewKlasse value when set to a new value', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('1');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await klassenAutocomplete?.setValue('2');
    await nextTick();

    expect(organisationStore.getKlassenByOrganisationId).not.toHaveBeenCalled();
  });

  test('should call getKlassenByOrganisationId when selectedNewKlasse is set to undefined', async () => {
    const organisationAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'schule-select' });
    await organisationAutocomplete?.setValue('1');
    await nextTick();

    const klassenAutocomplete: VueWrapper | undefined = wrapper?.findComponent({ ref: 'klasse-select' });

    await klassenAutocomplete?.setValue('1');
    await nextTick();

    await klassenAutocomplete?.setValue(undefined);
    await nextTick();

    expect(organisationStore.getKlassenByOrganisationId).toHaveBeenCalledWith({ limit: 25, administriertVon: ['1'] });
  });
});
