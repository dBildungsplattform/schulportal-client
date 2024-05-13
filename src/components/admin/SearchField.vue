<script setup lang="ts">
  import { onBeforeMount, ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';

  useI18n({ useScope: 'global' });

  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const searchFilter: Ref<string | null> = ref('');

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

  async function applySearchFilter(): Promise<void>  {
    if (searchFilter.value !== null) {
      await searchFilterStore.setFilter(searchFilter.value.trim());
      emit('onApplySearchFilter', searchFilter.value.trim());
    } else {
      await searchFilterStore.setFilter(searchFilter.value);
      emit('onApplySearchFilter', '');
    }
  }

  onBeforeMount(() => {
    searchFilter.value = searchFilterStore.searchFilter ?? '';
     applySearchFilter(); // Apply the filter before the component mounts
  });
</script>

<template>
  <v-row
    class="pt-4 px-3"
    justify="end"
  >
    <v-col
      cols="6"
      md="3"
    >
      <v-text-field
        clearable
        data-testid="search-filter-input"
        density="compact"
        id="search-filter-input"
        :placeholder="$t('admin.searchResultTable')"
        required="true"
        variant="outlined"
        v-model="searchFilter"
        :title="props.hoverText"
        @keyup.enter="applySearchFilter"
      ></v-text-field>
    </v-col>
    <v-col md="2">
      <v-btn
        prepend-icon="mdi-magnify"
        class="primary button"
        data-testid="apply-search-filter-button"
        @click="applySearchFilter()"
        height="45"
        width="130"
      >
        {{ $t('search') }}</v-btn
      >
    </v-col>
  </v-row>
</template>

<style></style>
