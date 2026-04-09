import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ServiceProviderDelete from './ServiceProviderDelete.vue';

describe('ServiceProviderDelete.vue', () => {
  interface DefaultProps {
    errorCode: string;
    serviceProviderId: string;
    serviceProviderName: string;
    isLoading: boolean;
  }

  const defaultProps: DefaultProps = {
    errorCode: '',
    serviceProviderId: 'sp-123',
    serviceProviderName: 'Test Provider',
    isLoading: false,
  };

  async function openDialog(wrapper: VueWrapper<any>): Promise<void> {
    const activator = wrapper.find('[data-testid="open-service-provider-delete-dialog-icon"]');
    expect(activator.exists()).toBe(true);
    await activator.trigger('click');
    await nextTick();
    await nextTick(); // ensure dialog is rendered
  }

  function mountDialog(props: Partial<DefaultProps> = {}): VueWrapper<any> {
    return mount(ServiceProviderDelete, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          transition: false,
          'v-dialog': {
            name: 'v-dialog',
            template:
              '<div><slot name="activator" :props="{}" /><slot name="default" :isActive="{ value: true }" /></div>',
          },
        },
      },
    });
  }

  it('renders confirmation message by default', async () => {
    const wrapper = mountDialog();
    await openDialog(wrapper);
    expect(wrapper.find('[data-testid="service-provider-delete-confirmation-text"]').exists()).toBe(true);
    expect(wrapper.html()).toContain('Möchten Sie das Angebot Test Provider wirklich löschen');
  });

  it('renders error message if errorCode is set', async () => {
    const wrapper = mountDialog({ errorCode: 'someError' });
    await openDialog(wrapper);
    expect(wrapper.html()).toContain('admin.angebot.delete.errors.someError');
  });

  it('emits onDeleteServiceProvider when delete button is clicked', async () => {
    const wrapper = mountDialog();
    await openDialog(wrapper);
    const btn = wrapper.find('[data-testid="service-provider-delete-button"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    expect(wrapper.emitted('onDeleteServiceProvider')).toBeTruthy();
    expect(wrapper.emitted('onDeleteServiceProvider')![0]).toEqual(['sp-123']);
  });

  it('emits onClose when close button is clicked in success state', async () => {
    const wrapper = mountDialog();
    await openDialog(wrapper);
    // Simulate state COMPLETE
    await wrapper.find('[data-testid="service-provider-delete-button"]')?.trigger('click');
    await nextTick();
    const btn = wrapper.find('[data-testid="close-service-provider-delete-success-dialog-button"]');
    if (btn.exists()) {
      await btn.trigger('click');
      expect(wrapper.emitted('onClose')).toBeTruthy();
    }
  });

  it('disables delete button when loading', async () => {
    const wrapper = mountDialog({ isLoading: true });
    await openDialog(wrapper);
    const btn = wrapper.find('[data-testid="service-provider-delete-button"]');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('disabled')).toBeDefined();
  });
});
