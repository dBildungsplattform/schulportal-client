<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import type { Organisation } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import type { TranslatedObject } from '@/types';
  import { getValidationSchema, getVuetifyConfig } from '@/utils/validationKlasse';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import {
    computed,
    defineProps,
    onMounted,
    ref,
    useTemplateRef,
    watch,
    type ComputedRef,
    type ModelRef,
    type Ref,
  } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import SchulenFilter from '../filter/SchulenFilter.vue';

  type KlasseForm = {
    selectedSchule: string;
    selectedKlassenname: string;
  };
  type Props = {
    initialValues?: Partial<KlasseForm>;
    errorCode?: string;
    schulen?: Array<TranslatedObject>;
    readonly?: boolean;
    showUnsavedChangesDialog?: boolean;
    isEditActive?: boolean;
    isLoading: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: (values: KlasseForm) => Promise<void>;
  };
  const props: Props = defineProps<Props>();
  const isFormDirty: ModelRef<boolean, string> = defineModel<boolean>('isFormDirty', { default: false });
  const { t }: Composer = useI18n({ useScope: 'global' });
  const schulenFilterRef = useTemplateRef('schulenFilter');

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);
  const validationSchema: TypedSchema = getValidationSchema(t);

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, isFieldDirty, resetForm, setFieldValue, isFieldValid } = useForm<KlasseForm>({
    validationSchema,
    initialValues: {
      selectedSchule: props.initialValues?.selectedSchule ?? '',
      selectedKlassenname: props.initialValues?.selectedKlassenname ?? '',
    },
  });
  function reset(): void {
    resetForm();
    schulenFilterRef.value?.clearInput();
  }
  defineExpose({ reset });

  const isInEditMode: ComputedRef<boolean> = computed(() => props.isEditActive !== undefined);

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);
  const canCommit: Ref<boolean> = ref(false);

  async function submitHandler(): Promise<void> {
    await props.onSubmit({ selectedSchule: selectedSchule.value, selectedKlassenname: selectedKlassenname.value });
    reset();
  }

  watch([selectedSchule, selectedKlassenname], ([newSelectedSchule, newSelectedKlassenname]) => {
    isFormDirty.value =
      props.isEditActive !== false && (isFieldDirty('selectedSchule') || isFieldDirty('selectedKlassenname'));
    canCommit.value = isFormDirty.value && isFieldValid('selectedSchule') && isFieldValid('selectedKlassenname');
  });

  function setSelectedSchule(schulen: Array<Organisation>): void {
    const newSchuleId: string = schulen.length === 1 ? schulen[0]!.id : '';
    if (selectedSchule.value !== newSchuleId) selectedSchule.value = newSchuleId;
  }

  function setInitialValues(): void {
    if (!props.initialValues) return;
    setFieldValue('selectedSchule', props.initialValues.selectedSchule ?? '');
    setFieldValue('selectedKlassenname', props.initialValues.selectedKlassenname ?? '');
  }

  watch(
    () => props.isEditActive,
    (newValue: boolean | undefined, oldValue: boolean | undefined) => {
      if (oldValue && !newValue) setInitialValues();
    },
  );
</script>

<template data-test-id="klasse-form">
  <FormWrapper
    :canCommit
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="isInEditMode ? t('save') : t('admin.klasse.create')"
    :discardButtonLabel="isInEditMode ? t('cancel') : t('admin.klasse.discard')"
    :hideActions="!isEditActive"
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
        <div class="pb-sm-4">
          <SchulenFilter
            ref="schulenFilter"
            :multiple="false"
            :readonly
            :initialIds="props.initialValues?.selectedSchule"
            :systemrechteForSearch="[RollenSystemRecht.KlassenVerwalten]"
            :selectedSchuleProps="selectedSchuleProps"
            @onSchuleSelected="setSelectedSchule"
          ></SchulenFilter>
          {{ props.initialValues?.selectedSchule }}
          {{ isFieldDirty('selectedSchule') }}
          {{ isFieldValid('selectedSchule') }}
        </div>
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
          :disabled="!isEditActive"
          id="klassenname-input"
          :placeholder="t('admin.klasse.enterKlassenname')"
          ref="klassenname-input"
          required="true"
          variant="outlined"
          v-bind="selectedKlassennameProps"
          v-model="selectedKlassenname"
        ></v-text-field>
        {{ isFieldValid('selectedKlassenname') }}
      </FormRow>
    </template>
    {{ canCommit }}
  </FormWrapper>
</template>

<style scoped></style>
