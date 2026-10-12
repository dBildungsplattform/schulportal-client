import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';
import { type ComponentInstance } from 'vue';
import { createVuetify } from 'vuetify';
import { VBtn, VCol } from 'vuetify/components';
import NavigationButton from './NavigationButton.vue';

enableAutoUnmount(afterEach);

const setup = (): {
  wrapper: VueWrapper<ComponentInstance<typeof NavigationButton>>;
  vuetify: ReturnType<typeof createVuetify>;
} => {
  const vuetify: ReturnType<typeof createVuetify> = createVuetify();
  const wrapper: VueWrapper<ComponentInstance<typeof NavigationButton>> = mount(NavigationButton, {
    attachTo: document.getElementById('app') || '',
    global: { plugins: [vuetify] },
    slots: { default: 'Back to list' },
  });
  return { wrapper, vuetify };
};

describe('NavigationButton', (): void => {
  test('should render the label with fixed secondary appearance and test ID', (): void => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof NavigationButton>> } = setup();
    const button: Omit<VueWrapper<ComponentInstance<typeof VBtn>>, 'exists'> = wrapper.getComponent(VBtn);

    expect(wrapper.get('[data-testid="navigation-button"]').text()).toBe('Back to list');
    expect(button.classes()).toContain('secondary');
    expect(button.classes()).not.toContain('primary');
    expect(wrapper.getComponent(VCol).props()).toMatchObject({ cols: '12', sm: '6', md: 'auto' });
  });

  test('should emit one click when the button is clicked', async (): Promise<void> => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof NavigationButton>> } = setup();
    await wrapper.get('[data-testid="navigation-button"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
