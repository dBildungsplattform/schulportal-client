<script setup lang="ts">
  import { onBeforeMount, ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';

  useI18n({ useScope: 'global' });

  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const searchFilter: Ref<string | null> = ref(searchFilterStore.searchFilter);

  type Emits = {
    (event: 'onApplySearchFilter', searchFilter: string): void;
  };

  type Props = {
    hoverText: string;
  };

  const emit: Emits = defineEmits<{
    (event: 'onApplySearchFilter', searchFilter: string): void;
  }>();

  const props: Props = defineProps<Props>();

  defineExpose({
    searchFilter,
  });

  async function applySearchFilter(): Promise<void> {
    if (searchFilter.value !== null) {
      await searchFilterStore.setSearchFilter(searchFilter.value.trim());
      emit('onApplySearchFilter', searchFilter.value.trim());
    } else {
      await searchFilterStore.setSearchFilter(searchFilter.value);
      emit('onApplySearchFilter', '');
    }
  }

  onBeforeMount(() => {
    searchFilter.value = searchFilterStore.searchFilter ?? '';
    applySearchFilter(); // Apply the filter if the searchFilter is not an empty string
  });
</script>

<template>
  <v-col
    cols="6"
    md="3"
  >
    <v-text-field
      autocomplete="off"
      class="search-field"
      clearable
      data-testid="search-filter-input"
      density="compact"
      hide-details
      id="search-filter-input"
      @keyup.enter="applySearchFilter"
      :placeholder="$t('admin.searchResultTable')"
      required="true"
      :title="props.hoverText"
      variant="outlined"
      v-model="searchFilter"
    ></v-text-field>
  </v-col>
  <v-col md="2">
    <v-btn
      block
      class="primary search button"
      @click="applySearchFilter()"
      data-testid="apply-search-filter-button"
      height="44"
      prepend-icon="mdi-magnify"
      width="130"
    >
      {{ $t('search') }}
    </v-btn>
  </v-col>
</template>

<style></style>
