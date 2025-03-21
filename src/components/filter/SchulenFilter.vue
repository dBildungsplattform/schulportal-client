<script setup lang="ts">
  import type { RollenSystemRecht } from '@/api-client/generated/api';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
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

  type SelectedSchulenIds = Array<string> | string | undefined;
  type Props = {
    hideDetails?: boolean;
    systemrechteForSearch?: Array<RollenSystemRecht>;
    multiple: boolean;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    highlightSelection?: boolean;
    placeholderText?: string;
  };
  const props: Props = defineProps<Props>();
  const selectedSchulen: Ref<SelectedSchulenIds> = defineModel('selectedSchulen');
  const searchInputSchulen: Ref<string | undefined> = ref(undefined);
  const clearInput = (): void => {
    searchInputSchulen.value = undefined;
    selectedSchulen.value = undefined;
  };

  const { t }: Composer = useI18n({ useScope: 'global' });
  const organisationStore: OrganisationStore = useOrganisationStore();
  // clear selection before anything else runs
  organisationStore.schulenFilter.selectedItems = [];

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const schulenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Schule,
    systemrechte: props.systemrechteForSearch,
    limit: 25,
    organisationIds: [],
  });

  const { hasAutoselectedSchule, autoselectedSchule }: ReturnType<typeof useAutoselectedSchule> = useAutoselectedSchule(
    props.systemrechteForSearch ?? [],
  );
  const isInputDisabled: ComputedRef<boolean> = computed(() => {
    return props.readonly || hasAutoselectedSchule.value;
  });
  const translateSchule = (schule: Organisation): TranslatedObject => ({
    value: schule.id,
    title: getDisplayNameForOrg(schule),
  });
  const translatedSchulen: ComputedRef<Array<TranslatedObject>> = computed(() => {
    const options: Array<TranslatedObject> = organisationStore.schulenFilter.filterResult.map(translateSchule);
    if (autoselectedSchule.value) return options.concat(translateSchule(autoselectedSchule.value));
    return options;
  });

  // selection is represented as an array internally
  // wrap/unwrap is used to convert between internal and vuetify representation
  const wrapSelectedSchulenIds = (selectedIds: SelectedSchulenIds): Array<string> => {
    if (Array.isArray(selectedIds)) return selectedIds.filter(Boolean);
    if (selectedIds) return [selectedIds];
    return [];
  };
  const unwrapSelectedSchulenIds = (selectedIds: Array<string>): SelectedSchulenIds => {
    if (selectedIds.length === 0) return undefined;
    else if (selectedIds.length === 1) return selectedIds.at(0);
    else return selectedIds;
  };

  const canDisplaySelection = (selection: SelectedSchulenIds): boolean => {
    const result: boolean = wrapSelectedSchulenIds(selection).every((selectedSchuleId: string) =>
      Boolean(
        // translatedSchulen should include autoSelection if needed, so no extra logic is needed here
        translatedSchulen.value.find(
          (translatedSchule: TranslatedObject) => translatedSchule.value === selectedSchuleId,
        ),
      ),
    );
    return result;
  };

  const isEmptySelection = (selection: SelectedSchulenIds): boolean => {
    if (!selection) return true;
    return wrapSelectedSchulenIds(selection).filter(Boolean).length === 0;
  };
  const shouldHighlightSelection: ComputedRef<boolean> = computed(() => {
    if (hasAutoselectedSchule.value) return true;
    if (props.highlightSelection && !isEmptySelection(selectedSchulen.value)) return true;
    return false;
  });

  const updateSearchString = (searchString: string | undefined): void => {
    if (searchString) {
      schulenFilter.searchString = searchString;
    } else {
      delete schulenFilter.searchString;
    }
  };

  const getDefaultIds = (): Array<string> => {
    if (hasAutoselectedSchule.value) {
      return wrapSelectedSchulenIds(autoselectedSchule.value?.id);
    }
    return [];
  };

  const updateOrganisationenIds = (ids: SelectedSchulenIds): void => {
    const tempIds: Array<string> = getDefaultIds().concat(wrapSelectedSchulenIds(ids));
    schulenFilter.organisationIds = dedup(tempIds.filter(Boolean));
  };

  const findSchulenInResultByIds = (ids: Array<string>): Array<Organisation> => {
    return organisationStore.schulenFilter.filterResult.filter((schule: Organisation) => ids.includes(schule.id));
  };

  const mirrorSelectionToStore = (selection: SelectedSchulenIds): void => {
    let ids: Array<string> = wrapSelectedSchulenIds(selection);
    let newSelection: Array<Organisation> = [];
    if (autoselectedSchule.value && ids.includes(autoselectedSchule.value.id)) {
      newSelection.push(autoselectedSchule.value);
    } else {
      newSelection = findSchulenInResultByIds(ids);
    }
    organisationStore.schulenFilter.selectedItems = newSelection;
  };

  const handleSelectionUpdate = (selection: SelectedSchulenIds): void => {
    if (isEmptySelection(selection)) {
      updateOrganisationenIds([]);
      updateSearchString(undefined);
      clearInput();
    } else {
      updateOrganisationenIds(selection);
    }
    mirrorSelectionToStore(selection);
  };

  const isSameSelection = (a: SelectedSchulenIds, b: SelectedSchulenIds): boolean => {
    return sameContent(wrapSelectedSchulenIds(a), wrapSelectedSchulenIds(b));
  };

  type SelectionChange = [SelectedSchulenIds, boolean];
  type PreviousSelectionChange = [SelectedSchulenIds, boolean | undefined];

  watch(
    [selectedSchulen, hasAutoselectedSchule],
    ([currentSelection, currentlyHasAutoselectedSchule]: SelectionChange, [oldSelection]: PreviousSelectionChange) => {
      // Case 1: Selection has changed - update parent directly
      if (!isSameSelection(currentSelection, oldSelection)) {
        handleSelectionUpdate(currentSelection);
        return;
      }

      // Case 2: Empty selection - use autoselected or initial values
      if (isEmptySelection(currentSelection)) {
        const newIds: SelectedSchulenIds =
          currentlyHasAutoselectedSchule && autoselectedSchule.value
            ? unwrapSelectedSchulenIds([autoselectedSchule.value.id])
            : [];

        if (!isSameSelection(selectedSchulen.value, newIds)) {
          selectedSchulen.value = newIds;
          handleSelectionUpdate(newIds);
        }
      }
    },
    { immediate: true },
  );

  watch(
    schulenFilter,
    async (newFilter: OrganisationenFilter | undefined, oldFilter: OrganisationenFilter | undefined) => {
      if (timerId.value) clearTimeout(timerId.value);

      // We skip if selection is disabled and we already know how to display the selection
      // empty selection means we have to reload anyways
      if (
        !isEmptySelection(selectedSchulen.value) &&
        isInputDisabled.value &&
        canDisplaySelection(selectedSchulen.value)
      )
        return;

      // We apply the debounce of 500 only when there is an oldFilter (a change has been made)
      const delay: number = oldFilter ? 500 : 0;

      timerId.value = setTimeout(async () => {
        await organisationStore.loadSchulenForFilter(newFilter);
      }, delay);
    },
    { immediate: true },
  );
</script>

<template>
  <v-autocomplete
    autocomplete="off"
    :class="['filter-dropdown', { selected: shouldHighlightSelection }]"
    clearable
    data-testid="schule-select"
    density="compact"
    :disabled="isInputDisabled"
    id="schule-select"
    ref="schule-select"
    :items="translatedSchulen"
    item-value="value"
    item-text="title"
    :loading="organisationStore.schulenFilter.loading"
    :multiple="props.multiple"
    :no-data-text="'noDataFound'"
    :placeholder="props.placeholderText ?? t('admin.schule.assignSchule')"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="organisationStore.resetSchulFilter"
    v-bind="selectedSchuleProps"
    v-model="selectedSchulen"
    v-model:search="searchInputSchulen"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
  </v-autocomplete>
</template>
