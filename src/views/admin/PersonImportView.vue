<script setup lang="ts">
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useRouter, type Router } from 'vue-router';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useSchulen } from '@/composables/useSchulen';
  import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import type { TranslatedObject } from '@/types';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import { mixed, object, string } from 'yup';
  import { useI18n, type Composer } from 'vue-i18n';
  import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type ImportStore, useImportStore } from '@/stores/ImportStore';
  import { RollenArt } from '@/stores/RolleStore';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const importStore: ImportStore = useImportStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const allRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();
  const lernRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    if (!allRollen.value) {
      return [];
    }

    return allRollen.value.filter((rolle: TranslatedRolleWithAttrs) => {
      return rolle.rollenart === RollenArt.Lern;
    });
  });
  const schulen: ComputedRef<TranslatedObject[] | undefined> = useSchulen();
  const searchInputSchule: Ref<string> = ref('');

  let timerId: ReturnType<typeof setTimeout>;

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.import.rules.schule.required')),
      selectedRolle: string().required(t('admin.import.rules.rolle.required')),
      selectedFiles: mixed().required(t('admin.import.rules.files.required')),
    }),
  );

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type PersonImportForm = {
    selectedSchule: string;
    selectedRolle: string;
    selectedFiles: Array<File>;
  };

  const formContext: FormContext<PersonImportForm, PersonImportForm> = useForm<PersonImportForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedSchule', vuetifyConfig);

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', vuetifyConfig);

  const [selectedFiles, selectedFilesProps]: [
    Ref<Array<File> | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedFiles', vuetifyConfig);

  watch(selectedSchule, (newValue: string | undefined, oldValue: string | undefined) => {
    if (newValue && newValue !== oldValue) {
      // Fetch the roles after selecting the organization
      personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 30,
      });

      // Reset the selectedRolle field only if oldValue was not undefined
      if (oldValue !== undefined) {
        selectedRolle.value = undefined;
      }
    } else if (!newValue) {
      // If the organization is cleared, reset selectedRolle
      selectedRolle.value = undefined;
    }
  });

  watch(searchInputSchule, (newValue: string | undefined, _oldValue: string | undefined) => {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getAllOrganisationen({
        searchString: newValue,
        excludeTyp: [OrganisationsTyp.Klasse],
        limit: 30,
        systemrechte: ['PERSONEN_VERWALTEN', 'IMPORT_DURCHFUEHREN'],
      });
    }, 500);
  });

  function clearSelectedRolle(): void {
    selectedRolle.value = undefined;
  }

  function clearSelectedSchule(): void {
    selectedSchule.value = undefined;
  }

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  function uploadFile(): void {
    if (selectedSchule.value === undefined || selectedRolle.value === undefined || selectedFiles.value === undefined) {
      return;
    }

    importStore.uploadPersonenImportFile(
      selectedSchule.value as string,
      selectedRolle.value as string,
      selectedFiles.value[0] as File,
    );
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
    uploadFile();
  });

  onMounted(async () => {
    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['PERSONEN_VERWALTEN', 'IMPORT_DURCHFUEHREN'],
      limit: 30,
    });
    organisationStore.errorCode = '';
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="true"
      data-testid="person-import-card"
      :header="$t('admin.person.import')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Success template -->
      <template v-if="importStore.uploadResponse?.isValid">
        <v-container>
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              <span data-testid="person-import-success-text">
                {{ $t('admin.import.uploadedSuccessfully') }}
              </span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                color="#1EAE9C"
                icon="mdi-check-circle"
                small
              >
              </v-icon>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <!-- Upload form -->
      <FormWrapper
        v-if="!importStore.uploadResponse?.isValid"
        :createButtonLabel="$t('admin.import.uploadFile')"
        :discardButtonLabel="$t('nav.backToList')"
        id="person-import-form"
        :onDiscard="navigateToPersonTable"
        :onSubmit="onSubmit"
      >
        <!-- Schulauswahl -->
        <FormRow
          :errorLabel="selectedSchuleProps['error']"
          :isRequired="true"
          labelForId="schule-select"
          :label="$t('admin.schule.schule')"
        >
          <v-autocomplete
            autocomplete="off"
            clearable
            @click:clear="clearSelectedSchule"
            data-testid="schule-select"
            density="compact"
            id="schule-select"
            ref="schule-select"
            :items="schulen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.selectSchule')"
            required="true"
            variant="outlined"
            v-bind="selectedSchuleProps"
            v-model="selectedSchule"
            v-model:search="searchInputSchule"
          ></v-autocomplete>
        </FormRow>

        <!-- Rollenauswahl (currently limited to SuS) -->
        <FormRow
          :errorLabel="selectedRolleProps['error']"
          labelForId="rolle-select"
          :isRequired="true"
          :label="$t('admin.rolle.rolle')"
        >
          <v-autocomplete
            autocomplete="off"
            clearable
            @click:clear="clearSelectedRolle"
            data-testid="rolle-select"
            density="compact"
            id="rolle-select"
            ref="rolle-select"
            :items="lernRollen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.selectRolle')"
            required="true"
            variant="outlined"
            v-bind="selectedRolleProps"
            v-model="selectedRolle"
          ></v-autocomplete>
        </FormRow>

        <!-- File Upload -->
        <FormRow
          :errorLabel="''"
          :isRequired="true"
          labelForId="file-upload"
          :label="$t('admin.import.uploadFile')"
        >
          <v-file-input
            accept=".csv"
            :label="$t('admin.import.selectOrDropFile')"
            prepend-icon=""
            prepend-inner-icon="mdi-paperclip"
            variant="outlined"
            v-model="selectedFiles"
            v-bind="selectedFilesProps"
          ></v-file-input>
        </FormRow>
      </FormWrapper>
    </LayoutCard>
  </div>
</template>
