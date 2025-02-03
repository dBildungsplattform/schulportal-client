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
  import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';
  import type { RollenArt, RollenMerkmal } from '@/stores/RolleStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const personStore: PersonStore = usePersonStore();

  const progress: Ref<number> = ref<number>(0);
  const canCommit: Ref<boolean> = ref(false);
  const successMessage: Ref<string> = ref<string>('');

  type Props = {
    errorCode: string;
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    isLoading: boolean;
    isDialogVisible: boolean;
    personIDs: string[];
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
    (event: 'update:getUebersichten'): void;
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
    progress.value = 0;
    showModifyRolleDialog.value = false;
    emit('update:isDialogVisible', false);
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    }
  }

  // Creates a new Personenkontext for an array of Person IDs. For each processed ID the progress bar will increment according to the total number of items to process
  async function handleModifyRolle(personIDs: string[]): Promise<void> {
    const organisation: Organisation | undefined = personenkontextStore.workflowStepResponse?.organisations.find(
      (orga: Organisation) => orga.id === selectedOrganisation.value,
    );

    if (organisation) {
      const baseZuordnung: Zuordnung = {
        sskId: organisation.id,
        rolleId: selectedRolle.value ?? '',
        klasse: undefined,
        sskDstNr: organisation.kennung ?? '',
        sskName: organisation.name,
        rolle:
          props.rollen?.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolle.value)?.title || '',
        rollenArt: props.rollen?.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolle.value)
          ?.rollenart as RollenArt,
        administriertVon: organisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
        befristung: undefined,
      };

      successMessage.value = '';
      progress.value = 0; // Reset progress bar to 0 at the start

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i] as string;

        const newZuordnung: Zuordnung = { ...baseZuordnung };

        // Fetch the Zuordnungen for this specific user (To send alongside the new one)
        await personStore.getPersonenuebersichtById(personId);

        // Extract the current Zuordnungen for this person
        const currentZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen || [];

        // Combine the new Zuordnung with the existing ones
        const combinedZuordnungen: Zuordnung[] = [...currentZuordnungen, newZuordnung];

        // Await the processing of each ID
        await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, personId);

        // Update progress for each item processed
        progress.value = Math.ceil(((i + 1) / personIDs.length) * 100);

        // Only show success message after all items have been processed
        if (i === personIDs.length - 1) {
          successMessage.value = t('admin.rolle.rollenAssignedSuccessfully');
        }
      }
    }

    // Send an event to PersonManagement to fetch the updated Uebersichte (otherwise we will receive a version error from the backend when trying to access the GÜ)
    emit('update:getUebersichten');

    // If the Admin assigns a person a false Rolle like to Schuladmin a Lehrkraft Rolle we want to ignore the error because it's a bulk operation
    if (personenkontextStore.errorCode === 'INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN') {
      personenkontextStore.errorCode = '';
    }
  }
</script>

<template>
  <v-dialog
    v-model="showModifyRolleDialog"
    persistent
  >
    <LayoutCard
      data-testid="layout-card"
      :closable="false"
      :header="$t('admin.rolle.assignRolle')"
      @onCloseClicked="closeModifyRolleDeleteDialog()"
    >
      <v-container>
        <!-- Form Component -->
        <PersonenkontextCreate
          v-if="progress === 0"
          ref="personenkontext-create"
          :showHeadline="false"
          :isModifyRolleDialog="showModifyRolleDialog"
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

        <!-- Progress Bar -->
        <div
          v-if="progress > 0"
          class="mt-4"
        >
          <v-container v-if="successMessage">
            <v-row justify="center">
              <v-col cols="auto">
                <v-icon
                  small
                  color="#1EAE9C"
                  icon="mdi-check-circle"
                ></v-icon>
              </v-col>
            </v-row>
            <p class="mt-2 text-center">
              {{ successMessage }}
            </p>
          </v-container>
          <v-row
            v-if="progress < 100"
            align="center"
            justify="center"
          >
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                class="mr-2"
                icon="mdi-alert-circle-outline"
                size="small"
              ></v-icon>
              <span class="subtitle-2">
                {{ $t('admin.doNotCloseBrowserNotice') }}
              </span>
            </v-col>
          </v-row>
          <v-progress-linear
            class="mt-5"
            :modelValue="progress"
            color="primary"
            height="25"
          >
            <template v-slot:default="{ value }">
              <strong class="text-white">{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
        </div>
      </v-container>

      <v-card-actions class="justify-center">
        <v-row
          v-if="progress === 0"
          class="py-3 px-2 justify-center"
        >
          <v-spacer class="hidden-sm-and-down"></v-spacer>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @click="closeModifyRolleDeleteDialog"
              data-testid="rolle-modify-discard-button"
            >
              {{ $t('cancel') }}
            </v-btn>
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
              @click="handleModifyRolle(props.personIDs)"
              data-testid="rolle-modify-submit-button"
              type="submit"
            >
              {{ $t('admin.rolle.assignRolle') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row
          v-if="progress === 100"
          class="py-3 px-2 justify-center"
        >
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="primary"
              @click="closeModifyRolleDeleteDialog"
              data-testid="rolle-modify-close-button"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
