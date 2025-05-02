<script setup lang="ts">
  import type { RollenSystemRecht } from '@/api-client/generated/api';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import type { TranslatedObject } from '@/types';
  import { dedup, sameContent } from '@/utils/arrays';
  import { getDisplayNameForOrg } from '@/utils/formatting';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
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
  const klassenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Klasse,
    systemrechte: props.systemrechteForSearch,
    searchString: undefined,
    limit: 25,
    organisationIds: [],
    administriertVon: props.administriertVon,
  });

  const translateKlasse = (klasse: Organisation): TranslatedObject => ({
    value: klasse.id,
    title: getDisplayNameForOrg(klasse),
  });
  const translatedKlassen: ComputedRef<Array<TranslatedObject>> = computed(() => {
    const options: Array<TranslatedObject> = organisationStore.klassenFilter.filterResult.map(translateKlasse);
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

  const updateOrganisationenIds = (ids: SelectedKlassenIds): void => {
    const tempIds: Array<string> = wrapSelectedKlassenIds(ids);
    klassenFilter.organisationIds = dedup(tempIds.filter(Boolean));
  };

  const handleSelectionUpdate = (selection: SelectedKlassenIds): void => {
    if (isEmptySelection(selection)) {
      updateOrganisationenIds([]);
      updateSearchString(undefined);
      clearInput();
    } else {
      updateOrganisationenIds(selection);
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
        await organisationStore.loadKlassenForFilter(newFilter);
      }, delay);
    },
    { immediate: true },
  );

  watch(
    () => props.administriertVon,
    (newValue: string[] | undefined, oldValue: string[] | undefined) => {
      if (
        (newValue == undefined && oldValue === undefined) ||
        (newValue !== undefined && oldValue !== undefined && sameContent(newValue, oldValue))
      ) {
        return;
      }
      klassenFilter.administriertVon = props.administriertVon;
      selectedKlassen.value = undefined;
    },
  );
</script>

<template>
  <v-autocomplete
    autocomplete="off"
    :class="['filter-dropdown', { selected: shouldHighlightSelection }]"
    clearable
    data-testid="klasse-select"
    density="compact"
    :disabled="props.readonly"
    id="klasse-select"
    ref="klasse-select"
    :items="translatedKlassen"
    item-value="value"
    item-text="title"
    :loading="organisationStore.klassenFilter.loading"
    :multiple="props.multiple"
    :no-data-text="'noDataFound'"
    :placeholder="props.placeholderText ?? t('admin.klasse.assignKlasse')"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="organisationStore.resetKlasseFilter"
    v-bind="selectedKlasseProps"
    v-model="selectedKlassen"
    v-model:search="searchInputKlassen"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
  </v-autocomplete>
</template>
