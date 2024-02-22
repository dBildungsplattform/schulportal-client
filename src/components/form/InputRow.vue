<script setup lang="ts">
  import { computed, type Ref, type WritableComputedRef } from 'vue'
  import { type BaseFieldProps } from 'vee-validate'

  type Props = {
    errorLabel: string | boolean
    fieldProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
    id: string
    isMultiple?: boolean
    isRequired?: boolean
    isSelect?: boolean
    label: string
    modelValue: string | undefined
    placeholder: string
    selectableItems?: Array<unknown>
  }

  const props: Props = defineProps<Props>()

  const emit: (event: 'onDirtyModelValue' | 'update:modelValue', ...args: unknown[]) => void =
    defineEmits(['onDirtyModelValue', 'update:modelValue'])

  const value: WritableComputedRef<string | undefined> = computed({
    get() {
      return props.modelValue
    },
    set(newValue: string | undefined) {
      emit('update:modelValue', newValue)
      /* if a value is set, we manually dirty the model to simplify dirty handling */
      emit('onDirtyModelValue', !!newValue)
    }
  })
</script>

<template>
  <v-row class="align-center mt-8">
    <v-col
      class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
      cols="12"
      sm="4"
    >
      <label
        :for="id"
        :error="errorLabel"
        :required="isRequired"
        >{{ label }}</label
      >
    </v-col>
    <v-col
      class="py-0"
      cols="12"
      sm="8"
    >
      <v-select
        v-if="isSelect"
        clearable
        :data-testid="id"
        density="compact"
        :id="id"
        :items="selectableItems"
        item-value="value"
        item-text="title"
        :multiple="isMultiple"
        :placeholder="placeholder"
        :required="isRequired"
        variant="outlined"
        v-bind="fieldProps"
        v-model="value"
      ></v-select>

      <v-text-field
        v-else
        clearable
        :data-testid="id"
        density="compact"
        :id="id"
        :placeholder="placeholder"
        :required="isRequired"
        variant="outlined"
        v-bind="fieldProps"
        v-model="value"
      ></v-text-field>
    </v-col>
  </v-row>
</template>

<style></style>
