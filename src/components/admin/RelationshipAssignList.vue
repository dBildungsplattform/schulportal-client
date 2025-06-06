<script setup lang="ts">
  import type { Organisation } from '@/stores/OrganisationStore';
  import SearchField from './SearchField.vue';

  type Props = {
    dataTestId: string;
    items: Array<Organisation>;
    noItemsFoundText: string;
  };

  const props: Props = defineProps<Props>();

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

  // Move focus to the next chip when a chip is selected
  function focusNextChip(currentIndex: number): void {
    const chips: NodeListOf<Element> = document.querySelectorAll(
      `[data-testid="${props.dataTestId}"] [data-testid^="assign-list-item-"]`,
    );
    if (currentIndex + 1 < chips.length) {
      // Move focus to the next chip
      (chips[currentIndex + 1] as HTMLElement).focus();
    }

    if (currentIndex + 1 === chips.length && chips.length > 1) {
      // Move focus to the previous chip
      (chips[currentIndex - 1] as HTMLElement).focus();
    }
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
      <v-card
        max-height="344"
        min-height="344"
      >
        <v-list
          v-if="items.length > 0"
          :data-testid="dataTestId"
          density="compact"
          max-height="344"
          min-height="344"
          rounded="xl"
        >
          <v-list-item
            v-for="(item, index) in items"
            @click="handleItemClick(item)"
            @keydown.enter.prevent="focusNextChip(index)"
            @keydown.space.prevent="focusNextChip(index)"
            :key="item.id"
            :data-testid="`assign-list-item-${item.id}`"
            tabindex="0"
          >
            <v-chip><slot :item="item"></slot></v-chip>
          </v-list-item>
        </v-list>
        <div v-else>
          <p class="body-2 ma-16 text-center">{{ noItemsFoundText }}</p>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>
