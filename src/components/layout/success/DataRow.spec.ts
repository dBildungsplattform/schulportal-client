import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';
import { type ComponentInstance } from 'vue';
import DataRow from './DataRow.vue';

enableAutoUnmount(afterEach);

describe('DataRow', (): void => {
  test('should render a string value in a standalone row', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      props: { label: 'Name', value: 'Example' },
    });

    expect(wrapper.get('.bold').text()).toBe('Name:');
    expect(wrapper.get('.bold').classes()).toContain('text-right');
    expect(wrapper.get('span').text()).toBe('Example');
    expect(wrapper.classes()).toContain('v-row');
  });

  test('should render zero in a standalone row', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      props: { label: 'Name', value: 0 },
    });

    expect(wrapper.get('.bold').text()).toBe('Name:');
    expect(wrapper.get('.bold').classes()).toContain('text-right');
    expect(wrapper.get('span').text()).toBe('0');
    expect(wrapper.classes()).toContain('v-row');
  });

  test('should render an empty value when undefined in a standalone row', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      props: { label: 'Name', value: undefined },
    });

    expect(wrapper.get('.bold').text()).toBe('Name:');
    expect(wrapper.get('.bold').classes()).toContain('text-right');
    expect(wrapper.get('span').text()).toBe('');
    expect(wrapper.classes()).toContain('v-row');
  });

  test('should allow custom value content through the default slot', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      props: { label: 'Logo' },
      slots: { default: '<img src="/logo.png" alt="Example logo" />' },
    });

    expect(wrapper.get('span img').attributes('alt')).toBe('Example logo');
    expect(wrapper.findAll('[data-testid]')).toHaveLength(0);
  });

  test('should render named slots when props are absent', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      slots: {
        label: '<strong>Slot label</strong>',
        value: '<em>Slot value</em>',
      },
    });

    expect(wrapper.get('.bold strong').text()).toBe('Slot label');
    expect(wrapper.get('.bold').text()).toBe('Slot label:');
    expect(wrapper.get('span em').text()).toBe('Slot value');
  });

  describe('when string props and slots are provided', (): void => {
    test('should prefer props over slots', (): void => {
      const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
        attachTo: document.getElementById('app') || '',
        props: { label: 'Name', value: 'Example' },
        slots: {
          label: '<strong>Slot label</strong>',
          value: '<em>Slot value</em>',
          default: '<i>Default value</i>',
        },
      });

      expect(wrapper.get('.bold').text()).toBe('Name:');
      expect(wrapper.get('span').text()).toBe('Example');
      expect(wrapper.find('strong').exists()).toBe(false);
      expect(wrapper.find('em').exists()).toBe(false);
      expect(wrapper.find('i').exists()).toBe(false);
    });
  });

  describe('when the value prop is zero and slots are provided', (): void => {
    test('should prefer props over slots', (): void => {
      const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
        attachTo: document.getElementById('app') || '',
        props: { label: 'Count', value: 0 },
        slots: {
          label: '<strong>Slot label</strong>',
          value: '<em>Slot value</em>',
          default: '<i>Default value</i>',
        },
      });

      expect(wrapper.get('.bold').text()).toBe('Count:');
      expect(wrapper.get('span').text()).toBe('0');
      expect(wrapper.find('strong').exists()).toBe(false);
      expect(wrapper.find('em').exists()).toBe(false);
      expect(wrapper.find('i').exists()).toBe(false);
    });
  });

  describe('when props are empty strings and slots are provided', (): void => {
    test('should prefer props over slots', (): void => {
      const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
        attachTo: document.getElementById('app') || '',
        props: { label: '', value: '' },
        slots: {
          label: '<strong>Slot label</strong>',
          value: '<em>Slot value</em>',
          default: '<i>Default value</i>',
        },
      });

      expect(wrapper.get('.bold').text()).toBe(':');
      expect(wrapper.get('span').text()).toBe('');
      expect(wrapper.find('strong').exists()).toBe(false);
      expect(wrapper.find('em').exists()).toBe(false);
      expect(wrapper.find('i').exists()).toBe(false);
    });
  });

  test('should prefer the named value slot over the default slot', (): void => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      slots: {
        value: '<em>Slot value</em>',
        default: '<i>Default value</i>',
      },
    });

    expect(wrapper.get('span em').text()).toBe('Slot value');
    expect(wrapper.find('i').exists()).toBe(false);
  });

  test('should switch between props and slot fallbacks when props change', async (): Promise<void> => {
    const wrapper: VueWrapper<ComponentInstance<typeof DataRow>> = mount(DataRow, {
      attachTo: document.getElementById('app') || '',
      props: { label: 'Name', value: 'Example' },
      slots: {
        label: '<strong>Slot label</strong>',
        value: '<em>Slot value</em>',
      },
    });

    await wrapper.setProps({ label: undefined, value: undefined });

    expect(wrapper.get('.bold strong').text()).toBe('Slot label');
    expect(wrapper.get('span em').text()).toBe('Slot value');

    await wrapper.setProps({ label: 'Updated name', value: 'Updated value' });

    expect(wrapper.get('.bold').text()).toBe('Updated name:');
    expect(wrapper.get('span').text()).toBe('Updated value');
    expect(wrapper.find('strong').exists()).toBe(false);
    expect(wrapper.find('em').exists()).toBe(false);
  });
});
