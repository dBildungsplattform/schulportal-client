import { expect, test } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import SpshAlert from '@/components/alert/SpshAlert.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(SpshAlert, {
    props: {
      buttonAction: vi.fn(),
      buttonText: 'Back',
      closable: false,
      modelValue: true,
      showButton: true,
      text: 'Page not found',
      title: '404',
      type: 'error',
    },
    attachTo: document.getElementById('app') || '',
  });
});

describe('SpshAlert', () => {
  test('it renders with the correct title and text', () => {
    expect(wrapper?.text()).toContain('404');
    expect(wrapper?.text()).toContain('Page not found');
  });

  test('it shows the back button with the correct text', () => {
    const button: DOMWrapper<HTMLButtonElement> | undefined = wrapper?.find('button');
    expect(button?.isVisible()).toBe(true);
    expect(button?.text()).toBe('Back');
  });
});
