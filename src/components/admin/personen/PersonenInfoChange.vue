<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import type { BaseFieldProps } from 'vee-validate';
  import KopersInput from '@/components/admin/personen/KopersInput.vue';
  import { type Ref, type WritableComputedRef, computed } from 'vue';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    confirmUnsavedChangesAction: () => void;
    showUnsavedChangesDialog?: boolean;
    selectedKopersNrPersonInfoProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKopersNrPersonInfo: string | null | undefined;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'update:selectedKopersNrPersonInfo', value: string | undefined | null): void;
    (event: 'onShowDialogChange', value?: boolean): void;
  };
  const emits: Emits = defineEmits<Emits>();

  function handleSelectedKopersNrUpdate(value: string | undefined | null): void {
    emits('update:selectedKopersNrPersonInfo', value);
  }

  const showDialogValue: WritableComputedRef<boolean | undefined> = computed({
    get() {
      return props.showUnsavedChangesDialog;
    },
    set(newValue: boolean | undefined) {
      emits('onShowDialogChange', newValue);
    },
  });
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
  <!-- Warning dialog for unsaved changes -->
  <v-dialog
    data-testid="unsaved-changes-dialog"
    ref="unsaved-changes-dialog"
    persistent
    v-model="showDialogValue"
  >
    <LayoutCard :header="$t('unsavedChanges.title')">
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col>
              <p data-testid="unsaved-changes-warning-text">
                {{ $t('unsavedChanges.message') }}
              </p>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-row class="justify-center">
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              @click.stop="confirmUnsavedChangesAction"
              class="secondary button"
              data-testid="confirm-unsaved-changes-button"
              :block="mdAndDown"
            >
              {{ $t('yes') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              @click.stop="showDialogValue = false"
              class="primary button"
              data-testid="close-unsaved-changes-dialog-button"
              :block="mdAndDown"
            >
              {{ $t('no') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
