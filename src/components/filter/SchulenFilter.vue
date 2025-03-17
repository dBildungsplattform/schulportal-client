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

  const { t }: Composer = useI18n({ useScope: 'global' });

  type SelectedSchulenIds = Array<string> | string | undefined;
  type Props = {
    includeTraeger?: boolean;
    hideDetails?: boolean;
    systemrechteForSearch?: Array<RollenSystemRecht>;
    multiple: boolean;
    readonly?: boolean;
    initialIds?: Array<string> | string;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    texts?: {
      noData?: string;
      placeholder?: string;
    };
  };
  const props: Props = defineProps<Props>();

  const organisationStore: OrganisationStore = useOrganisationStore();
  // clear selection before anything else runs
  organisationStore.schulenFilter.selectedItems = [];

  const selectedSchulenIds: Ref<SelectedSchulenIds> = ref(props.initialIds ?? []);
  const searchInputSchulen: Ref<string | undefined> = ref(undefined);
  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const schulenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Schule,
    systemrechte: props.systemrechteForSearch,
    limit: 25,
    organisationIds: [],
  });

  const clearInput = (): void => {
    searchInputSchulen.value = undefined;
    selectedSchulenIds.value = undefined;
  };

  defineExpose({ clearInput });

  const { hasAutoselectedSchule, autoselectedSchule, currentUserSchulen }: ReturnType<typeof useAutoselectedSchule> =
    useAutoselectedSchule(props.systemrechteForSearch ?? []);
  const translatedSchulen: ComputedRef<Array<TranslatedObject>> = computed(() =>
    organisationStore.schulenFilter.filterResult.map((schule: Organisation) => ({
      value: schule.id,
      title: getDisplayNameForOrg(schule),
    })),
  );

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

  const isEmptySelection = (selection: SelectedSchulenIds): boolean => {
    if (!selection) return true;
    return wrapSelectedSchulenIds(selection).filter(Boolean).length === 0;
  };
  const hasSelectedSchule: ComputedRef<boolean> = computed(
    () => hasAutoselectedSchule.value || !isEmptySelection(selectedSchulenIds.value),
  );

  const updateSearchString = (searchString: string | undefined): void => {
    if (searchString) {
      schulenFilter.searchString = searchString;
    } else {
      delete schulenFilter.searchString;
    }
  };

  const getDefaultIds = (): Array<string> => {
    if (props.initialIds) {
      return wrapSelectedSchulenIds(props.initialIds);
    } else if (hasAutoselectedSchule.value) {
      return currentUserSchulen.value.map((schule: Organisation) => schule.id);
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

  type SelectionChange = [SelectedSchulenIds, SelectedSchulenIds, boolean];
  type PreviousSelectionChange = [SelectedSchulenIds, Array<string> | undefined, boolean | undefined];

  watch(
    [selectedSchulenIds, (): Array<string> => wrapSelectedSchulenIds(props.initialIds), hasAutoselectedSchule],
    (
      [currentSelection, currentInitialIds, currentlyHasAutoselectedSchule]: SelectionChange,
      [oldSelection, oldInitialIds]: PreviousSelectionChange,
    ) => {
      // Case 1: Selection has changed - update parent directly
      if (!isSameSelection(currentSelection, oldSelection)) {
        handleSelectionUpdate(currentSelection);
        return;
      }

      // Case 2: Props changed - update selection and store
      if (!isSameSelection(currentInitialIds, oldInitialIds)) {
        selectedSchulenIds.value = currentInitialIds;
        handleSelectionUpdate(currentInitialIds);
        return;
      }

      // Case 3: Empty selection - use autoselected or initial values
      if (isEmptySelection(currentSelection)) {
        const newIds: SelectedSchulenIds =
          currentlyHasAutoselectedSchule && autoselectedSchule.value
            ? unwrapSelectedSchulenIds([autoselectedSchule.value.id])
            : currentInitialIds;

        if (!isSameSelection(selectedSchulenIds.value, newIds)) {
          selectedSchulenIds.value = newIds;
          handleSelectionUpdate(newIds);
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => organisationStore.schulenFilter.filterResult,
    () => {
      // this is a special case, because we can't assume that the appropriate schule is in the store already
      // this is redundant in all other cases
      if (props.initialIds) mirrorSelectionToStore(selectedSchulenIds.value);
    },
  );

  watch(
    schulenFilter,
    async (newFilter: OrganisationenFilter | undefined, oldFilter: OrganisationenFilter | undefined) => {
      // The timer can be cleared in all cases??
      if (timerId.value) clearTimeout(timerId.value);

      // We skip if we have an autoselectedSchule
      if (oldFilter && hasAutoselectedSchule.value) return;

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
    :class="['filter-dropdown', { selected: hasSelectedSchule }]"
    clearable
    data-testid="schule-select"
    density="compact"
    :disabled="hasAutoselectedSchule || readonly"
    id="schule-select"
    :items="translatedSchulen"
    item-value="value"
    item-text="title"
    :loading="organisationStore.schulenFilter.loading"
    :multiple="props.multiple"
    :no-data-text="props.texts?.noData ?? 'noDataFound'"
    :placeholder="props.texts?.placeholder ?? t('admin.schule.assignSchule')"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="organisationStore.resetSchulFilter"
    v-bind="selectedSchuleProps"
    v-model="selectedSchulenIds"
    v-model:search="searchInputSchulen"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
  </v-autocomplete>
</template>
