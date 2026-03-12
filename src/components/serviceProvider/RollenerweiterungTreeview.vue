<script setup lang="ts">
  import { RollenArt } from '@/stores/RolleStore';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  const { t }: Composer = useI18n({ useScope: 'global' });

  export type RolleForSelection = {
    id: string;
    name: string;
    rollenart: RollenArt;
  };

  type TreeNode = {
    id: string;
    title: string;
    isGroup: boolean;
    rollenart?: RollenArt;
    children?: TreeNode[];
  };

  type RolleSelection = { key: string; rollen: RolleForSelection[] };

  enum StateSelection {
    All = 'all',
    Some = 'some',
    None = 'none',
  }

  type Props = {
    availableRollen: RolleForSelection[];
    initiallySelectedRolleIds?: string[];
    loading?: boolean;
  };

  type Emits = {
    (e: 'update:selectedRolleIds', ids: string[]): void;
  };

  const props: Props = withDefaults(defineProps<Props>(), {
    initiallySelectedRolleIds: () => [],
    loading: false,
  });

  const emit: Emits = defineEmits<Emits>();

  const GROUP_DEFINITIONS: { key: RollenArt; labelKey: string }[] = [
    { key: RollenArt.Lehr, labelKey: 'angebot.groupLehr' },
    { key: RollenArt.Lern, labelKey: 'angebot.groupLern' },
    { key: RollenArt.Leit, labelKey: 'angebot.groupLeit' },
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  const selected: Ref<string[]> = ref([...(props.initiallySelectedRolleIds ?? [])]);
  const opened: Ref<string[]> = ref(['group-LEHR', 'group-LERN', 'group-LEIT']);

  watch(
    () => props.initiallySelectedRolleIds,
    (ids: string[] | undefined) => {
      selected.value = [...(ids ?? [])];
    },
  );

  // ── Tree data ──────────────────────────────────────────────────────────────
  const allRolleIds: ComputedRef<Set<string>> = computed(
    () => new Set(props.availableRollen.map((r: RolleForSelection) => r.id)),
  );

  const fullGroups: ComputedRef<RolleSelection[]> = computed(() =>
    GROUP_DEFINITIONS.map((def: { key: RollenArt; labelKey: string }) => ({
      key: def.key,
      rollen: props.availableRollen.filter((r: RolleForSelection) => r.rollenart === def.key),
    })).filter((g: RolleSelection) => g.rollen.length > 0),
  );

  const treeItems: ComputedRef<TreeNode[]> = computed(() => {
    return GROUP_DEFINITIONS.flatMap((def: { key: RollenArt; labelKey: string }) => {
      const allChildren: RolleForSelection[] = props.availableRollen
        .filter((r: RolleForSelection) => r.rollenart === def.key)
        .sort((a: RolleForSelection, b: RolleForSelection) => a.name.localeCompare(b.name));

      if (allChildren.length === 0) {
        return [];
      }

      const filteredChildren: RolleForSelection[] = allChildren;

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
    const group: RolleSelection | undefined = fullGroups.value.find((g: RolleSelection) => g.key === rollenart);
    return group?.rollen.map((r: RolleForSelection) => r.id) ?? [];
  }

  function getGroupSelectedCount(rollenart: string): number {
    return getGroupRolleIds(rollenart).filter((id: string) => selected.value.includes(id)).length;
  }

  function getGroupTotalCount(rollenart: string): number {
    return getGroupRolleIds(rollenart).length;
  }

  function getGroupSelectionState(rollenart: string): StateSelection {
    const total: number = getGroupTotalCount(rollenart);
    const count: number = getGroupSelectedCount(rollenart);
    if (count === 0) {
      return StateSelection.None;
    }
    if (count === total) {
      return StateSelection.All;
    }
    return StateSelection.Some;
  }

  function toggleGroupSelection(rollenart: string): void {
    const ids: string[] = getGroupRolleIds(rollenart);
    const state: StateSelection = getGroupSelectionState(rollenart);
    const current: Set<string> = new Set(selected.value);

    if (state === StateSelection.All) {
      ids.forEach((id: string) => current.delete(id));
    } else {
      ids.forEach((id: string) => current.add(id));
    }

    const leafIds: string[] = Array.from(current).filter((id: string) => allRolleIds.value.has(id));
    selected.value = leafIds;
    emit('update:selectedRolleIds', leafIds);
  }

  function onSelectionUpdate(val: unknown): void {
    // v-treeview with select-strategy="leaf" only emits leaf IDs — still guard just in case
    const ids: string[] = Array.isArray(val) ? val.filter((id: unknown): id is string => typeof id === 'string') : [];
    const leafIds: string[] = ids.filter((id: string) => allRolleIds.value.has(id));
    selected.value = leafIds;
    emit('update:selectedRolleIds', leafIds);
  }
</script>

<template>
  <div>
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
      data-testId="rollenerweiterung-tree"
      :items="treeItems"
      item-value="id"
      item-title="title"
      item-children="children"
      select-strategy="independent"
      density="compact"
      :model-value="selected"
      @update:model-value="onSelectionUpdate"
    >
      <!-- Suppress default title for group nodes (title is rendered in #prepend) -->
      <template #title="{ item }">
        <template v-if="!(item as TreeNode).isGroup">
          {{ item.title }}
        </template>
      </template>
      <template #prepend="{ item }">
        <!-- ── Group header ──────────────────────────────────────────────── -->
        <template v-if="(item as TreeNode).isGroup">
          <div
            class="group-row d-flex align-center w-100 flex-wrap"
            :data-testid="`treeview-group-${(item as TreeNode).rollenart}`"
            @click="toggleGroupSelection((item as TreeNode).rollenart!)"
          >
            <!-- Our own checkbox for group-level select/deselect -->
            <v-checkbox
              class="flex-shrink-0"
              :data-testid="`treeview-group-checkbox-${(item as TreeNode).rollenart}`"
              :false-icon="
                getGroupSelectionState((item as TreeNode).rollenart!) === StateSelection.None
                  ? 'mdi-checkbox-blank-outline'
                  : undefined
              "
              :indeterminate="getGroupSelectionState((item as TreeNode).rollenart!) === StateSelection.Some"
              :model-value="getGroupSelectionState((item as TreeNode).rollenart!) === StateSelection.All"
              @click.stop="toggleGroupSelection((item as TreeNode).rollenart!)"
            />

            <span class="group-title font-weight-bold text-body">
              {{ item.title }}
            </span>
            <span class="ml-2 text-body">
              ({{ getGroupSelectedCount((item as TreeNode).rollenart!) }}
              {{ t('from') }}
              {{ getGroupTotalCount((item as TreeNode).rollenart!) }})
            </span>
          </div>
        </template>

        <!-- ── Leaf (individual rolle) ──────────────────────────────────── -->
        <template v-else>
          <v-checkbox
            :model-value="selected.includes(item.id)"
            @click.stop="
              onSelectionUpdate(
                selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id],
              )
            "
          />
        </template>
      </template>
    </v-treeview>
  </div>
</template>
