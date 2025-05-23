<script setup lang="ts">
  import type { RollenSystemRecht } from '@/api-client/generated/api';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type AutoCompleteStore,
    type Organisation,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import type { TranslatedObject } from '@/types';
  import { dedup, sameContent } from '@/utils/arrays';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, onMounted, onUnmounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  type SelectedKlassenIds = Array<string> | string | undefined;
  type Props = {
    hideDetails?: boolean;
    systemrechteForSearch?: Array<RollenSystemRecht>;
    multiple: boolean;
    readonly?: boolean;
    selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    highlightSelection?: boolean;
    placeholderText?: string;
    administriertVon?: string[] | undefined;
    storeKey?: string;
  };
  const props: Props = defineProps<Props>();
  const selectedKlassen: Ref<SelectedKlassenIds> = defineModel('selectedKlassen');
  const searchInputKlassen: Ref<string | undefined> = ref(undefined);
  const clearInput = (): void => {
    searchInputKlassen.value = undefined;
    selectedKlassen.value = undefined;
  };

  const { t }: Composer = useI18n({ useScope: 'global' });
  const organisationStore: OrganisationStore = useOrganisationStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const testId: ComputedRef<string> = computed(() => {
    return props.storeKey ? `${props.storeKey}-klasse-select` : 'klasse-select';
  });
  const storeReference: ComputedRef<AutoCompleteStore<Organisation> | undefined> = computed(() => {
    return organisationStore.klassenFilters.get(props.storeKey ?? '');
  });

  const klassenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Klasse,
    systemrechte: props.systemrechteForSearch,
    searchString: undefined,
    limit: 200,
    organisationIds: [],
    administriertVon: props.administriertVon,
  });

  const translateKlasse = (klasse: Organisation): TranslatedObject => ({
    value: klasse.id,
    title: klasse.name,
  });
  const translatedKlassen: ComputedRef<Array<TranslatedObject>> = computed(() => {
    const options: Array<TranslatedObject> = storeReference.value?.filterResult.map(translateKlasse) ?? [];
    return options;
  });

  // selection is represented as an array internally
  // wrap/unwrap is used to convert between internal and vuetify representation
  const wrapSelectedKlassenIds = (selectedIds: SelectedKlassenIds): Array<string> => {
    if (Array.isArray(selectedIds)) return selectedIds.filter(Boolean);
    if (selectedIds) return [selectedIds];
    return [];
  };

  const canDisplaySelection = (selection: SelectedKlassenIds): boolean => {
    const result: boolean = wrapSelectedKlassenIds(selection).every((selectedKlasseId: string) =>
      Boolean(
        // translatedKlassen should include autoSelection if needed, so no extra logic is needed here
        translatedKlassen.value.find(
          (translatedKlasse: TranslatedObject) => translatedKlasse.value === selectedKlasseId,
        ),
      ),
    );
    return result;
  };

  const isEmptySelection = (selection: SelectedKlassenIds): boolean => {
    if (!selection) return true;
    return wrapSelectedKlassenIds(selection).filter(Boolean).length === 0;
  };
  const shouldHighlightSelection: ComputedRef<boolean> = computed(() => {
    if (props.highlightSelection && !isEmptySelection(selectedKlassen.value)) return true;
    return false;
  });

  const isDisplayName = (name: string): boolean => {
    return translatedKlassen.value.find((klasse: TranslatedObject) => klasse.title === name) !== undefined;
  };

  const updateSearchString = (searchString: string | undefined): void => {
    if (searchString && !isDisplayName(searchString)) {
      klassenFilter.searchString = searchString;
    } else {
      delete klassenFilter.searchString;
    }
  };

  const updateKlassenIds = (ids: SelectedKlassenIds): void => {
    const tempIds: Array<string> = wrapSelectedKlassenIds(ids);
    klassenFilter.organisationIds = dedup(tempIds.filter(Boolean));
  };

  const handleSelectionUpdate = (selection: SelectedKlassenIds): void => {
    if (isEmptySelection(selection)) {
      updateKlassenIds([]);
      updateSearchString(undefined);
      clearInput();
    } else {
      updateKlassenIds(selection);
    }
  };

  const isSameSelection = (a: SelectedKlassenIds, b: SelectedKlassenIds): boolean => {
    return sameContent(wrapSelectedKlassenIds(a), wrapSelectedKlassenIds(b));
  };

  watch(
    selectedKlassen,
    (currentSelection: SelectedKlassenIds, oldSelection: SelectedKlassenIds) => {
      // Case 1: Selection has changed - update parent directly
      if (!isSameSelection(currentSelection, oldSelection)) {
        handleSelectionUpdate(currentSelection);
        return;
      }

      // Case 2: Empty selection - use autoselected or initial values
      if (isEmptySelection(currentSelection) && !isSameSelection(selectedKlassen.value, [])) {
        selectedKlassen.value = [];
        handleSelectionUpdate([]);
      }
    },
    { immediate: true },
  );

  watch(
    klassenFilter,
    async (newFilter: OrganisationenFilter | undefined, oldFilter: OrganisationenFilter | undefined) => {
      if (timerId.value) clearTimeout(timerId.value);

      // We skip if selection is disabled and we already know how to display the selection
      // empty selection means we have to reload anyways
      if (!isEmptySelection(selectedKlassen.value) && props.readonly && canDisplaySelection(selectedKlassen.value))
        return;

      // We apply the debounce of 500 only when there is an oldFilter (a change has been made)
      const delay: number = oldFilter ? 500 : 0;

      timerId.value = setTimeout(async () => {
        await organisationStore.loadKlassenForFilter(newFilter, props.storeKey);
      }, delay);
    },
    { immediate: true },
  );

  watch(
    () => props.administriertVon,
    (newValue: string[] | undefined) => {
      klassenFilter.administriertVon = newValue;
    },
  );

  onMounted(() => {
    if (organisationStore.klassenFilters.has(props.storeKey ?? '')) {
      // eslint-disable-next-line no-console
      console.warn(`KlassenFilter initialized twice with id ${props.storeKey}`);
    }
    organisationStore.resetKlasseFilter(props.storeKey);
  });

  onUnmounted(() => {
    organisationStore.clearKlasseFilter(props.storeKey);
  });
</script>

<template>
  <v-autocomplete
    autocomplete="off"
    :class="['filter-dropdown', { selected: shouldHighlightSelection }]"
    clearable
    :data-testid="testId"
    density="compact"
    :disabled="props.readonly"
    :id="testId"
    :ref="testId"
    :items="translatedKlassen"
    item-value="value"
    item-text="title"
    :loading="storeReference?.loading"
    :multiple="props.multiple"
    :no-data-text="'noDataFound'"
    :placeholder="props.placeholderText ?? t('admin.klasse.assignKlasse')"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="organisationStore.resetKlasseFilter(storeKey)"
    v-bind="selectedKlasseProps"
    v-model="selectedKlassen"
    v-model:search="searchInputKlassen"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
    <template v-slot:selection="{ item, index }">
      <template v-if="props.multiple">
        <span
          v-if="selectedKlassen && selectedKlassen.length < 2"
          class="v-autocomplete__selection-text"
        >
          {{ item.title }}
        </span>
        <span v-else-if="selectedKlassen && index === 0">
          {{ t('admin.klasse.klassenSelected', { count: selectedKlassen.length }) }}
        </span>
      </template>
      <template v-else>
        <span class="v-autocomplete__selection-text">
          {{ item.title }}
        </span>
      </template>
    </template>
  </v-autocomplete>
</template>
