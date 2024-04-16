<script setup lang="ts">
  import { ref, type ComputedRef, type Ref, computed } from 'vue';
  import { type Router, useRouter, onBeforeRouteLeave, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import { object, string } from 'yup';
  import {
    useOrganisationStore,
    type OrganisationStore,
    type OrganisationResponse,
CreateOrganisationBodyParamsTypEnum,
  } from '@/stores/OrganisationStore';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { DIN_91379A_EXT } from '@/utils/validation';
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.klasse.rules.schule.required')),
      selectedKlassenname: string()
        .matches(DIN_91379A_EXT, t('admin.klasse.rules.klassenname.matches'))
        .required(t('admin.klasse.rules.klassenname.required')),
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

  type KlasseCreationForm = {
    selectedSchule: string;
    selectedKlassenname: string;
  };

  type TranslatedObject = {
    value: string;
    title: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<KlasseCreationForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [Ref<string>, Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>] =
    defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return personenkontextStore.filteredOrganisationen?.moeglicheSsks
      .slice(0, 25)
      .map((org: OrganisationResponse) => ({
        value: org.id,
        title: `${org.kennung} (${org.name})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  function isFormDirty(): boolean {
    return (
      isFieldDirty('selectedSchule') ||
      isFieldDirty('selectedKlassenname')
    );
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  async function navigateBackToKlasseForm(): Promise<void> {
    await router.push({ name: 'create-klasse' });
    organisationStore.errorCode = '';
  }

  async function navigateToKlasseManagement(): Promise<void> {
    await router.push({ name: 'klasse-management' });
    organisationStore.createdOrganisation = null;
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    await organisationStore.createOrganisation(
      '',
      selectedKlassenname.value,
      '',
      '',
      // CreateOrganisationBodyParamsTypEnum.Klasse,
      CreateOrganisationBodyParamsTypEnum.Schule,
      '', // traegerschaft
      selectedSchule.value, // administriertVon
      selectedSchule.value, // zugehoerigZu
    );
    resetForm();
  });
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      @onCloseClicked="navigateToKlasseManagement"
      :header="$t('admin.klasse.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="$t('admin.klasse.klasseCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.klasse.klasseCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.klasse.backToCreateKlasse')"
        :buttonAction="navigateBackToKlasseForm"
      />

      <!-- The form to create a new Klasse -->
      <template v-if="!organisationStore.createdOrganisation && !organisationStore.errorCode">
        <FormWrapper
          :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
          :createButtonLabel="$t('admin.klasse.create')"
          :discardButtonLabel="$t('admin.klasse.discard')"
          id="klasse-creation-form"
          :onDiscard="navigateToKlasseManagement"
          @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
        >
          <!-- Organisationsebene -->
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.organisation.selectOrganisation') }}</h3>
          </v-row>
          <FormRow
            :errorLabel="selectedSchuleProps['error']"
            labelForId="schule-select"
            :isRequired="true"
            :label="$t('admin.organisation.organisation')"
          >
            <v-select
              clearable
              data-testid="schule-select"
              density="compact"
              id="schule-select"
              :items="schulen"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.organisation.selectOrganisation')"
              required="true"
              variant="outlined"
              v-bind="selectedSchuleProps"
              v-model="selectedSchule"
              :no-data-text="$t('noDataFound')"
            ></v-select>
          </FormRow>

          <!-- Klassenname -->
          <v-row>
            <v-col>
              <h3 class="headline-3">2. {{ $t('admin.klasse.enterKlassenname') }}</h3>
            </v-col>
          </v-row>
          <FormRow
            :errorLabel="selectedKlassennameProps['error']"
            labelForId="klassenname-input"
            :isRequired="true"
            :label="$t('admin.klasse.klassenname')"
          >
            <v-text-field
              data-testid="klassenname-input"
              v-bind="selectedKlassennameProps"
              v-model="selectedKlassenname"
              :placeholder="$t('admin.klasse.klassenname')"
              variant="outlined"
              density="compact"
              required
            ></v-text-field>
          </FormRow>
        </FormWrapper>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>