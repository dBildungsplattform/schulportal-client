<script setup lang="ts">
  import { ref, watch, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { BaseFieldProps } from 'vee-validate';

  useI18n();

  export type BefristungProps = {
    befristungProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    befristung: string | undefined;
    isUnbefristet: boolean;
  };

  enum RadioButtonSelect {
    FIRST_OPTION = 'UNBEFRISTET',
    SECOND_OPTION = 'BEFRISTET',
  }

  const props: BefristungProps = defineProps<BefristungProps>();

  // Define the emits type correctly
  type Emits = {
    (event: 'update:befristung', value: string | undefined): void;
    (event: 'handleSelectedRadioButtonChange', value: boolean): void;
  };

  // Use the correct signature for defineEmits
  const emit: Emits = defineEmits<{
    (event: 'update:befristung', value: string | undefined): void;
    (event: 'handleSelectedRadioButtonChange', value: boolean): void;
  }>();

  const localBefristung: Ref<string | undefined> = ref(props.befristung);
  //const isUnbefristet: Ref<boolean> = ref(props.isUnbefristet);
  const selectedRadioButton: Ref<string> = ref(RadioButtonSelect.FIRST_OPTION);

  // Handles any change related to the befristung input field
  const handleBefristungChange = (value: string | undefined): void => {
    localBefristung.value = value;
    emit('update:befristung', value);
  };

  watch(selectedRadioButton, (newVal: string) => {
    if (newVal === RadioButtonSelect.FIRST_OPTION) {
      emit('handleSelectedRadioButtonChange', true);
    } else if (newVal === RadioButtonSelect.SECOND_OPTION) {
      emit('handleSelectedRadioButtonChange', false);
    }
  });
</script>

<template>
  <div>
    <v-row class="align-center">
      <v-col>
        <v-radio-group
          data-testid="befristung-radio-group"
          v-model="selectedRadioButton"
        >
          <v-radio
            data-testid="unbefristet-radio-button"
            :label="$t('admin.befristung.unlimited')"
            :value="RadioButtonSelect.FIRST_OPTION"
            :color="'primary'"
          ></v-radio>
          <v-radio
            data-testid="befristet-radio-button"
            :label="'Befristet'"
            :value="RadioButtonSelect.SECOND_OPTION"
            :color="'primary'"
          ></v-radio>
        </v-radio-group>
      </v-col>
      <v-col>
        <v-text-field
          density="compact"
          variant="outlined"
          :disabled="selectedRadioButton === RadioButtonSelect.FIRST_OPTION"
          data-testid="befristung-input"
          v-model="localBefristung"
          v-bind="befristungProps"
          placeholder="TT.MM.JJJJ"
          color="primary"
          @update:modelValue="handleBefristungChange"
        ></v-text-field>
      </v-col>
    </v-row>
  </div>
</template>
