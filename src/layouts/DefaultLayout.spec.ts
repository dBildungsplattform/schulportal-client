import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import DefaultLayout from './DefaultLayout.vue';
import type { Component } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(DefaultLayout, {
    attachTo: document.getElementById('app') || '',
    global: {
      components: {
        DefaultLayout: DefaultLayout as Component,
      },
    },
    slots: {
      default: 'Main Content',
    },
  });
});

// TODO: we have to use v-layout as wrapper in DefaultLayout.vue, which breaks the layout
//       we have to fix the broken layout before we can increase the coverage threshold for layouts
describe('DefaultLayout', () => {
  test.skip('it renders the slot content inside the default layout', () => {
    expect(wrapper?.html()).toContain('Main Content');
  });
});
