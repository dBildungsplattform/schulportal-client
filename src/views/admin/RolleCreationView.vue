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

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
  const rolleStore: RolleStore = useRolleStore()

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()

  type TranslatedRollenArt = { value: RolleResponseRollenartEnum; title: string }
  const translatedRollenart: Ref<TranslatedRollenArt[]> = ref([])

  type TranslatedMerkmal = { value: RolleResponseMerkmaleEnum; title: string }
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([])

  const schulstrukturknoten: string[] = ['cef7240e-fd08-4961-927e-c9ea0c5a37c5']

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRollenName: string()
        .max(200, t('admin.rolle.rule.rolleNameLength'))
        .required(t('admin.rolle.rule.rolleNameRequired'))
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
  const { defineField, handleSubmit, resetForm } = useForm<RolleCreationForm>({
    validationSchema: validationSchema
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

  const isFormDirty: Ref<boolean> = ref(false)

  onBeforeRouteLeave(
    (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      if (isFormDirty.value) {
        // this.warningDialog = {
        //   isOpen: true,
        //   onConfirm: next,
        // };
        alert('You have unsaved changes. Are you sure you want to leave?')
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
      }
    }
  )

  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null
    selectedSchulstrukturknoten.value = ''
    selectedRollenArt.value = null
    selectedRollenName.value = ''
    selectedMerkmale.value = null
    router.push({ name: 'create-rolle' })
  }

  function handleDirtyModels(value: boolean): void {
    if (value) {
      isFormDirty.value = value
    }
  }

  function navigateBackToRolleForm(): void {
    rolleStore.errorCode = ''
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
  onMounted(() => {
    // Iterate over the enum values
    Object.values(RolleResponseRollenartEnum).forEach((enumValue: RolleResponseRollenartEnum) => {
      // Use the enum value to construct the i18n path
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.rollenarten.${enumValue}`
      // Push the mapped object into the array
      translatedRollenart.value.push({
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
      if (!isFormDirty.value) return
      event.preventDefault()
      /* Chrome requires returnValue to be set. */
      event.returnValue = ''
    })
  })
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1 class="text-center headline-1">{{ $t('admin.headline') }}</h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
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
          :createButtonLabel="$t('admin.rolle.create')"
          :discardButtonLabel="$t('admin.rolle.discard')"
          id="rolle-creation-form"
          :onDiscard="resetForm"
          :onSubmit="onSubmit"
          :resetForm="resetForm"
        >
          <!-- Schulstrukturknoten -->
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.rolle.schulstrukturknoten') }}</h3>
          </v-row>
          <InputRow
            :errorLabel="selectedSchulstrukturknotenProps['error']"
            :fieldProps="selectedSchulstrukturknotenProps"
            id="schulstruktur-knoten-select"
            @onDirtyModelValue="handleDirtyModels"
            :isRequired="true"
            :isSelect="true"
            :label="$t('admin.rolle.schulstrukturknoten')"
            :placeholder="$t('admin.rolle.selectSchulstrukturknoten')"
            :selectableItems="schulstrukturknoten"
            v-model="selectedSchulstrukturknoten"
          ></InputRow>

          <!-- Rollenart -->
          <v-row>
            <h3 class="headline-3">2. {{ $t('admin.rolle.rollenart') }}</h3>
          </v-row>
          <InputRow
            :errorLabel="selectedRollenArtProps['error']"
            :fieldProps="selectedRollenArtProps"
            id="rollenart-select"
            @onDirtyModelValue="handleDirtyModels"
            :isRequired="true"
            :isSelect="true"
            :label="$t('admin.rolle.rollenart')"
            :placeholder="$t('admin.rolle.selectRollenart')"
            :selectableItems="translatedRollenart"
            v-model="selectedRollenArt"
          ></InputRow>

          <template v-if="selectedRollenArt && selectedSchulstrukturknoten">
            <!-- Rollenname -->
            <v-row>
              <h3 class="headline-3">3. {{ $t('admin.rolle.rollenname') }}</h3>
            </v-row>
            <InputRow
              :errorLabel="selectedRollenNameProps['error']"
              :fieldProps="selectedRollenNameProps"
              id="rollenname-input"
              @onDirtyModelValue="handleDirtyModels"
              :isRequired="true"
              :label="$t('admin.rolle.rollenname')"
              :placeholder="$t('admin.rolle.enterRollenname')"
              v-model="selectedRollenName"
            ></InputRow>

            <!-- Merkmale -->
            <v-row>
              <h3 class="headline-3">4. {{ $t('admin.rolle.merkmale') }}</h3>
            </v-row>
            <InputRow
              :errorLabel="selectedMerkmaleProps['error']"
              :fieldProps="selectedMerkmaleProps"
              id="merkmale-select"
              @onDirtyModelValue="handleDirtyModels"
              :isSelect="true"
              :isMultiple="true"
              :label="$t('admin.rolle.merkmale')"
              :placeholder="$t('admin.rolle.selectMerkmale')"
              :selectableItems="translatedMerkmale"
              v-model="selectedMerkmale"
            ></InputRow>
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
              {{ $t('admin.rolle.schulstrukturknoten') }}:
            </v-col>
            <v-col class="text-body">
              {{ rolleStore.createdRolle.administeredBySchulstrukturknoten }}</v-col
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
