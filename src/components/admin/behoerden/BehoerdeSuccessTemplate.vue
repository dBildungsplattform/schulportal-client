<script setup lang="ts">
  import LabeledField from '@/components/admin/LabeledField.vue';
  import CreateAnotherButton from '@/components/layout/success/button/CreateAnotherButton.vue';
  import NavigationButton from '@/components/layout/success/button/NavigationButton.vue';
  import SuccessTemplate from '@/components/layout/success/SuccessTemplate.vue';

  defineProps<{
    backButtonText?: string;
    changedData: Array<{ label: string; value: string; testId: string }>;
    createAnotherButtonText: string;
    successMessage: string;
  }>();

  type Emits = {
    (event: 'onNavigateBackToBehoerdeList'): void;
    (event: 'onCreateAnotherBehoerde'): void;
  };

  const emit: Emits = defineEmits<Emits>();

  /* the results list is not available yet, see SPSH-4323 */
  const navigateBack = (): void => emit('onNavigateBackToBehoerdeList');
  const createAnother = (): void => emit('onCreateAnotherBehoerde');
</script>

<template>
  <SuccessTemplate>
    <template #message>
      <span data-testid="behoerde-success-text">{{ successMessage }}</span>
    </template>
    <template #description>
      {{ $t('admin.followingDataCreated') }}
    </template>
    <template #default>
      <LabeledField
        v-for="item in changedData"
        :key="item.testId"
        :label="item.label"
        :value="item.value"
      />
    </template>
    <template #actions>
      <NavigationButton
        v-if="backButtonText"
        @click="navigateBack"
      >
        {{ backButtonText }}
      </NavigationButton>
      <CreateAnotherButton @click="createAnother">
        {{ createAnotherButtonText }}
      </CreateAnotherButton>
    </template>
  </SuccessTemplate>
</template>
