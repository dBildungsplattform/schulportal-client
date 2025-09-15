<script setup lang="ts">
  import type { PersonenkontextWorkflowResponse, RollenSystemRechtEnum } from '@/api-client/generated/api';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type AutoCompleteStore,
    type Organisation,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import {
    usePersonenkontextStore,
    type OperationContext,
    type PersonenkontextStore,
    type WorkflowAutoCompleteStore,
    type WorkflowFilter,
  } from '@/stores/PersonenkontextStore';
  import type { TranslatedObject } from '@/types';
  import { dedup, sameContent } from '@/utils/arrays';
  import { getDisplayNameForOrg } from '@/utils/formatting';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, onMounted, onUnmounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  type SelectedSchulenIds = Array<string> | string | undefined;
  type Props = {
    hideDetails?: boolean;
    systemrechteForSearch?: Array<RollenSystemRechtEnum>;
    multiple: boolean;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    highlightSelection?: boolean;
    placeholderText?: string;
    includeAll?: boolean;
    filterId?: string;
    useWorkflowEndpoints?: boolean;
    useLandesbediensteteWorkflow?: boolean;
    operationContext?: OperationContext;
  };
  type Emits = {
    (e: 'update:selectedSchulenObjects', value: Array<Organisation>): void;
  };
  const props: Props = defineProps<Props>();
  const emits: Emits = defineEmits<Emits>();
  const selectedSchulen: Ref<SelectedSchulenIds> = defineModel('selectedSchulen');
  const searchInputSchulen: Ref<string | undefined> = ref(undefined);
  const clearInput = (): void => {
    searchInputSchulen.value = undefined;
    selectedSchulen.value = undefined;
  };

  const { t }: Composer = useI18n({ useScope: 'global' });
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const testId: ComputedRef<string> = computed(() => {
    const typ: string = props.includeAll ? 'organisation' : 'schule';
    return props.filterId ? `${props.filterId}-${typ}-select` : `${typ}-select`;
  });

  const organisationStoreReference: ComputedRef<AutoCompleteStore<Organisation> | undefined> = computed(() => {
    return organisationStore.organisationenFilters.get(props.filterId ?? '');
  });

  const workflowStoreReference: ComputedRef<WorkflowAutoCompleteStore<PersonenkontextWorkflowResponse> | undefined> =
    computed(() => {
      return personenkontextStore.workflowStepResponses.get(props.filterId ?? '');
    });

  const storeReference: ComputedRef<
    AutoCompleteStore<Organisation> | WorkflowAutoCompleteStore<PersonenkontextWorkflowResponse> | undefined
  > = computed(() => {
    const isWorkflow: false | WorkflowAutoCompleteStore<PersonenkontextWorkflowResponse> | undefined =
      props.useWorkflowEndpoints && workflowStoreReference.value;

    if (isWorkflow) {
      return {
        ...workflowStoreReference.value!,
        filterResult: workflowStoreReference.value!.filterResult?.organisations ?? [],
      };
    }

    return organisationStoreReference.value;
  });
  const typFilter: ComputedRef<Pick<OrganisationenFilter, 'includeTyp' | 'excludeTyp'>> = computed(() => {
    if (props.includeAll) return { excludeTyp: [OrganisationsTyp.Klasse] };
    else return { includeTyp: OrganisationsTyp.Schule };
  });

  // The filter used to load the Schulen and possibly orgas
  const schulenFilter: OrganisationenFilter = reactive({
    ...typFilter.value,
    systemrechte: props.systemrechteForSearch,
    limit: 25,
    organisationIds: [],
  });

  // Specific filter to load the organisationen in the forms that are tied to the workflow endpoints (Normal and landesbedienstete)
  const organisationenFilter: WorkflowFilter = reactive({
    operationContext: props.operationContext,
    personId: undefined,
    organisationId: undefined, // or set to a specific value if needed
    rollenIds: [],
    rolleName: undefined,
    organisationName: undefined,
    limit: 25,
    requestedWithSystemrecht: props.systemrechteForSearch ? props.systemrechteForSearch[0] : undefined,
  });

  const { hasAutoselectedSchule, autoselectedSchule }: ReturnType<typeof useAutoselectedSchule> = useAutoselectedSchule(
    props.systemrechteForSearch ?? [],
  );

  const isInputDisabled: ComputedRef<boolean> = computed(() => {
    return props.readonly || hasAutoselectedSchule.value;
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

  const isEmptySelection = (selection: SelectedSchulenIds): boolean => {
    if (!selection) return true;
    return wrapSelectedSchulenIds(selection).filter(Boolean).length === 0;
  };

  const translateSchule = (schule: Organisation): TranslatedObject => ({
    value: schule.id,
    title: getDisplayNameForOrg(schule),
  });

  const translatedSchulen: ComputedRef<Array<TranslatedObject>> = computed(() => {
    let options: Array<TranslatedObject> = [];
    const filterResult: Organisation[] | PersonenkontextWorkflowResponse | null | undefined =
      storeReference.value?.filterResult;

    if (Array.isArray(filterResult)) {
      // Handle Organisation[] case
      options = filterResult.map(translateSchule);
    } else if (filterResult && 'organisations' in filterResult) {
      // Handle PersonenkontextWorkflowResponse case - extract organisations array
      options = filterResult.organisations.map(translateSchule);
    }

    if (autoselectedSchule.value) options.push(translateSchule(autoselectedSchule.value));
    return options;
  });

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

  const getDisplayItem = (item: TranslatedObject, index: number): string => {
    if (!selectedSchulen.value) return ''; // should not happen
    if (!canDisplaySelection(selectedSchulen.value)) return '...'; // we are loading
    if (!props.multiple) return item.title;

    if (selectedSchulen.value.length < 2) return item.title;
    if (index === 0) return t('admin.schule.schulenSelected', { count: selectedSchulen.value.length });
    return ''; // do not display anything for other items
  };

  const shouldHighlightSelection: ComputedRef<boolean> = computed(() => {
    if (hasAutoselectedSchule.value) return true;
    if (props.highlightSelection && !isEmptySelection(selectedSchulen.value)) return true;
    return false;
  });

  const isDisplayName = (name: string): boolean => {
    return translatedSchulen.value.find((schule: TranslatedObject) => schule.title === name) !== undefined;
  };

  const updateSearchString = (searchString: string | undefined): void => {
    if (searchString && !isDisplayName(searchString)) {
      // Update organisation filter
      schulenFilter.searchString = searchString;

      // Update workflow filter with the corresponding property
      organisationenFilter.organisationName = searchString;
    } else {
      // Clear search from both filters
      delete schulenFilter.searchString;
      delete organisationenFilter.organisationName;
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

  const resolveSelection = (selection: SelectedSchulenIds): Array<Organisation> => {
    if (isEmptySelection(selection)) return [];
    const selectedIds: Array<string> = wrapSelectedSchulenIds(selection);
    const filterResult: Organisation[] | PersonenkontextWorkflowResponse | null | undefined =
      storeReference.value?.filterResult;
    if (Array.isArray(filterResult)) {
      return filterResult.filter((org: Organisation) => selectedIds.includes(org.id));
    }
    return [];
  };

  const handleSelectionUpdate = (selection: SelectedSchulenIds): void => {
    if (isEmptySelection(selection)) {
      updateOrganisationenIds([]);
      updateSearchString(undefined);
      clearInput();
      emits('update:selectedSchulenObjects', []);
    } else {
      updateOrganisationenIds(selection);
      emits('update:selectedSchulenObjects', resolveSelection(selection));
    }
  };

  const isSameSelection = (a: SelectedSchulenIds, b: SelectedSchulenIds): boolean => {
    return sameContent(wrapSelectedSchulenIds(a), wrapSelectedSchulenIds(b));
  };

  const handleFocusChange = (focused: boolean): void => {
    if (!props.multiple) return;
    if (!focused) {
      searchInputSchulen.value = undefined;
    }
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
    [schulenFilter, organisationenFilter],
    async (
      [newSchulenFilter, newOrganisationenFilter]: [OrganisationenFilter, WorkflowFilter],
      oldValue: [OrganisationenFilter, WorkflowFilter] | undefined,
    ) => {
      // Existing guard clause
      if (
        !isEmptySelection(selectedSchulen.value) &&
        isInputDisabled.value &&
        canDisplaySelection(selectedSchulen.value)
      ) {
        return;
      }

      if (timerId.value) {
        clearTimeout(timerId.value);
      }

      // Apply debounce if *either* filter already had a value (means a change was made)
      const hasOldFilter: boolean = !!oldValue?.[0] || !!oldValue?.[1];
      const delay: number = hasOldFilter ? 500 : 0;

      timerId.value = setTimeout(async () => {
        // Handle first filter (existing logic)
        await organisationStore.loadOrganisationenForFilter(newSchulenFilter, props.filterId);

        // Handle second filter (new workflow filter)
        await personenkontextStore.loadWorkflowOrganisationenForFilter(
          newOrganisationenFilter,
          props.filterId,
          props.useLandesbediensteteWorkflow,
        );
      }, delay);
    },
    { deep: true, immediate: true },
  );

  onMounted(() => {
    if (organisationStore.organisationenFilters.has(props.filterId ?? '')) {
      // eslint-disable-next-line no-console
      console.warn(`SchulenFilter initialized twice with id ${props.filterId}`);
    }
    organisationStore.resetOrganisationenFilter(props.filterId);
  });

  onUnmounted(() => {
    organisationStore.clearOrganisationenFilter(props.filterId);
  });
</script>

<template>
  <v-autocomplete
    autocomplete="off"
    :class="['filter-dropdown', { selected: shouldHighlightSelection }]"
    clearable
    :data-testid="testId"
    density="compact"
    :disabled="isInputDisabled"
    :id="testId"
    :ref="testId"
    :items="translatedSchulen"
    item-value="value"
    item-text="title"
    :multiple="props.multiple"
    :no-data-text="'noDataFound'"
    :placeholder="props.placeholderText ?? t('admin.schule.assignSchule')"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="
      useWorkflowEndpoints
        ? personenkontextStore.resetWorkflowOrganisationenFilter(props.filterId)
        : organisationStore.resetOrganisationenFilter(props.filterId)
    "
    @update:focused="handleFocusChange"
    v-bind="selectedSchuleProps"
    v-model="selectedSchulen"
    v-model:search="searchInputSchulen"
    :hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
    <template v-slot:selection="{ item, index }">
      <span
        v-if="getDisplayItem(item, index)"
        class="v-autocomplete__selection-text"
      >
        {{ getDisplayItem(item, index) }}
      </span>
    </template>
  </v-autocomplete>
</template>
