<script setup lang="ts">
  import type { BaseFieldProps } from 'vee-validate';
  import { type Ref, ref, watch } from 'vue';
  import FormRow from '@/components/form/FormRow.vue';

  type Props = {
    hasNoKopersNr?: boolean;
    selectedKopersNr: string | undefined | null;
    selectedKopersNrProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    hideCheckbox?: boolean;
  };

  type Emits = {
    (event: 'update:hasNoKopersNr', value: boolean): void;
    (event: 'update:selectedKopersNr', value: string | undefined | null): void;
  };

  const props: Props = defineProps<Props>();
  const emits: Emits = defineEmits<Emits>();

  const hasNoKopersNr: Ref<boolean | undefined> = ref(props.hasNoKopersNr);
  const selectedKopersNr: Ref<string | undefined | null> = ref(props.selectedKopersNr);

  watch(hasNoKopersNr, (newValue: boolean | undefined, oldValue: boolean | undefined) => {
    if (newValue && newValue !== oldValue) {
      emits('update:hasNoKopersNr', newValue);
    }
  });

  watch(selectedKopersNr, (newValue: string | undefined | null) => {
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
    ></v-col>
    <v-checkbox
      data-testid="has-no-kopersnr-checkbox"
      :disabled="!!selectedKopersNr"
      hide-details
      :label="$t('admin.person.noKopersNr')"
      v-model="hasNoKopersNr"
    ></v-checkbox>
  </v-row>

  <!-- KoPers.-Nr. -->
  <FormRow
    v-if="!hasNoKopersNr"
    :errorLabel="selectedKopersNrProps?.error || ''"
    :isRequired="!hasNoKopersNr"
    :label="$t('person.kopersNr')"
    labelForId="kopersnr-input"
    :noTopMargin="true"
  >
    <v-text-field
      autocomplete="off"
      clearable
      data-testid="kopersnr-input"
      density="compact"
      id="kopersnr-input"
      ref="kopersnr-input"
      :placeholder="$t('person.enterKopersNr')"
      :required="!hasNoKopersNr"
      variant="outlined"
      v-bind="selectedKopersNrProps"
      v-model="selectedKopersNr"
    ></v-text-field>
  </FormRow>
</template>
