import { expect, test } from 'vitest';
import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import NotFoundView from './NotFoundView.vue';

let wrapper: VueWrapper | null = null;

beforeAll(() => {
  Object.defineProperty(window, 'history', {
    value: { back: vi.fn() },
    writable: false,
  });
});

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
    const button: DOMWrapper<HTMLButtonElement> | undefined = wrapper?.find('[data-testid="alert-button"]');
    expect(button?.isVisible()).toBe(true);
    await button?.trigger('click');
    expect(window.history.back).toHaveBeenCalled();
  });
});
