<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import type { BaseFieldProps } from 'vee-validate';
  import KopersInput from '@/components/admin/personen/KopersInput.vue';
  import { type Ref, type WritableComputedRef, computed, ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import FormRow from '@/components/form/FormRow.vue';

  useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    confirmUnsavedChangesAction: () => void;
    hasKopersRolle: boolean;
    showUnsavedChangesDialog?: boolean;
    selectedKopersNrPersonInfoProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKopersNrPersonInfo: string | null | undefined;
    selectedVornameProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedVorname: string | undefined;
    selectedFamiliennameProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedFamilienname: string | undefined;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'update:selectedKopersNrPersonInfo', value: string | undefined | null): void;
    (event: 'update:selectedVorname', value: string | undefined): void;
    (event: 'update:selectedFamilienname', value: string | undefined): void;
    (event: 'onShowDialogChange', value?: boolean): void;
  };
  const emits: Emits = defineEmits<Emits>();

  const selectedVorname: Ref<string | undefined> = ref(props.selectedVorname);
  const selectedFamilienname: Ref<string | undefined> = ref(props.selectedFamilienname);

  function handleSelectedKopersNrUpdate(value: string | undefined | null): void {
    emits('update:selectedKopersNrPersonInfo', value);
  }

  function handleSelectedVorname(value: string): void {
    emits('update:selectedVorname', value);
  }

  function handSelectedFamilienname(value: string): void {
    emits('update:selectedFamilienname', value);
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
    <v-row>
      <v-col
        md="5"
        class="pl-md-14"
      >
        <span class="text-body bold">
          <v-icon
            aria-hidden="true"
            class="mr-2"
            icon="mdi-alert-circle-outline"
            size="small"
          ></v-icon>
          {{ $t('admin.person.personalInfoChangeNotice') }}
        </span>
      </v-col>
      <v-col
        md="7"
        class="pr-md-14"
      >
        <!-- Vorname -->
        <FormRow
          class="mt-n4"
          :errorLabel="selectedVornameProps['error']"
          labelForId="vorname-input"
          :isRequired="true"
          :label="$t('person.firstName')"
        >
          <v-text-field
            clearable
            data-testid="vorname-input"
            density="compact"
            id="vorname-input"
            ref="vorname-input"
            :placeholder="$t('person.enterFirstName')"
            required="true"
            variant="outlined"
            v-bind="selectedVornameProps"
            v-model="selectedVorname"
            @update:modelValue="handleSelectedVorname"
          ></v-text-field>
        </FormRow>

        <!-- Nachname -->
        <FormRow
          class="mb-4"
          :errorLabel="selectedFamiliennameProps['error']"
          labelForId="familienname-input"
          :isRequired="true"
          :label="$t('person.lastName')"
        >
          <v-text-field
            clearable
            data-testid="familienname-input"
            density="compact"
            id="familienname-input"
            ref="familienname-input"
            :placeholder="$t('person.enterLastName')"
            required="true"
            variant="outlined"
            v-bind="selectedFamiliennameProps"
            v-model="selectedFamilienname"
            @update:modelValue="handSelectedFamilienname"
          ></v-text-field>
        </FormRow>
        <KopersInput
          v-if="hasKopersRolle"
          :hideCheckbox="true"
          :selectedKopersNr="selectedKopersNrPersonInfo"
          :selectedKopersNrProps="selectedKopersNrPersonInfoProps"
          @update:selectedKopersNr="handleSelectedKopersNrUpdate"
        ></KopersInput>
      </v-col>
    </v-row>
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
