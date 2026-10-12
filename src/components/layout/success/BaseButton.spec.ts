import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, type ComponentInstance } from 'vue';
import { createVuetify } from 'vuetify';
import { VBtn, VCol } from 'vuetify/components';
import BaseButton from './BaseButton.vue';

enableAutoUnmount(afterEach);

const setup = (
  appearance: 'primary' | 'secondary' = 'primary',
): {
  wrapper: VueWrapper<ComponentInstance<typeof BaseButton>>;
  vuetify: ReturnType<typeof createVuetify>;
} => {
  const vuetify: ReturnType<typeof createVuetify> = createVuetify();
  const wrapper: VueWrapper<ComponentInstance<typeof BaseButton>> = mount(BaseButton, {
    attachTo: document.getElementById('app') || '',
    global: { plugins: [vuetify] },
    props: { appearance, testId: 'test-button' },
    slots: { default: 'Continue' },
  });
  return { wrapper, vuetify };
};

describe('BaseButton', (): void => {
  test.each(['primary', 'secondary'] as const)(
    'should render the label and ID with %s appearance',
    (appearance: 'primary' | 'secondary'): void => {
      const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BaseButton>> } = setup(appearance);

      expect(wrapper.get('[data-testid="test-button"]').text()).toBe('Continue');
      expect(wrapper.getComponent(VBtn).classes()).toContain(appearance);
      expect(wrapper.getComponent(VCol).props()).toMatchObject({ cols: '12', sm: '6', md: 'auto' });
    },
  );

  test('should update appearance and ID when props change', async (): Promise<void> => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BaseButton>> } = setup();
    await wrapper.setProps({ appearance: 'secondary', testId: 'updated-button' });

    expect(wrapper.get('[data-testid="updated-button"]').classes()).toContain('secondary');
    expect(wrapper.getComponent(VBtn).classes()).not.toContain('primary');
    expect(wrapper.find('[data-testid="test-button"]').exists()).toBe(false);
  });

  test('should emit one click when the button is clicked', async (): Promise<void> => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BaseButton>> } = setup();
    await wrapper.get('[data-testid="test-button"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  test('should update block sizing when the viewport changes', async (): Promise<void> => {
    const {
      wrapper,
      vuetify,
    }: { wrapper: VueWrapper<ComponentInstance<typeof BaseButton>>; vuetify: ReturnType<typeof createVuetify> } =
      setup();

    vi.stubGlobal('innerWidth', 600);
    vuetify.display.update();
    await nextTick();
    expect(wrapper.getComponent(VBtn).props('block')).toBe(true);

    vi.stubGlobal('innerWidth', 1600);
    vuetify.display.update();
    await nextTick();
    expect(wrapper.getComponent(VBtn).props('block')).toBe(false);
  });
});
