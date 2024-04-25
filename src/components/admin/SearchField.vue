<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  useI18n({ useScope: 'global' });

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

  function applySearchFilter(): void {
    if (searchFilter.value !== null) {
      emit('onApplySearchFilter', searchFilter.value.trim());
    } else {
      emit('onApplySearchFilter', '');
    }
  }
</script>

<template>
  <v-col
    cols="6"
    md="3"
  >
    <v-text-field
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
      height="35"
      prepend-icon="mdi-magnify"
      width="130"
    >
      {{ $t('search') }}
    </v-btn>
  </v-col>
</template>

<style></style>
