import { expect, test } from 'vitest';
import { VueWrapper, mount } from '@vue/test-utils';
import SpshBanner from './SpshBanner.vue';
import { nextTick } from 'vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SpshBanner, {
    props: {
      id: 'alert',
      visible: true,
      text: 'This is the text of the alert',
      type: 'errorAlt',
    },

    global: {
      components: {
        SpshBanner,
      },
    },
  });
});

describe('SpshBanner Alert', () => {
  test('it renders the alert when modelValue is true', () => {
    expect(wrapper?.find('.v-alert').isVisible()).toBe(true);
  });

  test('it does render the correct text', async () => {
    expect(wrapper?.text()).toContain('This is the text of the alert');
  });

  test('close button is visible and clickable', async () => {
    expect(wrapper?.find('[data-testid="banner-close-icon"]').isVisible()).toBe(true);
    wrapper?.find('[data-testid="banner-close-icon"]').trigger('click');
    await nextTick();
    expect(wrapper?.emitted('dismissBanner')).toBeTruthy();
  });
});
