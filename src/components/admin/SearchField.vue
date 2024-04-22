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

  const props: Props = defineProps<Props>()

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
    class="pt-4 px-3"
    justify="end"
  >
    <v-col
      cols="6"
      md="3"
    >
      <v-text-field
        clearable
        data-testid="searchFilter-input"
        density="compact"
        id="searchFilter-input"
        :placeholder="$t('admin.searchResultTable')"
        required="true"
        variant="outlined"
        v-model="searchFilter"
        :title="props.hoverText"
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
        {{ $t('admin.search') }}</v-btn
      >
    </v-col>
  </v-row>
</template>

<style></style>
