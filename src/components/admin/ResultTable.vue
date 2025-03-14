<script setup lang="ts">
  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import { SortOrder } from '@/stores/PersonStore';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  type Headers = VDataTableServer['headers'];

  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  export type TableItem = Record<string, unknown>;

  export type TableRow<T> = {
    item: T;
  };

  const selectedItems: Ref<TableItem[]> = ref<TableItem[]>([]);

  type Props = {
    currentPage?: number;
    disableRowClick?: boolean;
    headers: Headers;
    items: TableItem[];
    itemsPerPage: number;
    itemValuePath: string;
    loading: boolean;
    totalItems: number;
    currentSort?: { key: string; order: 'asc' | 'desc' } | null;
    // This prop is necessary so the parent component can decide which items should be de-selected after the filters have been used.
    modelValue?: TableItem[];
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableRow<unknown>): void;
    (event: 'onTableUpdate', options: { sortField: string | undefined; sortOrder: 'asc' | 'desc' }): void;
    (event: 'onItemsPerPageUpdate', limit: number): void;
    (event: 'onPageUpdate', page: number): void;
    (event: 'update:selectedRows', selectedRows: TableItem[]): void;
  };

  const emit: Emits = defineEmits<Emits>();

  const resetSelection = (): void => {
    selectedItems.value = [];
  };

  defineExpose({
    resetSelection,
  });

  function handleKeyDown(event: KeyboardEvent): void {
    // Check if the pressed key is Enter
    if (event.key === 'Enter') {
      const target: HTMLElement = event.target as HTMLElement;

      // Check if the target or its closest parent is a header checkbox, if so then we shouldn't trigger anything when "Enter" is pressed as it's not a table row.
      const isHeaderCheckbox: boolean =
        target.closest('thead')?.querySelector('input[type="checkbox"]') === target ||
        target.querySelector('input[type="checkbox"]') !== null;

      // If it's a header checkbox, do nothing
      if (isHeaderCheckbox) {
        return;
      }

      const row: HTMLTableRowElement | null = target.closest('tr');

      if (row) {
        // Find the corresponding item for this row.
        const rowIndex: number = Array.from(row.parentElement!.children).indexOf(row);
        const item: TableItem | undefined = props.items[rowIndex];

        if (item) {
          // Prevent default Enter key behavior
          event.preventDefault();

          // Emit the same event as handleRowClick
          emit('onHandleRowClick', event as unknown as PointerEvent, { item });
        }
      }
    }
  }

  function handleRowClick(event: PointerEvent, item: TableRow<unknown>): void {
    if (!props.disableRowClick) {
      emit('onHandleRowClick', event, item);
    }
  }

  interface Slots {
    default: (props: { default: string }) => string;
    top: (props: { top: number }) => string;
    bottom: (props: { bottom: boolean }) => string;
  }

  type SortItem = {
    key: string;
    order?: boolean | 'asc' | 'desc';
  };

  type UpdateOptions = {
    sortBy: VDataTableServer['sortBy'];
  };

  // This takes the table options as a parameter (the options include the sorting informations) and send an event to the parent to apply the sorting.
  function onUpdateOptions(options: UpdateOptions): void {
    if (options.sortBy.length > 0) {
      const sortItem: SortItem | undefined = options.sortBy[0];
      if (sortItem?.key !== props.currentSort?.key || sortItem?.order !== props.currentSort?.order) {
        emit('onTableUpdate', {
          sortField: sortItem?.key,
          sortOrder: sortItem?.order === SortOrder.Desc ? SortOrder.Desc : SortOrder.Asc,
        });
      }
    }
  }

  // Emits an event with the selected Rows. (Could emit the ID here but its better to emit the whole row in case we need this method for other features)
  function emitSelectedRows(): void {
    const selectedRows: TableItem[] = selectedItems.value;
    emit('update:selectedRows', selectedRows);
  }

  // Update the selectedItems dependings on what the table shows currently.
  watch(
    () => props.modelValue,
    (newValue: TableItem[] | undefined) => {
      selectedItems.value = newValue || [];
    },
    { immediate: true },
  );

  // On Mount we emit an event to the parent to sort the table by first column and ASC.
  onMounted(() => {
    // If the sortField in the store has a value then we don't trigger this logic. This logic should only be triggered when the table was first opened without any changes to sorting.
    if (searchFilterStore.sortField === '') {
      if (props.headers && props.headers[0]?.key) {
        emit('onTableUpdate', {
          sortField: props.headers[0]?.key,
          sortOrder: SortOrder.Asc,
        });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<template>
  <v-data-table-server
    class="result-table"
    @click:row="handleRowClick"
    data-testid="result-table"
    density="compact"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    :items-per-page="itemsPerPage"
    :items-per-page-options="[30, 50, 100, 300]"
    :items-per-page-text="'itemsPerPage'"
    :item-value="itemValuePath"
    :page="currentPage"
    ref="v-data-table-server"
    select-strategy="page"
    :showCurrentPage="true"
    show-select
    :sort-by="currentSort ? [currentSort] : []"
    v-model="selectedItems"
    @update:options="onUpdateOptions"
    @update:page="(page: number) => $emit('onPageUpdate', page)"
    @update:itemsPerPage="(limit: number) => $emit('onItemsPerPageUpdate', limit)"
    @update:modelValue="emitSelectedRows"
    :no-data-text="'noDataFound'"
  >
    <template
      v-for="(_, name) in $slots as unknown as Readonly<Slots>"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>
  </v-data-table-server>
</template>

<style></style>
