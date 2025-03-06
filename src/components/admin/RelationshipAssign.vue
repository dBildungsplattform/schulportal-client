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
    (event: 'onHandleAssignedItemsSearchFilter', searchFilter: string): void;
    (event: 'onHandleUnassignedItemClick', item: Organisation): void;
    (event: 'onHandleUnassignedItemsSearchFilter', searchFilter: string): void;
  };

  const emit: Emits = defineEmits<Emits>();

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
    <h3 class="subtitle-1 mb-3">{{ unassignedItemsHeader }}</h3>
    <RelationshipAssignList
      :items="unassignedItems"
      :noItemsFoundText="noUnassignedItemsFoundText"
      @onHandleItemClick="handleUnassignedItemClick"
      @onHandleSearchFilter="handleUnassignedItemsSearchFilter"
      ref="itemPoolList"
    >
    </RelationshipAssignList>
  </v-col>
  <v-col
    cols="12"
    md="6"
  >
    <h3 class="subtitle-1 mb-3">{{ assignedItemsHeader }}</h3>
    <RelationshipAssignList
      :items="assignedItems"
      :noItemsFoundText="noUnassignedItemsFoundText"
      @onHandleSearchFilter="handleAssignedItemsSearchFilter"
      ref="assignedItemsList"
    >
    </RelationshipAssignList>
  </v-col>
</template>
