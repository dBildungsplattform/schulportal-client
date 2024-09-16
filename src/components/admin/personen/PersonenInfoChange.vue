<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import type { BaseFieldProps } from 'vee-validate';
  import KopersInput from '@/components/admin/personen/KopersInput.vue';

  useI18n({ useScope: 'global' });

  type Props = {
    selectedKopersNrPersonInfoProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKopersNrPersonInfo: string | undefined;
  };

  defineProps<Props>();

  type Emits = {
    (event: 'update:selectedKopersNrPersonInfo', value: string | undefined): void;
  };
  const emits: Emits = defineEmits<Emits>();

  function handleSelectedKopersNrUpdate(value: string | undefined): void {
    emits('update:selectedKopersNrPersonInfo', value);
  }
</script>

<template>
  <div>
    <KopersInput
      :hideCheckbox="true"
      :selectedKopersNr="selectedKopersNrPersonInfo"
      :selectedKopersNrProps="selectedKopersNrPersonInfoProps"
      @update:selectedKopersNr="handleSelectedKopersNrUpdate"
    ></KopersInput>
  </div>
</template>

<style></style>
