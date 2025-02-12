<script setup lang="ts">
  const props = defineProps<{
    modelValue: boolean;
    title: string;
    text: string;
    showButton?: boolean;
    buttonText?: string;
    buttonAction?: Function;
    type: 'error' | 'success' | 'warning' | 'info' | undefined;
    closable?: boolean;
  }>();

  type Emits = {
    (event: 'update:modelValue', value: boolean): void;
  };
  const emit: Emits = defineEmits<{
    (event: 'update:modelValue', value: boolean): void;
  }>();

  const closeAlert = (): void => {
    emit('update:modelValue', false); // Emit the event to update modelValue
  };
</script>

<template>
  <v-container v-if="modelValue">
    <v-slide-y-transition>
      <v-alert
        :model-value="modelValue"
        :type="type"
        variant="outlined"
        :closable="closable"
        @click:close="closeAlert"
      >
        <v-row>
          <v-col
            class="primary-text-color"
            cols="auto"
          >
            <strong data-testid="alert-title">{{ title }}</strong>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            class="primary-text-color"
            cols="auto"
          >
            <span data-testid="alert-text">{{ text }}</span>
            <slot name="text"></slot>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col
            v-if="showButton"
            cols="auto"
          >
            <v-btn
              class="primary"
              @click="buttonAction"
              data-testid="alert-button"
            >
              {{ buttonText }}
            </v-btn>
          </v-col>
          <slot name="button"></slot>
        </v-row>
      </v-alert>
    </v-slide-y-transition>
  </v-container>
</template>

<style scoped>
  .v-alert {
    border-width: 3px;
  }
</style>
