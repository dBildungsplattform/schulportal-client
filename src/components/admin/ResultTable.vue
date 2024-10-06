<script setup lang="ts">
  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import { onMounted } from 'vue';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];

  // Mutable headers
  type ReadonlyHeadersMutable = VDataTableServer['$props']['headers'];
  type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : never;
  type ReadonlyDataTableHeader = UnwrapReadonlyArray<ReadonlyHeadersMutable>;
  type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };
  type Headers = DeepMutable<ReadonlyDataTableHeader>;

  export type TableItem = Record<string, unknown>;
  export type TableRow<T> = {
    item: T;
  };

  type Props = {
    currentPage?: number;
    disableRowClick?: boolean;
    headers: ReadonlyHeaders | Headers;
    items: TableItem[];
    itemsPerPage: number;
    itemValuePath: string;
    loading: boolean;
    totalItems: number;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'onHandleRowClick', eventPayload: PointerEvent, item: TableRow<unknown>): void;
    (e: 'onTableUpdate', options: { sortField: string | undefined; sortOrder: 'asc' | 'desc' }): void;
    (event: 'onItemsPerPageUpdate', limit: number): void;
    (event: 'onPageUpdate', page: number): void;
  };

  const emit: Emits = defineEmits<Emits>();

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
    groupBy: VDataTableServer['groupBy'];
  }

  function onUpdateOptions(options: UpdateOptions): void {
    const sortItem: SortItem | undefined = options.sortBy[0];
    emit('onTableUpdate', {
      sortField: sortItem?.key,
      sortOrder: sortItem?.order === 'desc' ? 'desc' : 'asc',
    });
  }

  // On Mount we sort the table by first column and asc
  onMounted(() => {
    const headers: Headers[] = props.headers as Headers[];
    const firstHeader: Headers = headers[0] as Headers;

    if (firstHeader.key) {
      emit('onTableUpdate', {
        sortField: firstHeader.key as string,
        sortOrder: 'asc',
      });
    }
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
    :items-per-page-text="$t('itemsPerPage')"
    :item-value="itemValuePath"
    :page="currentPage"
    ref="v-data-table-server"
    select-strategy="page"
    :showCurrentPage="true"
    show-select
    @update:options="onUpdateOptions"
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
