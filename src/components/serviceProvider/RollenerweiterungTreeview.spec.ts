import { expect, test, describe } from 'vitest';
import { mount } from '@vue/test-utils';
import RollenerweiterungTreeview, { type RolleForSelection } from './RollenerweiterungTreeview.vue';
import { RollenArt } from '@/stores/RolleStore';
import type WrapperLike from 'node_modules/@vue/test-utils/dist/interfaces/wrapperLike';

const mockRollen: RolleForSelection[] = [
  { id: 'lehr-1', name: 'Lehrer A', rollenart: RollenArt.Lehr },
  { id: 'lehr-2', name: 'Lehrer B', rollenart: RollenArt.Lehr },
  { id: 'lern-1', name: 'Schüler A', rollenart: RollenArt.Lern },
  { id: 'leit-1', name: 'Schulleiter A', rollenart: RollenArt.Leit },
];

function mountComponent(props: Partial<InstanceType<typeof RollenerweiterungTreeview>['$props']> = {}): WrapperLike {
  return mount(RollenerweiterungTreeview, {
    props: {
      availableRollen: mockRollen,
      initiallySelectedRolleIds: [],
      loading: false,
      ...props,
    },
  });
}

describe('RollenerweiterungTreeview - Loading state', () => {
  test('shows spinner when loading is true', () => {
    const wrapper: WrapperLike = mountComponent({ loading: true });
    expect(wrapper.find('.v-progress-circular').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rollenerweiterung-tree"]').exists()).toBe(false);
  });

  test('hides spinner when loading is false', () => {
    const wrapper: WrapperLike = mountComponent({ loading: false });
    expect(wrapper.find('.v-progress-circular').exists()).toBe(false);
  });
});

describe('RollenerweiterungTreeview - Empty state', () => {
  test('shows empty message when no rollen are available', () => {
    const wrapper: WrapperLike = mountComponent({ availableRollen: [] });
    expect(wrapper.find('.treeview-empty').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rollenerweiterung-tree"]').exists()).toBe(false);
  });

  test('does not show empty message when rollen are available', () => {
    const wrapper: WrapperLike = mountComponent();
    expect(wrapper.find('.treeview-empty').exists()).toBe(false);
  });
});

describe('RollenerweiterungTreeview - Group rendering', () => {
  test('renders group node for each rollenart present', () => {
    const wrapper: WrapperLike = mountComponent();
    expect(wrapper.find('[data-testid="treeview-group-LEHR"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="treeview-group-LERN"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="treeview-group-LEIT"]').exists()).toBe(true);
  });

  test('does not render group when no rollen exist for that rollenart', () => {
    const wrapper: WrapperLike = mountComponent({
      availableRollen: [{ id: 'lehr-1', name: 'Lehrer A', rollenart: RollenArt.Lehr }],
    });
    expect(wrapper.find('[data-testid="treeview-group-LEHR"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="treeview-group-LERN"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="treeview-group-LEIT"]').exists()).toBe(false);
  });
});
