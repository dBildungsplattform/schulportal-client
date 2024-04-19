<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  useI18n({ useScope: 'global' });

  const searchFilter: Ref<string | null> = ref('');

  type Emits = {
    (event: 'onApplySearchFilter', searchFilter: string): void;
  };

  const emit: Emits = defineEmits<{
    (event: 'onApplySearchFilter', searchFilter: string): void;
  }>();

  function applySearchFilter(): void {
    if (searchFilter.value !== null) {
      emit('onApplySearchFilter', searchFilter.value.trim());
    } else {
      emit('onApplySearchFilter', '');
    }
  }
</script>

<template>
  <v-row
    class="pt-4 pr-3"
    justify="end"
  >
    <v-col cols="3">
      <v-text-field
        clearable
        data-testid="searchFilter-input"
        density="compact"
        id="searchFilter-input"
        :placeholder="$t('admin.searchResultTable')"
        required="true"
        variant="outlined"
        v-model="searchFilter"
      ></v-text-field>
    </v-col>
    <v-col cols="2">
      <v-btn
        prepend-icon="mdi-magnify"
        class="primary button"
        data-testid="apply-search-filter-button"
        @click="applySearchFilter()"
      >
        {{ $t('admin.search') }}</v-btn
      >
    </v-col>
  </v-row>
</template>

<style></style>
