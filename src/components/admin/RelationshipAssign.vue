<script setup lang="ts">
  import type { Organisation } from '@/stores/OrganisationStore';
  import RelationshipAssignList from './RelationshipAssignList.vue';

  type Props = {
    assignedItems: Array<Organisation>;
    assignedItemsHeader: string;
    noAssignedItemsFoundText: string;
    noUnassignedItemsFoundText: string;
    unassignedItems: Array<Organisation>;
    unassignedItemsHeader: string;
  };

  defineProps<Props>();

  type Emits = {
    (event: 'onHandleAssignedItemClick', item: Organisation): void;
    (event: 'onHandleAssignedItemsSearchFilter', searchFilter: string): void;
    (event: 'onHandleUnassignedItemClick', item: Organisation): void;
    (event: 'onHandleUnassignedItemsSearchFilter', searchFilter: string): void;
  };

  const emit: Emits = defineEmits<Emits>();

  function handleAssignedItemClick(item: Organisation): void {
    emit('onHandleAssignedItemClick', item);
  }

  function handleAssignedItemsSearchFilter(searchFilter: string): void {
    emit('onHandleAssignedItemsSearchFilter', searchFilter.trim());
  }

  function handleUnassignedItemClick(item: Organisation): void {
    emit('onHandleUnassignedItemClick', item);
  }

  function handleUnassignedItemsSearchFilter(searchFilter: string): void {
    emit('onHandleUnassignedItemsSearchFilter', searchFilter.trim());
  }
</script>

<template>
  <v-col
    cols="12"
    md="6"
  >
    <h3 class="subtitle-1 mb-3">
      {{ unassignedItemsHeader }}
    </h3>
    <RelationshipAssignList
      ref="unassignedItemsList"
      v-slot="{ item }"
      data-test-id="unassigned-items-list"
      :items="unassignedItems"
      :no-items-found-text="noUnassignedItemsFoundText"
      @on-handle-item-click="handleUnassignedItemClick"
      @on-handle-search-filter="handleUnassignedItemsSearchFilter"
    >
      <slot :item="item" />
    </RelationshipAssignList>
  </v-col>
  <v-col
    cols="12"
    md="6"
  >
    <h3 class="subtitle-1 mb-3">
      {{ assignedItemsHeader }}
    </h3>
    <RelationshipAssignList
      ref="assignedItemsList"
      v-slot="{ item }"
      data-test-id="assigned-items-list"
      :items="assignedItems"
      :no-items-found-text="noAssignedItemsFoundText"
      @on-handle-item-click="handleAssignedItemClick"
      @on-handle-search-filter="handleAssignedItemsSearchFilter"
    >
      <slot :item="item" />
    </RelationshipAssignList>
  </v-col>
</template>
