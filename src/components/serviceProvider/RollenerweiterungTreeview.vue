<script setup lang="ts">
  import { RollenArt } from '@/stores/RolleStore';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  const { t }: Composer = useI18n({ useScope: 'global' });

  export type RolleForSelection = {
    id: string;
    name: string;
    rollenart: 'LEHR' | 'LERN' | 'LEIT' | string;
  };

  type TreeNode = {
    id: string;
    title: string;
    isGroup: boolean;
    rollenart?: RollenArt;
    children?: TreeNode[];
  };

  type Props = {
    availableRollen: RolleForSelection[];
    initiallySelectedRolleIds?: string[];
    loading?: boolean;
  };

  const props = withDefaults(defineProps<Props>(), {
    initiallySelectedRolleIds: () => [],
    loading: false,
  });

  const emit = defineEmits<{
    (e: 'update:selectedRolleIds', ids: string[]): void;
  }>();

  const GROUP_DEFINITIONS: { key: RollenArt; labelKey: string }[] = [
    { key: RollenArt.Lehr, labelKey: 'angebot.groupLehr' },
    { key: RollenArt.Lern, labelKey: 'angebot.groupLern' },
    { key: RollenArt.Leit, labelKey: 'angebot.groupLeit' },
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  const searchQuery: Ref<string> = ref('');
  const selected: Ref<string[]> = ref([...props.initiallySelectedRolleIds]);
  const opened: Ref<string[]> = ref(['group-LEHR', 'group-LERN', 'group-LEIT']);

  watch(
    () => props.initiallySelectedRolleIds,
    (ids: string[]) => {
      selected.value = [...ids];
    },
  );

  // ── Tree data ──────────────────────────────────────────────────────────────
  const allRolleIds: ComputedRef<Set<string>> = computed(
    () => new Set(props.availableRollen.map((r: RolleForSelection) => r.id)),
  );

  const fullGroups: ComputedRef<{ key: string; rollen: RolleForSelection[] }[]> = computed(() =>
    GROUP_DEFINITIONS.map((def) => ({
      key: def.key,
      rollen: props.availableRollen.filter((r: RolleForSelection) => r.rollenart === def.key),
    })).filter((g) => g.rollen.length > 0),
  );

  const treeItems: ComputedRef<TreeNode[]> = computed(() => {
    const q: string = searchQuery.value.trim().toLowerCase();

    return GROUP_DEFINITIONS.flatMap((def) => {
      const allChildren: RolleForSelection[] = props.availableRollen.filter(
        (r: RolleForSelection) => r.rollenart === def.key,
      );
      if (allChildren.length === 0) {
        return [];
      }

      const filteredChildren: RolleForSelection[] = q
        ? allChildren.filter((r: RolleForSelection) => r.name.toLowerCase().includes(q))
        : allChildren;

      if (filteredChildren.length === 0) {
        return [];
      }

      return [
        {
          id: `group-${def.key}`,
          title: t(def.labelKey),
          isGroup: true,
          rollenart: def.key,
          children: filteredChildren.map((r: RolleForSelection) => ({
            id: r.id,
            title: r.name,
            isGroup: false,
          })),
        } satisfies TreeNode,
      ];
    });
  });

  // ── Selection helpers ──────────────────────────────────────────────────────
  function getGroupRolleIds(rollenart: string): string[] {
    const group: { key: string; rollen: RolleForSelection[] } | undefined = fullGroups.value.find(
      (g: { key: string; rollen: RolleForSelection[] }) => g.key === rollenart,
    );
    return group?.rollen.map((r: RolleForSelection) => r.id) ?? [];
  }

  function getGroupSelectedCount(rollenart: string): number {
    return getGroupRolleIds(rollenart).filter((id: string) => selected.value.includes(id)).length;
  }

  function getGroupTotalCount(rollenart: string): number {
    return getGroupRolleIds(rollenart).length;
  }

  function getGroupSelectionState(rollenart: string): 'all' | 'some' | 'none' {
    const total: number = getGroupTotalCount(rollenart);
    const count: number = getGroupSelectedCount(rollenart);
    if (count === 0) {
      return 'none';
    }
    if (count === total) {
      return 'all';
    }
    return 'some';
  }

  function toggleGroupSelection(rollenart: string): void {
    const ids: string[] = getGroupRolleIds(rollenart);
    const state: 'all' | 'some' | 'none' = getGroupSelectionState(rollenart);
    const current: Set<string> = new Set(selected.value);

    if (state === 'all') {
      ids.forEach((id: string) => current.delete(id));
    } else {
      ids.forEach((id: string) => current.add(id));
    }

    const leafIds: string[] = Array.from(current).filter((id: string) => allRolleIds.value.has(id));
    selected.value = leafIds;
    emit('update:selectedRolleIds', leafIds);
  }

  function onSelectionUpdate(newSelected: unknown): void {
    // v-treeview with select-strategy="leaf" only emits leaf IDs — still guard just in case
    const ids = Array.isArray(newSelected) ? newSelected : [];
    const leafIds: string[] = ids.filter((id: unknown) => typeof id === 'string' && allRolleIds.value.has(id));
    selected.value = leafIds;
    emit('update:selectedRolleIds', leafIds);
  }

  // ── Hidden-selected warning ────────────────────────────────────────────────
  const hasHiddenSelectedRoles: ComputedRef<boolean> = computed(() => {
    if (!searchQuery.value.trim()) {
      return false;
    }
    const visibleIds: Set<string> = new Set(
      treeItems.value.flatMap((g: TreeNode) => g.children?.map((c: TreeNode) => c.id) ?? []),
    );
    return selected.value.some((id: string) => !visibleIds.has(id));
  });
</script>

<template>
  <div class="rollenerweiterung-treeview">
    <!-- Hidden-selected warning -->
    <v-alert
      v-if="hasHiddenSelectedRoles"
      class="mb-3"
      density="compact"
      type="warning"
      variant="tonal"
    >
      {{ t('angebot.rollenerweiterung.hiddenSelectedWarning') }}
    </v-alert>

    <!-- Loading -->
    <div
      v-if="loading"
      class="d-flex justify-center pa-8"
    >
      <v-progress-circular
        color="primary"
        indeterminate
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="treeItems.length === 0"
      class="treeview-empty pa-6 text-center text-medium-emphasis"
    >
      {{ t('angebot.noRolesFound') }}
    </div>

    <!-- Treeview -->
    <v-treeview
      v-else
      v-model:opened="opened"
      class="rollenerweiterung-tree"
      :items="treeItems"
      item-value="id"
      item-title="title"
      item-children="children"
      select-strategy="leaf"
      selected-color="primary"
      :model-value="selected"
      @update:model-value="onSelectionUpdate"
    >
      <template #prepend="{ item }">
        <!-- ── Group header ──────────────────────────────────────────────── -->
        <template v-if="(item as TreeNode).isGroup">
          <div
            class="group-row d-flex align-center w-100"
            :data-testid="`treeview-group-${(item as TreeNode).rollenart}`"
          >
            <!-- Our own checkbox for group-level select/deselect -->
            <v-checkbox-btn
              class="group-checkbox flex-shrink-0"
              :data-testid="`treeview-group-checkbox-${(item as TreeNode).rollenart}`"
              :false-icon="
                getGroupSelectionState((item as TreeNode).rollenart!) === 'none'
                  ? 'mdi-checkbox-blank-outline'
                  : undefined
              "
              :indeterminate="getGroupSelectionState((item as TreeNode).rollenart!) === 'some'"
              :model-value="getGroupSelectionState((item as TreeNode).rollenart!) === 'all'"
              @click.stop="toggleGroupSelection((item as TreeNode).rollenart!)"
            />

            <span class="group-title font-weight-bold">
              {{ item.title }}
            </span>
            <span class="group-count ml-2">
              ({{ getGroupSelectedCount((item as TreeNode).rollenart!) }}
              {{ t('from') }}
              {{ getGroupTotalCount((item as TreeNode).rollenart!) }})
            </span>
          </div>
        </template>

        <!-- ── Leaf (individual rolle) ──────────────────────────────────── -->
        <template v-else>
          <v-checkbox-btn
            color="primary"
            :model-value="selected.includes(item.id)"
            @click.stop="
              onSelectionUpdate(
                selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id],
              )
            "
          />
        </template>
      </template>

      <!-- Append the collapse arrow to the right of the group header -->
      <template #append="{ item, isOpen }">
        <v-icon
          v-if="(item as TreeNode).isGroup"
          class="group-toggle-icon"
          size="20"
        >
          {{ isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
      </template>
    </v-treeview>
  </div>
</template>
