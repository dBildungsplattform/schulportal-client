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
  import { onMounted } from 'vue';
  import { computed, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  type Props = {
    includeTraeger?: boolean;
    systemrechteForSearch?: Array<RollenSystemRecht>;
    multiple: boolean;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
  };
  type Emits = {
    (event: 'onSchuleSelected', payload: Array<Organisation>): void;
  };
  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const selectedSchulenIds: Ref<Array<string> | string> = ref([]);
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

  const updateSearchString = (searchString: string | undefined): void => {
    schulenFilter.searchString = searchString;
  };

  watch(
    () => organisationStore.autoselectedSchule,
    (selectedSchule: Organisation | null) => {
      if (selectedSchule === null) {
        selectedSchulenIds.value = props.multiple ? [] : '';
      } else {
        selectedSchulenIds.value = selectedSchule.id;
      }
    },
  );

  watch(selectedSchulenIds, (newIds: Array<string> | string) => {
    if (Array.isArray(newIds)) {
      schulenFilter.organisationIds = newIds;
      organisationStore.schulenFilter.selectedItems = newIds
        // TODO: measure performance impact
        .map((id: string) =>
          organisationStore.schulenFilter.filterResult.find((schule: Organisation) => schule.id === id),
        )
        .filter((schule: Organisation | undefined) => schule != undefined);
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
    :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedSchulen.length > 0 }]"
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
    v-bind="selectedSchuleProps"
    v-model="selectedSchulenIds"
    hide-details
  ></v-autocomplete>
</template>
