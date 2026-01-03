import { expect, test, describe, beforeEach } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import LabeledField from './LabeledField.vue';
import type { Component } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;
});

describe('LabeledField', () => {
  test('it renders the labeled field with text value', () => {
    wrapper = mount(LabeledField, {
      attachTo: document.getElementById('app') || '',
      props: {
        label: 'Name',
        value: 'Test Service Provider',
        testId: 'test-field',
      },
      global: {
        components: {
          LabeledField: LabeledField as Component,
        },
      },
    });

    expect(wrapper.find('.subtitle-2').text()).toBe('Name:');
    expect(wrapper.find('[data-testid="test-field"]').text()).toBe('Test Service Provider');
    expect(wrapper.find('.text-body').exists()).toBe(true);
  });

  test('it renders without top margin when noMarginTop is true', () => {
    wrapper = mount(LabeledField, {
      attachTo: document.getElementById('app') || '',
      props: {
        label: 'Test Label',
        value: 'Test Value',
        noMarginTop: true,
      },
    });

    const row: DOMWrapper<Element> = wrapper.find('.v-row');
    expect(row.classes()).not.toContain('mt-4');
    expect(row.classes()).toContain('align-center');
  });

  test('it renders logo when isLogo is true with logoSrc', () => {
    wrapper = mount(LabeledField, {
      attachTo: document.getElementById('app') || '',
      props: {
        label: 'Logo',
        isLogo: true,
        logoSrc: 'https://example.com/logo.png',
        testId: 'logo-field',
      },
    });

    expect(wrapper.find('.subtitle-2').text()).toBe('Logo:');
    const img: DOMWrapper<Element> = wrapper.find('[alt="provider-logo"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo.png');
    expect(wrapper.find('.text-body').exists()).toBe(false);
  });

  test('it renders default logo when isLogo is true without logoSrc', () => {
    const defaultLogo: string = 'https://example.com/default-logo.svg';

    wrapper = mount(LabeledField, {
      attachTo: document.getElementById('app') || '',
      props: {
        label: 'Logo',
        isLogo: true,
        defaultLogoSrc: defaultLogo,
        testId: 'logo-field',
      },
    });

    const img: DOMWrapper<Element> = wrapper.find('[alt="schulportal-logo"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(defaultLogo);
  });
});
