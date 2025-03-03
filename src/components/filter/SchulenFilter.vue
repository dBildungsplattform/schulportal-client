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
  const { t }: Composer = useI18n({ useScope: 'global' });

  const selectedSchulenIds: Ref<SelectedSchulenIds> = ref(props.initialIds ?? []);
  const searchInput: Ref<string | undefined> = ref(undefined);
  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const schulenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Schule,
    systemrechte: props.systemrechteForSearch,
    limit: 25,
    organisationIds: [],
  });

  const clearInput = (): void => {
    searchInput.value = undefined;
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
      const hasSelectionChanged: boolean = !isSameSelection(currentSelection, oldSelection);
      const havePropsChanged: boolean = !isSameSelection(currentInitialIds, oldInitialIds);
      if (hasSelectionChanged) {
        handleSelectionUpdate(currentSelection);
      } else if (havePropsChanged) {
        selectedSchulenIds.value = currentInitialIds;
        handleSelectionUpdate(currentInitialIds);
      } else if (isEmptySelection(currentSelection)) {
        let tempIds: SelectedSchulenIds;
        if (currentlyHasAutoselectedSchule && autoselectedSchule.value) {
          tempIds = unwrapSelectedSchulenIds([autoselectedSchule.value.id]);
        } else {
          tempIds = currentInitialIds;
        }
        if (!isSameSelection(selectedSchulenIds.value, tempIds)) {
          selectedSchulenIds.value = tempIds;
          handleSelectionUpdate(tempIds);
        }
      }
    },
    { immediate: true },
  );

  watch(
    () => organisationStore.schulenFilter.filterResult,
    () => {
      const ids: SelectedSchulenIds = selectedSchulenIds.value;
      // this is a special case, because we can't assume that the appropriate schule is in the store already
      // this is redundant in all other cases
      if (props.initialIds) mirrorSelectionToStore(ids);
    },
  );

  watch(
    schulenFilter,
    async (newFilter: OrganisationenFilter, oldFilter: OrganisationenFilter | undefined) => {
      if (oldFilter) {
        clearTimeout(timerId.value);
        if (hasAutoselectedSchule.value) return;
        timerId.value = setTimeout(async () => {
          await organisationStore.loadSchulenForFilter(newFilter);
        }, 500);
      } else {
        // initial load
        await organisationStore.loadSchulenForFilter(newFilter);
      }
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
    v-model:search="searchInput"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
  </v-autocomplete>
</template>
