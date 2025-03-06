<script setup lang="ts">
  import type { Organisation } from '@/stores/OrganisationStore';
  import RelationshipAssignList from './RelationshipAssignList.vue';

  type Props = {
    unassignedItemsHeader: string;
    assignedItemsHeader: string;
    unassignedItems: Array<Organisation>;
    assignedItems: Array<Organisation>;
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
      @onHandleSearchFilter="handleAssignedItemsSearchFilter"
      ref="assignedItemsList"
    >
    </RelationshipAssignList>
  </v-col>
</template>
