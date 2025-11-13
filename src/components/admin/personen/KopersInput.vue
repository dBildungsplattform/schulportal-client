<script setup lang="ts">
  import type { BaseFieldProps } from 'vee-validate';
  import { type Ref, ref, watch } from 'vue';
  import FormRow from '@/components/form/FormRow.vue';

  type Props = {
    isDisabled?: boolean;
    hasNoKopersNr?: boolean;
    selectedKopersNr: string | undefined;
    selectedKopersNrProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    hideCheckbox?: boolean;
  };

  type Emits = {
    (event: 'update:hasNoKopersNr', value: boolean | undefined): void;
    (event: 'update:selectedKopersNr', value: string | undefined): void;
  };

  const props: Props = defineProps<Props>();
  const emits: Emits = defineEmits<Emits>();

  const hasNoKopersNr: Ref<boolean | undefined> = ref(props.hasNoKopersNr);
  const selectedKopersNr: Ref<string | undefined> = ref(props.selectedKopersNr);

  watch(hasNoKopersNr, (newValue: boolean | undefined) => {
    emits('update:hasNoKopersNr', newValue);
  });

  watch(selectedKopersNr, (newValue: string | undefined) => {
    emits('update:selectedKopersNr', newValue);
  });
</script>

<template>
  <!-- No KoPers.-Nr. available checkbox
       We don't use the form row here to avoid margins and paddings -->
  <v-row
    v-if="!hideCheckbox"
    class="align-center"
  >
    <v-col
      class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
      cols="12"
      sm="5"
    />
    <v-checkbox
      v-model="hasNoKopersNr"
      data-testid="has-no-kopersnr-checkbox"
      :disabled="!!selectedKopersNr"
      hide-details
      :label="$t('admin.person.noKopersNr')"
    />
  </v-row>

  <!-- KoPers.-Nr. -->
  <FormRow
    v-if="!hasNoKopersNr"
    :error-label="selectedKopersNrProps?.error || ''"
    :is-required="!hasNoKopersNr"
    :label="$t('person.kopersNr')"
    label-for-id="kopersnr-input"
    :no-top-margin="true"
  >
    <v-text-field
      id="kopersnr-input"
      ref="kopersnr-input"
      v-bind="selectedKopersNrProps"
      v-model="selectedKopersNr"
      autocomplete="off"
      clearable
      data-testid="kopersnr-input"
      density="compact"
      :disabled="props.isDisabled"
      :placeholder="$t('person.enterKopersNr')"
      :required="!hasNoKopersNr"
      variant="outlined"
    />
  </FormRow>
</template>
