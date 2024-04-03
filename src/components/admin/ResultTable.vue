<script setup lang="ts">
  import { computed, type ComputedRef } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';

  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];

  type TableItem = Record<string, unknown>;

  type Props = {
    items: TableItem[];
    loading: boolean;
    totalItems: number;
    headers: ReadonlyHeaders;
    itemValuePath: string;
    disableRowClick?: boolean;
  };
  const props: Props = defineProps<Props>();

  const { t }: Composer = useI18n({ useScope: 'global' });

  // TODO: these two values will come from the API in the future
  const itemsPerPage: number = 25;
  const page: number = 1;

  const pageText: ComputedRef<string> = computed<string>(() => {
    const totalItems: number = props.items.length;
    const firstPageItem: number = (page - 1) * itemsPerPage + 1;
    const lastPageItem: number = Math.min(page * itemsPerPage, totalItems);
    const interval: string = `${firstPageItem} - ${lastPageItem}`;

    return t('pagination.pageText', { interval: interval, total: totalItems });
  });

  type Emits = {
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableItem): void;
    (event: 'onTableUpdate'): void;
  };
  const emit: Emits = defineEmits<{
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableItem): void;
    (event: 'onTableUpdate'): void;
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
    :items-per-page-options="[{ value: -1, title: $t('pagination.all') }]"
    :items-per-page-text="$t('itemsPerPage')"
    :item-value="itemValuePath"
    :page-text="pageText"
    select-strategy="page"
    show-select
    @update:options="$emit('onTableUpdate')"
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
