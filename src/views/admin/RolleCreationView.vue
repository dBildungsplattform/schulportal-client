<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref, onMounted, computed, type ComputedRef } from 'vue'
  import {
    useRolleStore,
    type RolleStore,
    RolleResponseMerkmaleEnum,
    RolleResponseRollenartEnum,
    CreateRolleBodyParamsRollenartEnum,
    CreateRolleBodyParamsMerkmaleEnum
  } from '@/stores/RolleStore'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import {
    onBeforeRouteLeave,
    type Router,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized
  } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { type BaseFieldProps, type TypedSchema, useForm } from 'vee-validate'
  import { object, string } from 'yup'
  import { toTypedSchema } from '@vee-validate/yup'
  import CreationForm from '@/components/form/CreationForm.vue'
  import InputRow from '@/components/form/InputRow.vue'
  import {
    useOrganisationStore,
    type OrganisationStore,
    type Organisation
  } from '@/stores/OrganisationStore'

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
  const rolleStore: RolleStore = useRolleStore()
  const organisationStore: OrganisationStore = useOrganisationStore()

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()

  type TranslatedRollenArt = { value: RolleResponseRollenartEnum; title: string }
  const translatedRollenarten: Ref<TranslatedRollenArt[]> = ref([])

  type TranslatedMerkmal = { value: RolleResponseMerkmaleEnum; title: string }
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([])

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRollenArt: string().required(t('admin.rolle.rules.rollenart.required')),
      selectedRollenName: string()
        .max(200, t('admin.rolle.rules.rollenname.length'))
        .required(t('admin.rolle.rules.rollenname.required')),
      selectedSchulstrukturknoten: string().required(t('admin.schulstrukturknoten.rules.required'))
    })
  )

  const vuetifyConfig = (state: {
    errors: Array<string>
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors
    }
  })

  type RolleCreationForm = {
    selectedSchulstrukturknoten: string
    selectedRollenArt: CreateRolleBodyParamsRollenartEnum
    selectedRollenName: string
    selectedMerkmale: CreateRolleBodyParamsMerkmaleEnum[]
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<RolleCreationForm>({
    validationSchema
  })

  const [selectedSchulstrukturknoten, selectedSchulstrukturknotenProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedSchulstrukturknoten', vuetifyConfig)

  const [selectedRollenArt, selectedRollenArtProps]: [
    Ref<CreateRolleBodyParamsRollenartEnum | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedRollenArt', vuetifyConfig)

  const [selectedRollenName, selectedRollenNameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedRollenName', vuetifyConfig)

  const [selectedMerkmale, selectedMerkmaleProps]: [
    Ref<CreateRolleBodyParamsMerkmaleEnum[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedMerkmale', vuetifyConfig)

  function isFormDirty(): boolean {
    return (
      isFieldDirty('selectedSchulstrukturknoten') ||
      isFieldDirty('selectedRollenArt') ||
      isFieldDirty('selectedRollenName') ||
      isFieldDirty('selectedMerkmale')
    )
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false)
  let blockedNext: () => void = () => {}

  onBeforeRouteLeave(
    (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      if (isFormDirty()) {
        showUnsavedChangesDialog.value = true
        blockedNext = next
      } else {
        next()
      }
    }
  )

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(
    async () => {
      if (
        selectedRollenName.value &&
        selectedSchulstrukturknoten.value &&
        selectedRollenArt.value
      ) {
        const merkmaleToSubmit: CreateRolleBodyParamsMerkmaleEnum[] =
          selectedMerkmale.value?.map((m: CreateRolleBodyParamsMerkmaleEnum) => m) || []
        await rolleStore.createRolle(
          selectedRollenName.value,
          selectedSchulstrukturknoten.value,
          selectedRollenArt.value,
          merkmaleToSubmit
        )

        if (rolleStore.createdRolle) {
          await organisationStore.getOrganisationById(
            rolleStore.createdRolle.administeredBySchulstrukturknoten
          )
        }
      }
    }
  )

  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null
    resetForm()
    router.push({ name: 'create-rolle' })
  }

  function handleConfirmUnsavedChanges(): void {
    blockedNext()
  }

  function navigateBackToRolleForm(): void {
    rolleStore.errorCode = ''
    router.push({ name: 'create-rolle' })
  }

  function navigateToRolleManagement(): void {
    rolleStore.createdRolle = null
    router.push({ name: 'rolle-management' })
  }

  const translatedCreatedRolleMerkmale: ComputedRef<string> = computed(() => {
    // Check if `createdRolle.merkmale` exists and is an array
    if (!rolleStore.createdRolle?.merkmale || !Array.isArray(rolleStore.createdRolle.merkmale)) {
      return ''
    }

    return rolleStore.createdRolle.merkmale
      .map((merkmalKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`)
      })
      .join(', ')
  })

  const schulstrukturknoten: ComputedRef<
    {
      value: string
      title: string
    }[]
  > = computed(() =>
    organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      title: `${org.kennung} (${org.name})`
    }))
  )

  onMounted(async () => {
    await organisationStore.getAllOrganisationen()

    // Iterate over the enum values
    Object.values(RolleResponseRollenartEnum).forEach((enumValue: RolleResponseRollenartEnum) => {
      // Use the enum value to construct the i18n path
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.rollenarten.${enumValue}`
      // Push the mapped object into the array
      translatedRollenarten.value.push({
        value: enumValue, // Keep the enum value for internal use
        title: t(i18nPath) // Get the localized title
      })
    })

    Object.values(RolleResponseMerkmaleEnum).forEach((enumValue: RolleResponseMerkmaleEnum) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.merkmale.${enumValue}`
      translatedMerkmale.value.push({
        value: enumValue,
        title: t(i18nPath)
      })
    })

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', (event: BeforeUnloadEvent) => {
      if (!isFormDirty()) return
      event.preventDefault()
      /* Chrome requires returnValue to be set. */
      event.returnValue = ''
    })
  })
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      @onCloseClicked="navigateToRolleManagement"
      :header="$t('admin.rolle.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!rolleStore.errorCode"
        :title="t('admin.rolle.rolleCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.rolle.rolleCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.rolle.backToCreateRolle')"
        :buttonAction="navigateBackToRolleForm"
        buttonClass="primary"
      />

      <!-- The form to create a new Rolle -->
      <template v-if="!rolleStore.createdRolle && !rolleStore.errorCode">
        <CreationForm
          :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
          :createButtonLabel="$t('admin.rolle.create')"
          :discardButtonLabel="$t('admin.rolle.discard')"
          id="rolle-creation-form"
          :onDiscard="navigateToRolleManagement"
          @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          :resetForm="resetForm"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
        >
          <!-- Schulstrukturknoten -->
          <v-row>
            <h3 class="headline-3">
              1. {{ $t('admin.schulstrukturknoten.assignSchulstrukturknoten') }}
            </h3>
          </v-row>
          <InputRow
            :errorLabel="selectedSchulstrukturknotenProps['error']"
            labelForId="schulstrukturknoten-select"
            :isRequired="true"
            :label="$t('admin.schulstrukturknoten.schulstrukturknoten')"
          >
            <v-select
              clearable
              data-testid="schulstrukturknoten-select"
              density="compact"
              id="schulstrukturknoten-select"
              :items="schulstrukturknoten"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.schulstrukturknoten.selectSchulstrukturknoten')"
              required="true"
              variant="outlined"
              v-bind="selectedSchulstrukturknotenProps"
              v-model="selectedSchulstrukturknoten"
            ></v-select>
          </InputRow>

          <!-- Rollenart -->
          <v-row>
            <h3 class="headline-3">2. {{ $t('admin.rolle.assignRollenart') }}</h3>
          </v-row>
          <InputRow
            :errorLabel="selectedRollenArtProps['error']"
            labelForId="rollenart-select"
            :isRequired="true"
            :label="$t('admin.rolle.rollenart')"
          >
            <v-select
              clearable
              data-testid="rollenart-select"
              density="compact"
              id="rollenart-select"
              :items="translatedRollenarten"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.rolle.selectRollenart')"
              required="true"
              variant="outlined"
              v-bind="selectedRollenArtProps"
              v-model="selectedRollenArt"
            ></v-select>
          </InputRow>

          <template v-if="selectedRollenArt && selectedSchulstrukturknoten">
            <!-- Rollenname -->
            <v-row>
              <h3 class="headline-3">3. {{ $t('admin.rolle.enterRollenname') }}</h3>
            </v-row>
            <InputRow
              :errorLabel="selectedRollenNameProps['error']"
              labelForId="rollenname-input"
              :isRequired="true"
              :label="$t('admin.rolle.rollenname')"
            >
              <v-text-field
                clearable
                data-testid="rollenname-input"
                density="compact"
                id="rollenname-input"
                :placeholder="$t('admin.rolle.enterRollenname')"
                required="true"
                variant="outlined"
                v-bind="selectedRollenNameProps"
                v-model="selectedRollenName"
              ></v-text-field>
            </InputRow>

            <!-- Merkmale -->
            <v-row>
              <h3 class="headline-3">4. {{ $t('admin.rolle.assignMerkmale') }}</h3>
            </v-row>
            <InputRow
              :errorLabel="selectedMerkmaleProps['error']"
              labelForId="merkmale-select"
              :label="$t('admin.rolle.merkmale')"
            >
              <v-select
                chips
                clearable
                data-testid="merkmale-select"
                density="compact"
                id="merkmale-select"
                :items="translatedMerkmale"
                item-value="value"
                item-text="title"
                multiple
                :placeholder="$t('admin.rolle.selectMerkmale')"
                variant="outlined"
                v-bind="selectedMerkmaleProps"
                v-model="selectedMerkmale"
              ></v-select>
            </InputRow>
          </template>
        </CreationForm>
      </template>

      <!-- Result template on success after submit  -->
      <template v-if="rolleStore.createdRolle && !rolleStore.errorCode">
        <v-container class="new-rolle-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              {{ $t('admin.rolle.rolleAddedSuccessfully') }}
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-icon
                small
                color="#1EAE9C"
                icon="mdi-check-circle"
              >
              </v-icon>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col
              class="subtitle-2"
              cols="auto"
            >
              {{ $t('admin.followingDataCreated') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.schulstrukturknoten.schulstrukturknoten') }}:
            </v-col>
            <v-col class="text-body">
              {{
                `${organisationStore.currentOrganisation?.kennung} (${organisationStore.currentOrganisation?.name})`
              }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenart') }}: </v-col>
            <v-col class="text-body">
              {{
                $t(
                  `admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.createdRolle.rollenart}`
                )
              }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenname') }}:</v-col>
            <v-col class="text-body">{{ rolleStore.createdRolle.name }} </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.merkmale') }}:</v-col>
            <v-col class="text-body"> {{ translatedCreatedRolleMerkmale }}</v-col></v-row
          >
          <v-divider
            class="border-opacity-100 rounded my-6"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
          <v-row justify="end">
            <v-col
              cols="12"
              md="auto"
            >
              <v-btn
                class="secondary"
                data-testid="back-to-list-button"
                :block="smAndDown"
                @click="navigateToRolleManagement"
                >{{ $t('nav.backToList') }}</v-btn
              >
            </v-col>
            <v-col
              cols="12"
              md="auto"
            >
              <v-btn
                class="primary button"
                data-testid="create-another-rolle-button"
                @click="handleCreateAnotherRolle"
                :block="smAndDown"
              >
                {{ $t('admin.rolle.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
