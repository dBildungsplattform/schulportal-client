<script setup lang="ts">
  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];

  type TableItem = Record<string, unknown>;

  type Props = {
    items: TableItem[];
    itemsPerPage: number;
    loading: boolean;
    totalItems: number;
    headers: ReadonlyHeaders;
    itemValuePath: string;
    disableRowClick?: boolean;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableItem): void;
    (event: 'onTableUpdate'): void;
    (event: 'onItemsPerPageUpdate', limit: number): void;
    (event: 'onPageUpdate', page: number): void;
  };
  const emit: Emits = defineEmits<{
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableItem): void;
    (event: 'onTableUpdate'): void;
    (event: 'onItemsPerPageUpdate', limit: number): void;
    (event: 'onPageUpdate', page: number): void;
  }>();

  function handleRowClick(event: PointerEvent, item: TableItem): void {
    if (!props.disableRowClick) {
      emit('onHandleRowClick', event, item);
    }
  }

  interface Slots {
    default: (props: { default: string }) => string;
    top: (props: { top: number }) => string;
    bottom: (props: { bottom: boolean }) => string;
  }
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
    :items-per-page-text="$t('itemsPerPage')"
    :item-value="itemValuePath"
    select-strategy="page"
    show-select
    @update:options="$emit('onTableUpdate')"
    @update:page="(page: number) => $emit('onPageUpdate', page)"
    @update:itemsPerPage="(limit: number) => $emit('onItemsPerPageUpdate', limit)"
    :no-data-text="$t('noDataFound')"
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
