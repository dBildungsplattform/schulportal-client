import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';
import { type ComponentInstance } from 'vue';
import { createVuetify } from 'vuetify';
import { VBtn, VCol } from 'vuetify/components';
import CreateAnotherButton from './CreateAnotherButton.vue';

enableAutoUnmount(afterEach);

afterEach((): void => {
  vi.unstubAllGlobals();
});

const setup = (): {
  wrapper: VueWrapper<ComponentInstance<typeof CreateAnotherButton>>;
  vuetify: ReturnType<typeof createVuetify>;
} => {
  const vuetify: ReturnType<typeof createVuetify> = createVuetify();
  const wrapper: VueWrapper<ComponentInstance<typeof CreateAnotherButton>> = mount(CreateAnotherButton, {
    attachTo: document.getElementById('app') || '',
    global: { plugins: [vuetify] },
    slots: { default: 'Create another' },
  });
  return { wrapper, vuetify };
};

describe('CreateAnotherButton', (): void => {
  test('should render the label with fixed primary appearance and test ID', (): void => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof CreateAnotherButton>> } = setup();
    const button: Omit<VueWrapper<ComponentInstance<typeof VBtn>>, 'exists'> = wrapper.getComponent(VBtn);

    expect(wrapper.get('[data-testid="create-another-button"]').text()).toBe('Create another');
    expect(button.classes()).toContain('primary');
    expect(button.classes()).not.toContain('secondary');
    expect(wrapper.getComponent(VCol).props()).toMatchObject({ cols: '12', sm: '6', md: 'auto' });
  });

  test('should emit one click when the button is clicked', async (): Promise<void> => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof CreateAnotherButton>> } = setup();
    await wrapper.get('[data-testid="create-another-button"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
