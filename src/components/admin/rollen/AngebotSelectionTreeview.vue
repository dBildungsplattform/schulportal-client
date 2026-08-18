<script setup lang="ts">
  import { ServiceProviderKategorie, type ServiceProviderResponse } from '@/api-client/generated';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  type TreeNode = {
    id: string;
    title: string;
    isGroup: boolean;
    kategorie?: ServiceProviderKategorie;
    children?: TreeNode[];
  };

  type CategoryDefinition = {
    kategorie: ServiceProviderKategorie;
    labelKey: string;
  };

  enum SelectionState {
    All = 'all',
    Some = 'some',
    None = 'none',
  }

  export type AngebotForSelection = Pick<ServiceProviderResponse, 'id' | 'name' | 'kategorie'>;

  type Props = {
    availableServiceProviders?: Array<AngebotForSelection>;
    initiallySelectedServiceProviderIds?: Array<string>;
    loading?: boolean;
  };

  type Emits = {
    (event: 'update:selectedServiceProviderIds', ids: Array<string>): void;
  };

  const props: Props = withDefaults(defineProps<Props>(), {
    availableServiceProviders: () => [],
    initiallySelectedServiceProviderIds: () => [],
    loading: false,
  });
  const emit: Emits = defineEmits<Emits>();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const categoryDefinitions: Array<CategoryDefinition> = [
    { kategorie: ServiceProviderKategorie.Email, labelKey: 'angebot.mappingFrontBackEnd.kategorien.EMAIL' },
    { kategorie: ServiceProviderKategorie.Unterricht, labelKey: 'angebot.mappingFrontBackEnd.kategorien.UNTERRICHT' },
    { kategorie: ServiceProviderKategorie.Verwaltung, labelKey: 'angebot.mappingFrontBackEnd.kategorien.VERWALTUNG' },
    { kategorie: ServiceProviderKategorie.Schulisch, labelKey: 'angebot.mappingFrontBackEnd.kategorien.SCHULISCH' },
    { kategorie: ServiceProviderKategorie.Hinweise, labelKey: 'angebot.mappingFrontBackEnd.kategorien.HINWEISE' },
  ];

  const selected: Ref<Array<string>> = ref([...(props.initiallySelectedServiceProviderIds ?? [])]);
  const opened: Ref<Array<string>> = ref(
    categoryDefinitions.map((definition: CategoryDefinition): string => `group-${definition.kategorie}`),
  );

  watch(
    () => props.initiallySelectedServiceProviderIds,
    (ids: Array<string> | undefined): void => {
      selected.value = [...(ids ?? [])];
    },
  );

  const availableServiceProviders: ComputedRef<Array<AngebotForSelection>> = computed(
    (): Array<AngebotForSelection> => props.availableServiceProviders ?? [],
  );

  const availableServiceProviderIds: ComputedRef<Set<string>> = computed(
    (): Set<string> =>
      new Set(availableServiceProviders.value.map((serviceProvider: AngebotForSelection) => serviceProvider.id)),
  );

  const treeItems: ComputedRef<Array<TreeNode>> = computed((): Array<TreeNode> => {
    return categoryDefinitions.flatMap((definition: CategoryDefinition): Array<TreeNode> => {
      const serviceProviders: Array<AngebotForSelection> = availableServiceProviders.value
        .filter((serviceProvider: AngebotForSelection): boolean => serviceProvider.kategorie === definition.kategorie)
        .sort((first: AngebotForSelection, second: AngebotForSelection): number =>
          first.name.localeCompare(second.name),
        );

      if (serviceProviders.length === 0) {
        return [];
      }

      return [
        {
          id: `group-${definition.kategorie}`,
          title: t(definition.labelKey),
          isGroup: true,
          kategorie: definition.kategorie,
          children: serviceProviders.map(
            (serviceProvider: AngebotForSelection): TreeNode => ({
              id: serviceProvider.id,
              title: serviceProvider.name,
              isGroup: false,
            }),
          ),
        },
      ];
    });
  });

  function getServiceProviderIdsForCategory(kategorie: ServiceProviderKategorie | undefined): Array<string> {
    if (!kategorie) {
      return [];
    }
    return availableServiceProviders.value
      .filter((serviceProvider: AngebotForSelection): boolean => serviceProvider.kategorie === kategorie)
      .map((serviceProvider: AngebotForSelection): string => serviceProvider.id);
  }

  function getSelectedCount(kategorie: ServiceProviderKategorie | undefined): number {
    return getServiceProviderIdsForCategory(kategorie).filter((id: string): boolean => selected.value.includes(id))
      .length;
  }

  function getTotalCount(kategorie: ServiceProviderKategorie | undefined): number {
    return getServiceProviderIdsForCategory(kategorie).length;
  }

  function onSelectionUpdate(value: unknown): void {
    const ids: Array<string> = Array.isArray(value)
      ? value.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const leafIds: Array<string> = ids.filter((id: string): boolean => availableServiceProviderIds.value.has(id));
    selected.value = leafIds;
    emit('update:selectedServiceProviderIds', leafIds);
  }

  function getCategorySelectionState(kategorie: ServiceProviderKategorie | undefined): SelectionState {
    const total: number = getTotalCount(kategorie);
    const selectedCount: number = getSelectedCount(kategorie);
    if (selectedCount === 0) {
      return SelectionState.None;
    }
    if (selectedCount === total) {
      return SelectionState.All;
    }
    return SelectionState.Some;
  }

  function toggleCategorySelection(kategorie: ServiceProviderKategorie | undefined): void {
    if (!kategorie) {
      return;
    }
    const categoryIds: Array<string> = getServiceProviderIdsForCategory(kategorie);
    const updatedSelection: Set<string> = new Set(selected.value);
    if (getCategorySelectionState(kategorie) === SelectionState.All) {
      categoryIds.forEach((id: string): boolean => updatedSelection.delete(id));
    } else {
      categoryIds.forEach((id: string): Set<string> => updatedSelection.add(id));
    }
    onSelectionUpdate(Array.from(updatedSelection));
  }

  function toggleServiceProvider(id: string): void {
    onSelectionUpdate(
      selected.value.includes(id)
        ? selected.value.filter((selectedId: string): boolean => selectedId !== id)
        : [...selected.value, id],
    );
  }
</script>

<template>
  <div
    v-if="loading"
    class="d-flex justify-center pa-8"
    data-testid="angebot-selection-tree-loading"
  >
    <v-progress-circular
      color="primary"
      indeterminate
    />
  </div>

  <div
    v-else-if="treeItems.length === 0"
    class="pa-6 text-center text-medium-emphasis"
    data-testid="angebot-selection-tree-empty"
  >
    {{ t('angebot.noServiceProvidersAvailable') }}
  </div>

  <v-treeview
    v-else
    v-model:opened="opened"
    :items="treeItems"
    :model-value="selected"
    class="angebot-selection-tree"
    data-testid="angebot-selection-tree"
    density="compact"
    item-children="children"
    item-title="title"
    item-value="id"
    select-strategy="independent"
    @update:model-value="onSelectionUpdate"
  >
    <template #prepend="{ item }">
      <v-checkbox
        v-if="item.isGroup"
        :data-testid="`angebot-category-checkbox-${item.kategorie}`"
        density="compact"
        hide-details
        :indeterminate="getCategorySelectionState(item.kategorie) === SelectionState.Some"
        :model-value="getCategorySelectionState(item.kategorie) === SelectionState.All"
        @click.stop="toggleCategorySelection(item.kategorie)"
      />
      <v-checkbox
        v-else
        :data-testid="`angebot-checkbox-${item.id}`"
        density="compact"
        hide-details
        :model-value="selected.includes(item.id)"
        @click.stop="toggleServiceProvider(item.id)"
      />
    </template>
    <template #title="{ item }">
      <template v-if="item.isGroup">
        <span class="font-weight-bold angebot-category-title">{{ item.title }}</span>
        <span class="ml-1 font-weight-bold">
          ({{ getSelectedCount(item.kategorie) }} {{ t('from') }} {{ getTotalCount(item.kategorie) }})
        </span>
      </template>
      <span
        v-else
        class="font-weight-bold"
      >
        {{ item.title }}
      </span>
    </template>
  </v-treeview>
</template>

<style scoped lang="scss">
  .angebot-selection-tree {
    max-width: 560px;
  }

  .angebot-selection-tree :deep(.v-list-item) {
    min-height: 42px;
  }

  .angebot-selection-tree :deep(.v-list-item__prepend) {
    align-self: center;
  }
</style>
