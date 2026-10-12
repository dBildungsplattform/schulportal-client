import SuccessIcon from '@/components/icons/SuccessIcon.vue';
import SpshDivider from '@/components/layout/SpshDivider.vue';
import DataRow from '@/components/layout/success/DataRow.vue';
import { VueWrapper, enableAutoUnmount, mount, type DOMWrapper } from '@vue/test-utils';
import { expect, test } from 'vitest';
import type { ComponentInstance } from 'vue';
import { createVuetify } from 'vuetify';
import { VBtn, VCol } from 'vuetify/components';
import BehoerdeSuccessTemplate from './BehoerdeSuccessTemplate.vue';

enableAutoUnmount(afterEach);

const setup = (): { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } => {
  const wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> = mount(BehoerdeSuccessTemplate, {
    global: { plugins: [createVuetify()] },
    props: {
      successMessage: 'Die Behörde wurde erfolgreich hinzugefügt.',
      changedData: [{ label: 'Behördenname', value: 'Test Behörde', testId: 'created-behoerde-name' }],
      backButtonText: 'Zurück zur Ergebnisliste',
      createAnotherButtonText: 'Weitere Behörde anlegen',
    },
  });

  return { wrapper };
};

describe('BehoerdeSuccessTemplate', () => {
  test('it displays the success message and data correctly', () => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

    expect(wrapper.get('[data-testid="behoerde-success-text"]').text()).toBe(
      'Die Behörde wurde erfolgreich hinzugefügt.',
    );
    expect(wrapper.getComponent(DataRow).get('span').text()).toBe('Test Behörde');
    expect(wrapper.findComponent(SuccessIcon).exists()).toBe(true);
    expect(wrapper.findComponent(SpshDivider).exists()).toBe(true);
  });

  test('it emits onCreateAnotherBehoerde when the create another button is clicked', async () => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

    await wrapper.get('[data-testid="create-another-button"]').trigger('click');
    expect(wrapper.emitted('onCreateAnotherBehoerde')).toHaveLength(1);
  });

  test('it emits onNavigateBackToBehoerdeList when the back button is clicked', async () => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

    await wrapper.get('[data-testid="navigation-button"]').trigger('click');
    expect(wrapper.emitted('onNavigateBackToBehoerdeList')).toHaveLength(1);
  });

  describe('when the back button text is undefined', () => {
    test('should hide the back button', async (): Promise<void> => {
      const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

      await wrapper.setProps({ backButtonText: undefined });

      expect(wrapper.find('[data-testid="navigation-button"]').exists()).toBe(false);
      expect(wrapper.get('[data-testid="create-another-button"]').text()).toBe('Weitere Behörde anlegen');
    });
  });

  describe('when the back button text is empty', () => {
    test('should hide the back button', async (): Promise<void> => {
      const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

      await wrapper.setProps({ backButtonText: '' });

      expect(wrapper.find('[data-testid="navigation-button"]').exists()).toBe(false);
      expect(wrapper.get('[data-testid="create-another-button"]').text()).toBe('Weitere Behörde anlegen');
    });
  });

  test('should render multiple data rows and their labels', async (): Promise<void> => {
    const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

    await wrapper.setProps({
      changedData: [
        { label: 'Name', value: 'First value', testId: 'first-value' },
        { label: 'Description', value: 'Second value', testId: 'second-value' },
      ],
    });

    expect(wrapper.findAll('.bold').map((label: DOMWrapper<Element>): string => label.text())).toEqual([
      'Name:',
      'Description:',
    ]);
    expect(
      wrapper
        .findAllComponents(DataRow)
        .map((row: VueWrapper<ComponentInstance<typeof DataRow>>): string => row.get('span').text()),
    ).toEqual(['First value', 'Second value']);
  });

  describe('when the viewport width is 600 pixels', () => {
    test('should render block buttons in responsive columns', (): void => {
      vi.stubGlobal('innerWidth', 600);
      const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

      const buttons: VueWrapper<ComponentInstance<typeof VBtn>>[] = wrapper.findAllComponents(VBtn);
      expect(buttons).toHaveLength(2);
      buttons.forEach((button: VueWrapper<ComponentInstance<typeof VBtn>>): void => {
        expect(button.props('block')).toBe(true);
      });
      const actionColumns: VueWrapper<ComponentInstance<typeof VCol>>[] = wrapper
        .findAllComponents(VCol)
        .filter((column: VueWrapper<ComponentInstance<typeof VCol>>): boolean => column.props('md') === 'auto');
      expect(actionColumns).toHaveLength(2);
      actionColumns.forEach((column: VueWrapper<ComponentInstance<typeof VCol>>): void => {
        expect(column.props('cols')).toBe('12');
        expect(column.props('sm')).toBe('6');
      });
    });
  });

  describe('when the viewport width is 1600 pixels', () => {
    test('should render non-block buttons in responsive columns', (): void => {
      vi.stubGlobal('innerWidth', 1600);
      const { wrapper }: { wrapper: VueWrapper<ComponentInstance<typeof BehoerdeSuccessTemplate>> } = setup();

      const buttons: VueWrapper<ComponentInstance<typeof VBtn>>[] = wrapper.findAllComponents(VBtn);
      expect(buttons).toHaveLength(2);
      buttons.forEach((button: VueWrapper<ComponentInstance<typeof VBtn>>): void => {
        expect(button.props('block')).toBe(false);
      });
      const actionColumns: VueWrapper<ComponentInstance<typeof VCol>>[] = wrapper
        .findAllComponents(VCol)
        .filter((column: VueWrapper<ComponentInstance<typeof VCol>>): boolean => column.props('md') === 'auto');
      expect(actionColumns).toHaveLength(2);
      actionColumns.forEach((column: VueWrapper<ComponentInstance<typeof VCol>>): void => {
        expect(column.props('cols')).toBe('12');
        expect(column.props('sm')).toBe('6');
      });
    });
  });
});
