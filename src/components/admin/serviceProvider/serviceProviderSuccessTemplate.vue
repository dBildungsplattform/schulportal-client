<script setup lang="ts">
  import { type Ref } from 'vue';
  import { useDisplay } from 'vuetify';

  defineProps<{
    successMessage: string;
    followingDataChanged: string;
    changedData: Array<{ label: string; value: string; testId: string }>;

    showToServiceProviderDetailsButton: boolean;
    showBackButton: boolean;
    showCreateAnotherButton: boolean;

    toServiceProviderDetailsButtonText: string;
    toServiceProviderDetailsButtonTestId: string;
  }>();

  type Emits = {
    (event: 'back'): void;
    (event: 'createAnother'): void;
    (event: 'toServiceProviderDetails'): void;
  };

  const emit: Emits = defineEmits<Emits>();

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const navigateToServiceProviderDetails = (): void => emit('toServiceProviderDetails');
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="auto"
        class="subtitle-1 pre-line text-center"
      >
        {{ successMessage }}
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="auto">
        <v-icon
          color="success"
          icon="mdi-check-circle"
        />
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col
        cols="auto"
        class="subtitle-2"
      >
        {{ followingDataChanged }}
      </v-col>
    </v-row>

    <v-row
      v-for="(item, index) in changedData"
      :key="index"
    >
      <v-col class="text-body bold text-right"> {{ item.label }}: </v-col>
      <v-col class="text-body">
        <span :data-testid="item.testId">{{ item.value }}</span>
      </v-col>
    </v-row>

    <v-divider
      class="border-opacity-100 rounded my-6"
      color="#E5EAEF"
      thickness="6"
    />

    <v-row justify="end">
      <v-col
        v-if="showToServiceProviderDetailsButton"
        cols="12"
        sm="6"
        md="auto"
      >
        <v-btn
          class="secondary"
          :block="mdAndDown"
          :data-testid="toServiceProviderDetailsButtonTestId"
          @click="navigateToServiceProviderDetails"
        >
          {{ toServiceProviderDetailsButtonText }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .pre-line {
    white-space: pre-wrap;
  }
</style>
