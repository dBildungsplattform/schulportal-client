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
  import { getDisplayNameForOrg } from '@/utils/formatting';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, onMounted, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  type Props = {
    includeTraeger?: boolean;
    systemrechteForSearch?: Array<RollenSystemRecht>;
    multiple: boolean;
    readonly?: boolean;
    readonlyDefault?: Organisation;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
  };
  type Emits = {
    (event: 'onSchuleSelected', payload: Array<Organisation>): void;
  };
  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const searchInput: Ref<string | undefined> = ref(undefined);
  const selectedSchulenIds: Ref<Array<string> | string | undefined> = ref([]);
  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const schulenFilter: OrganisationenFilter = reactive({
    includeTyp: OrganisationsTyp.Schule,
    systemrechte: props.systemrechteForSearch,
    limit: 25,
  });

  const hasAutoselectedSchule: ComputedRef<boolean> = computed(() => organisationStore.autoselectedSchule !== null);
  const selectedSchulen: ComputedRef<Array<Organisation>> = computed(
    () => organisationStore.schulenFilter.selectedItems,
  );
  const translatedSchulen: ComputedRef<Array<TranslatedObject>> = computed(() =>
    organisationStore.schulenFilter.filterResult.map((schule: Organisation) => ({
      value: schule.id,
      title: getDisplayNameForOrg(schule),
    })),
  );
  const hasSelectedSchule: ComputedRef<boolean> = computed(
    () => hasAutoselectedSchule.value || props.readonly || selectedSchulen.value.length > 0,
  );

  const updateSearchString = (searchString: string | undefined): void => {
    schulenFilter.searchString = searchString;
  };

  const clearInput = (): void => {
    searchInput.value = undefined;
    selectedSchulenIds.value = undefined;
  };

  watch(
    () => organisationStore.autoselectedSchule,
    (selectedSchule: Organisation | null) => {
      if (selectedSchule === null) {
        selectedSchulenIds.value = props.multiple ? [] : undefined;
      } else {
        selectedSchulenIds.value = selectedSchule.id;
      }
    },
  );

  watch(
    () => organisationStore.schulenFilter.selectedItems,
    (newSelectedSchulen: Array<Organisation>) => {
      if (props.readonly) {
        if (props.readonlyDefault) {
          selectedSchulenIds.value = props.readonlyDefault.id;
          return;
        }
      }
      if (props.multiple) {
        selectedSchulenIds.value = newSelectedSchulen.map((schule: Organisation) => schule.id);
      } else if (newSelectedSchulen.length === 1) selectedSchulenIds.value = newSelectedSchulen[0]!.id;
      else if (newSelectedSchulen.length === 0 && !props.readonly) clearInput();
    },
  );

  watch(
    () => props.readonlyDefault,
    (defaultSchule: Organisation | undefined) => {
      if (!props.readonly || !defaultSchule) return;
      selectedSchulenIds.value = defaultSchule.id;
      schulenFilter.organisationIds = [defaultSchule.id];
      organisationStore.schulenFilter.selectedItems = [defaultSchule];
    },
    { immediate: true },
  );

  watch(selectedSchulenIds, (newIds: Array<string> | string | undefined) => {
    if (props.readonly) return;
    if (Array.isArray(newIds)) {
      schulenFilter.organisationIds = newIds;
      // TODO: measure performance impact
      organisationStore.schulenFilter.selectedItems = newIds.reduce(
        (tempSelection: Array<Organisation>, schuleId: string) => {
          const matchedSchule: Organisation | undefined = organisationStore.schulenFilter.filterResult.find(
            (schule: Organisation) => schule.id === schuleId,
          );
          if (matchedSchule) tempSelection.push(matchedSchule);
          return tempSelection;
        },
        [] as Array<Organisation>,
      );
    } else if (newIds === '' || newIds === undefined) {
      schulenFilter.organisationIds = [];
      schulenFilter.searchString = undefined;
      organisationStore.schulenFilter.selectedItems = [];
      clearInput();
    } else {
      schulenFilter.organisationIds = [newIds];
      const selectedSchule: Organisation | undefined = organisationStore.schulenFilter.filterResult.find(
        (schule: Organisation) => schule.id === newIds,
      );
      if (selectedSchule) {
        organisationStore.schulenFilter.selectedItems = [selectedSchule];
      }
    }

    emit('onSchuleSelected', organisationStore.schulenFilter.selectedItems);
  });

  watch(schulenFilter, (newFilter: OrganisationenFilter) => {
    clearTimeout(timerId.value);
    if (hasAutoselectedSchule.value) return;
    timerId.value = setTimeout(async () => {
      await organisationStore.loadSchulenForFilter(newFilter);
    }, 500);
  });

  onMounted(async () => {
    organisationStore.resetSchulFilter();
    await organisationStore.getAutoselectedSchule();
    await organisationStore.loadSchulenForFilter(schulenFilter);
  });
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
    :no-data-text="'noDataFound'"
    :placeholder="t('admin.schule.assignSchule')"
    ref="schule-select"
    required="true"
    variant="outlined"
    @update:search="updateSearchString"
    @click:clear="organisationStore.resetSchulFilter"
    v-bind="selectedSchuleProps"
    v-model="selectedSchulenIds"
    v-model:search="searchInput"
    hide-details
  >
    <template v-slot:prepend-item>
      <slot name="prepend-item"></slot>
    </template>
  </v-autocomplete>
</template>
