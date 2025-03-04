<script setup lang="ts">
  import type { Organisation } from '@/stores/OrganisationStore';
  import RelationshipAssignList from './RelationshipAssignList.vue';

  type Props = {
    itemPoolHeader: string;
    assignedItemsHeader: string;
    itemPool: Array<Organisation>;
    assignedItems: Array<Organisation>;
  };

  defineProps<Props>();
</script>

<template>
  <v-col
    cols="12"
    md="6"
  >
    <h3 class="subtitle-1 mb-3">{{ itemPoolHeader }}</h3>
    <RelationshipAssignList
      :items="itemPool"
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
      ref="assignedItemsList"
    >
    </RelationshipAssignList>
  </v-col>
</template>
