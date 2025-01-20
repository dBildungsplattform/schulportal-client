<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import type { TranslatedObject } from '@/types';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { object, string } from 'yup';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';

  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const canCommit: Ref<boolean> = ref(false);

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  type Props = {
    errorCode: string;
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    isLoading: boolean;
    isDialogVisible: boolean;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const showModifyRolleDialog: Ref<boolean> = ref(props.isDialogVisible);

  // Define the form validation schema for the Personenkontext
  export type ZuordnungCreationForm = {
    selectedRolle: string;
    selectedOrganisation: string;
  };

  export type PersonenkontextFieldDefinitions = {
    selectedRolle: Ref<string | undefined>;
    selectedRolleProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
    selectedOrganisation: Ref<string | undefined>;
    selectedOrganisationProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  };

  const validationSchema = (): TypedSchema<ZuordnungCreationForm> => {
    return toTypedSchema(
      object({
        selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
        selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
      }),
    );
  };

  const getVuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const formContext: ReturnType<typeof useForm> = useForm<ZuordnungCreationForm>({
    validationSchema,
  });

  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', getVuetifyConfig);

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', getVuetifyConfig);

  async function closeModifyRolleDeleteDialog(): Promise<void> {
    showModifyRolleDialog.value = false;
    emit('update:isDialogVisible', false);
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    }
  }
</script>

<template>
  <v-dialog
    v-model="showModifyRolleDialog"
    persistent
  >
    <LayoutCard
      :closable="true"
      :header="$t('admin.rolle.edit')"
      @onCloseClicked="closeModifyRolleDeleteDialog()"
    >
      <v-container>
        <PersonenkontextCreate
          ref="personenkontext-create"
          :showHeadline="false"
          :organisationen="organisationen"
          :rollen="rollen"
          :selectedOrganisationProps="selectedOrganisationProps"
          :selectedRolleProps="selectedRolleProps"
          v-model:selectedOrganisation="selectedOrganisation"
          v-model:selectedRolle="selectedRolle"
          @update:selectedOrganisation="(value?: string) => (selectedOrganisation = value)"
          @update:selectedRolle="(value?: string) => (selectedRolle = value)"
          @update:canCommit="canCommit = $event"
          @fieldReset="handleFieldReset"
        />
      </v-container>
      <v-card-actions class="justify-center">
        <v-row class="py-3 px-2 justify-center">
          <v-spacer class="hidden-sm-and-down"></v-spacer>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @Click="closeModifyRolleDeleteDialog"
              data-testid="rolle-modify-discard-button"
              >{{ $t('cancel') }}</v-btn
            >
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              :disabled="!canCommit || personenkontextStore.loading"
              class="primary"
              data-testid="rolle-modify-submit-button"
              type="submit"
              >{{ $t('person.addZuordnung') }}</v-btn
            >
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
