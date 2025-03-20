<script setup lang="ts">
  import { onBeforeMount, ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  useI18n({ useScope: 'global' });

  const searchFilter: Ref<string | null> = ref('');

  type Emits = {
    (event: 'onApplySearchFilter', searchFilter: string): void;
  };

  type Props = {
    hoverText: string;
    initialValue: string;
    inputCols: number;
    inputColsMd: number;
    buttonCols: number;
    buttonColsMd: number;
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
      emit('onApplySearchFilter', searchFilter.value.trim());
    } else {
      emit('onApplySearchFilter', '');
    }
  }

  onBeforeMount(() => {
    searchFilter.value = props.initialValue;
    applySearchFilter(); // Apply the filter if the searchFilter is not an empty string
  });
</script>

<template>
  <v-col
    :cols="inputCols"
    :md="inputColsMd"
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
  <v-col
    :cols="buttonCols"
    :md="buttonColsMd"
  >
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
