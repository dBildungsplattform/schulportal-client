import { DOMWrapper, VueWrapper, mount } from '@vue/test-utils';
import { nextTick, type Component } from 'vue';
import VidisInfoDialog from './VidisInfoDialog.vue';

let wrapper: VueWrapper | null = null;

beforeEach(() => {
  wrapper = mount(VidisInfoDialog, {
    props: {
      header: 'Dialog Header',
      text: 'Dialog text with provider name',
      modelValue: true,
    },
    global: {
      components: {
        VidisInfoDialog: VidisInfoDialog as Component,
      },
      stubs: {
        'v-dialog': {
          name: 'v-dialog',
          template: '<div data-testid="vidis-dialog-stub"><slot /></div>',
        },
      },
      mocks: {
        $t: (key: string): string => key,
      },
    },
  });
});

afterEach(() => {
  wrapper?.unmount();
});

describe('VidisInfoDialog.vue', () => {
  test('renders header and text props', () => {
    const header: DOMWrapper<Element> = wrapper!.find('[data-testid="vidis-info-dialog-headline"]');
    const text: DOMWrapper<Element> = wrapper!.find('[data-testid="vidis-info-dialog-text"]');

    expect(header.exists()).toBe(true);
    expect(header.text()).toBe('Dialog Header');
    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('Dialog text with provider name');
  });

  test('emits update:modelValue false when ok button is clicked', async () => {
    const closeButton: DOMWrapper<Element> = wrapper!.find('[data-testid="close-vidis-info-dialog-button"]');

    expect(closeButton.exists()).toBe(true);
    await closeButton.trigger('click');

    expect(wrapper!.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper!.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  test('emits after-leave when dialog after-leave is fired', async () => {
    wrapper!.findComponent({ name: 'v-dialog' }).vm.$emit('after-leave');
    await nextTick();

    expect(wrapper!.emitted('after-leave')).toBeTruthy();
  });
});
