import { expect, test, type MockInstance } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import NotFoundView from './NotFoundView.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  document.body.innerHTML = `
    <div>
      <div id="app"></div>
    </div>
  `;

  wrapper = mount(NotFoundView, {
    props: {
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

describe('NotFoundView', () => {
  test('it renders with the correct title and text', () => {
    expect(wrapper?.text()).toContain('404');
    expect(wrapper?.text()).toContain('Page not found');
  });

  test('it navigates back on button click', async () => {
    const spy: MockInstance = vi.spyOn(window.history, 'back').mockImplementation(() => vi.fn());
    const button: DOMWrapper<HTMLButtonElement> | undefined = wrapper?.find('[data-testid="alert-button"]');
    expect(button?.isVisible()).toBe(true);
    await button?.trigger('click');
    expect(spy).toHaveBeenCalled();
  });
});
