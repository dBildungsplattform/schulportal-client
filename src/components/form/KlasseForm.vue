<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { getValidationSchema, getVuetifyConfig, type ValidationSchema } from '@/utils/validationKlasse';
  import { useForm, useIsFormDirty, useIsFormValid, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { computed, useTemplateRef, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import SchulenFilter from '../filter/SchulenFilter.vue';

  type Props = {
    initialValues?: Partial<ValidationSchema>;
    errorCode?: string;
    showUnsavedChangesDialog?: boolean;
    editMode: boolean;
    isEditActive?: boolean;
    isLoading: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: (values: ValidationSchema) => Promise<void>;
  };
  const props: Props = defineProps<Props>();
  type Emits = {
    (event: 'formStateChanged', payload: { values: ValidationSchema; dirty: boolean; valid: boolean }): void;
  };
  const emit: Emits = defineEmits<Emits>();
  const { t }: Composer = useI18n({ useScope: 'global' });
  // eslint-disable-next-line @typescript-eslint/typedef
  const schulenFilterRef = useTemplateRef('schulenFilter');
  const organisationStore: OrganisationStore = useOrganisationStore();

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);
  const validationSchema: TypedSchema = getValidationSchema(t);

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, resetForm, setFieldValue } = useForm<ValidationSchema>({
    validationSchema,
    initialValues: {
      selectedSchule: props.initialValues?.selectedSchule ?? '',
      selectedKlassenname: props.initialValues?.selectedKlassenname ?? '',
    },
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);

  const isDirty: ComputedRef<boolean> = useIsFormDirty();
  const isValid: ComputedRef<boolean> = useIsFormValid();
  const canCommit: ComputedRef<boolean> = computed(() => isDirty.value && isValid.value);

  function reset(): void {
    resetForm();
    schulenFilterRef.value?.clearInput();
    emit('formStateChanged', {
      values: { selectedKlassenname: selectedKlassenname.value, selectedSchule: selectedSchule.value },
      dirty: isDirty.value,
      valid: isValid.value,
    });
  }

  defineExpose({ reset });

  async function submitHandler(): Promise<void> {
    await props.onSubmit({ selectedSchule: selectedSchule.value, selectedKlassenname: selectedKlassenname.value });
    reset();
  }

  function setInitialValues(): void {
    if (!props.initialValues) return;
    setFieldValue('selectedSchule', props.initialValues.selectedSchule ?? '');
    setFieldValue('selectedKlassenname', props.initialValues.selectedKlassenname ?? '');
  }

  watch(
    () => organisationStore.schulenFilter.selectedItems,
    (schulen: Array<Organisation>) => {
      const newSchuleId: string = schulen.length === 1 ? schulen[0]!.id : '';
      if (selectedSchule.value !== newSchuleId) selectedSchule.value = newSchuleId;
    },
  );

  watch(
    () => props.isEditActive,
    (newValue: boolean | undefined, oldValue: boolean | undefined) => {
      if (oldValue && !newValue) setInitialValues();
    },
  );

  watch(
    [isDirty, isValid],
    () => {
      emit('formStateChanged', {
        values: { selectedKlassenname: selectedKlassenname.value, selectedSchule: selectedSchule.value },
        dirty: isDirty.value,
        valid: isValid.value,
      });
    },
    { immediate: true },
  );

  watch(
    () =>
      ({
        selectedSchule: props.initialValues?.selectedSchule,
        selectedKlassenname: props.initialValues?.selectedKlassenname,
      }) as Partial<ValidationSchema>,
    (newValues: Partial<ValidationSchema>, oldValues: Partial<ValidationSchema>) => {
      if (newValues.selectedSchule !== oldValues.selectedSchule) {
        if (newValues.selectedKlassenname !== oldValues.selectedKlassenname) setInitialValues();
        else setFieldValue('selectedSchule', newValues.selectedSchule ?? '');
      }
    },
  );
</script>

<template data-test-id="klasse-form">
  <FormWrapper
    :canCommit
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="props.editMode ? t('save') : t('admin.klasse.create')"
    :discardButtonLabel="props.editMode ? t('cancel') : t('admin.klasse.discard')"
    :hideActions="Boolean(errorCode) || (props.editMode && !isEditActive)"
    id="klasse-form"
    :isLoading="isLoading"
    :onDiscard="onHandleDiscard"
    @onShowDialogChange="onShowDialogChange"
    :onSubmit="submitHandler"
    :showUnsavedChangesDialog="showUnsavedChangesDialog"
  >
    <!-- Slot for SPSH alerts -->
    <slot />

    <template v-if="!props.errorCode">
      <!-- Schule zuordnen -->
      <v-row>
        <h3 class="headline-3">1. {{ t('admin.schule.assignSchule') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedSchuleProps?.error || ''"
        labelForId="schule-select"
        :isRequired="true"
        :label="t('admin.schule.schule')"
      >
        <SchulenFilter
          ref="schulenFilter"
          :multiple="false"
          :readonly="props.editMode"
          :initialIds="props.initialValues?.selectedSchule"
          :systemrechteForSearch="[RollenSystemRecht.KlassenVerwalten]"
          :selectedSchuleProps="selectedSchuleProps"
        ></SchulenFilter>
      </FormRow>

      <!-- Klassenname eingeben -->
      <v-row class="mt-8">
        <h3 class="headline-3">2. {{ t('admin.klasse.enterKlassenname') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedKlassennameProps?.error || ''"
        labelForId="klassenname-input"
        :isRequired="true"
        :label="t('admin.klasse.klassenname')"
      >
        <v-text-field
          clearable
          data-testid="klassenname-input"
          density="compact"
          :disabled="editMode && !isEditActive"
          id="klassenname-input"
          :placeholder="t('admin.klasse.enterKlassenname')"
          ref="klassenname-input"
          required="true"
          variant="outlined"
          v-bind="selectedKlassennameProps"
          v-model="selectedKlassenname"
        ></v-text-field>
      </FormRow>
    </template>
  </FormWrapper>
</template>

<style scoped></style>
