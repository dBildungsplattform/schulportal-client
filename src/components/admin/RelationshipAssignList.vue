<script setup lang="ts">
  import type { Organisation } from '@/stores/OrganisationStore';
  import SearchField from './SearchField.vue';

  type Props = {
    items: Array<Organisation>;
  };

  defineProps<Props>();

  type Emits = {
    (event: 'onHandleItemClick', item: Organisation): void;
    (event: 'onHandleSearchFilter', searchFilter: string): void;
  };

  const emit: Emits = defineEmits<Emits>();

  function handleItemClick(item: Organisation): void {
    emit('onHandleItemClick', item);
  }

  function handleSearchFilter(searchFilter: string): void {
    emit('onHandleSearchFilter', searchFilter.trim());
  }
</script>

<template>
  <v-row>
    <SearchField
      :buttonCols="12"
      :buttonColsMd="4"
      hoverText=""
      initialValue=""
      :inputCols="12"
      :inputColsMd="8"
      @onApplySearchFilter="handleSearchFilter"
      ref="searchFieldComponent"
    ></SearchField>
  </v-row>
  <v-row>
    <v-col>
      <v-card>
        <v-list
          density="compact"
          max-height="344"
          min-height="344"
          rounded="xl"
        >
          <v-list-item
            v-for="item in items"
            @click="handleItemClick(item)"
            :key="item.id"
          >
            <v-chip>{{ item.name }}</v-chip>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>
