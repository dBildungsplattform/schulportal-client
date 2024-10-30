import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import PersonenMetadataChange from './PersonenMetadataChange.vue';

describe('PersonenMetadataChange', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(PersonenMetadataChange, {
      props: {
        hasKopersRolle: true,
        selectedKopersNrMetadataProps: {
          error: false,
          'error-messages': [],
          onBlur: () => vi.fn(),
          onChange: () => vi.fn(),
          onInput: () => vi.fn(),
        },
        selectedKopersNrMetadata: '123456',
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
      },
      global: {
        mocks: {
          $t: (key: string) => key, // Mock translation function
        },
      },
    });
  });

  it('renders Vorname input', () => {
    expect(wrapper.find('[data-testid="vorname-input"]').exists()).toBe(true);
  });

  it('renders Familienname input', () => {
    expect(wrapper.find('[data-testid="familienname-input"]').exists()).toBe(true);
  });

  it('renders KopersInput when hasKopersRolle is true', () => {
    expect(wrapper.findComponent({ name: 'KopersInput' }).exists()).toBe(true);
  });

  it('does not render KopersInput when hasKopersRolle is false', async () => {
    await wrapper.setProps({ hasKopersRolle: false });
    expect(wrapper.findComponent({ name: 'KopersInput' }).exists()).toBe(false);
  });

  it('emits update:selectedVorname when Vorname input changes', async () => {
    const input: VueWrapper = wrapper.findComponent({ ref: 'vorname-input' });
    await input.setValue('Jane');
    expect(wrapper.emitted('update:selectedVorname')).toBeTruthy();
    expect(wrapper.emitted('update:selectedVorname')?.[0]).toEqual(['Jane']);
  });

  it('emits update:selectedFamilienname when Familienname input changes', async () => {
    const input: VueWrapper = wrapper.findComponent({ ref: 'familienname-input' });
    await input.setValue('Smith');
    expect(wrapper.emitted('update:selectedFamilienname')).toBeTruthy();
    expect(wrapper.emitted('update:selectedFamilienname')?.[0]).toEqual(['Smith']);
  });

  it('emits update:selectedKopersNrMetadata when KopersInput changes', async () => {
    const kopersInput: VueWrapper = wrapper.findComponent({ name: 'KopersInput' });
    await kopersInput.vm.$emit('update:selectedKopersNr', '654321');
    expect(wrapper.emitted('update:selectedKopersNrMetadata')).toBeTruthy();
    expect(wrapper.emitted('update:selectedKopersNrMetadata')?.[0]).toEqual(['654321']);
  });
});
