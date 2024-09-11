<script setup lang="ts">
  import { ref, watch, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import FormRow from '@/components/form/FormRow.vue';
  import type { BaseFieldProps } from 'vee-validate';
  import { BefristungOption } from '@/stores/PersonenkontextStore';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';

  useI18n();

  type Props = {
    befristungProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    befristungOptionProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isUnbefristetDisabled: boolean;
    isBefristungRequired: boolean;
    nextSchuljahresende: string;
    befristung: string | undefined;
    befristungOption: string | undefined;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:befristungOption', value: string | undefined): void;
  };
  const emit: Emits = defineEmits<{
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:befristungOption', value: string | undefined): void;
  }>();

  const localBefristung: Ref<string | undefined> = ref(props.befristung);
  const localBefristungOption: Ref<string | undefined> = ref<string | undefined>(props.befristungOption);

  const handleBefristungChange = (value: string | undefined): void => {
    localBefristung.value = value;
    emit('update:befristung', value);

    // Reset befristungOption only if a custom date is entered
    if (value && value !== props.nextSchuljahresende) {
      localBefristungOption.value = undefined;
      emit('update:befristungOption', undefined);
    }
  };

  const handleBefristungOptionChange = (value: string): void => {
    localBefristungOption.value = value;
    emit('update:befristungOption', value);
  };

  watch(
    () => props.befristung,
    (newValue: string | undefined) => {
      localBefristung.value = newValue;
    },
  );

  watch(
    () => props.befristungOption,
    (newValue: string | undefined) => {
      localBefristungOption.value = newValue;
    },
  );
</script>

<template>
  <div>
    <FormRow
      :errorLabel="befristungProps?.error || ''"
      labelForId="befristung-select"
      :isRequired="isBefristungRequired"
      :label="$t('admin.befristung.befristung')"
    >
      <v-text-field
        data-testid="befristung-input"
        v-model="localBefristung"
        v-bind="befristungProps"
        variant="outlined"
        placeholder="TT.MM.JJJJ"
        color="primary"
        @update:modelValue="handleBefristungChange"
      ></v-text-field>
    </FormRow>
    <v-row class="align-center">
      <v-col
        class="py-0 mt-n1"
        cols="12"
        sm="7"
        offset-sm="5"
      >
        <v-radio-group
          data-testid="befristung-radio-group"
          v-model="localBefristungOption"
          v-bind="befristungOptionProps"
          @update:modelValue="handleBefristungOptionChange"
        >
          <v-radio
            data-testid="schuljahresende-radio-button"
            :label="`${$t('admin.befristung.untilEndOfSchoolYear')} (${nextSchuljahresende})`"
            :value="BefristungOption.SCHULJAHRESENDE"
            color="primary"
          ></v-radio>
          <SpshTooltip
            v-if="isUnbefristetDisabled"
            :enabledCondition="!isUnbefristetDisabled"
            :disabledText="$t('admin.befristung.unlimitedInactive')"
            position="start"
          >
            <v-radio
              data-testid="unbefristet-radio-button"
              :label="$t('admin.befristung.unlimited')"
              :value="BefristungOption.UNBEFRISTET"
              :color="'primary'"
              :disabled="isUnbefristetDisabled"
            ></v-radio>
          </SpshTooltip>
          <v-radio
            v-else
            data-testid="unbefristet-radio-button"
            :label="$t('admin.befristung.unlimited')"
            :value="BefristungOption.UNBEFRISTET"
            :color="'primary'"
            :disabled="isUnbefristetDisabled"
          ></v-radio>
        </v-radio-group>
      </v-col>
    </v-row>
  </div>
</template>
