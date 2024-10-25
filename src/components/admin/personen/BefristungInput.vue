<script setup lang="ts">
  import { ref, watch, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import FormRow from '@/components/form/FormRow.vue';
  import type { BaseFieldProps } from 'vee-validate';
  import { BefristungOption } from '@/stores/PersonenkontextStore';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import { getNextSchuljahresende } from '@/utils/date';

  useI18n();

  export type BefristungProps = {
    befristungProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    befristungOptionProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isUnbefristetDisabled: boolean;
    isBefristungRequired: boolean;
    nextSchuljahresende: string;
    befristung: string | undefined;
    befristungOption: string | undefined;
  };

  const props: BefristungProps = defineProps<BefristungProps>();

  type Emits = {
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:calculatedBefristungOption', value: string | undefined): void;
  };
  const emit: Emits = defineEmits<{
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:calculatedBefristungOption', value: string | undefined): void;
  }>();

  const localBefristung: Ref<string | undefined> = ref(props.befristung);
  const localBefristungOption: Ref<string | undefined> = ref<string | undefined>(props.befristungOption);

  // Handles any change related to the befristung radio buttons
  function handleBefristungOptionChange(value: string | null): void {
    localBefristung.value = undefined;
    switch (value) {
      case BefristungOption.SCHULJAHRESENDE: {
        localBefristungOption.value = value;
        emit('update:calculatedBefristungOption', getNextSchuljahresende());
        break;
      }
      case BefristungOption.UNBEFRISTET: {
        localBefristungOption.value = value;
        emit('update:calculatedBefristungOption', undefined);
        break;
      }
    }
  }

  // Handles any change related to the befristung input field
  const handleBefristungChange = (value: string | undefined): void => {
    localBefristung.value = value;
    emit('update:befristung', value);
    localBefristungOption.value = undefined;
  };

  // If the befristung is required then autoselect Schuljahresende, otherwise Unbefristet
  watch(
    () => props.isBefristungRequired,
    (newValue: boolean) => {
      if (newValue) {
        localBefristungOption.value = BefristungOption.SCHULJAHRESENDE;
      } else {
        localBefristungOption.value = BefristungOption.UNBEFRISTET;
      }
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
          ref="befristung-radio-group"
          @update:modelValue="handleBefristungOptionChange"
          v-model="localBefristungOption"
          v-bind="befristungOptionProps"
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
