<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { type Ref } from 'vue'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import {
    useOrganisationStore,
    type OrganisationStore,
    CreateOrganisationBodyParamsTypEnum
  } from '@/stores/OrganisationStore'
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate'
  import { object, string } from 'yup'
  import { toTypedSchema } from '@vee-validate/yup'

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()
  const organisationStore: OrganisationStore = useOrganisationStore()

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedDienststellennummer: string().required(
        t('admin.schule.rules.dienststellennummer.required')
      ),
      selectedSchulname: string()
        .matches(/^[A-Za-z]*[A-Za-zÀ-ÖØ-öø-ÿ-' ]*$/, t('admin.schule.rules.schulname.matches'))
        .required(t('admin.schule.rules.schulname.required'))
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

  type SchuleCreationForm = {
    selectedSchulform: string
    selectedDienststellennummer: string
    selectedSchulname: string
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, resetForm } = useForm<SchuleCreationForm>({
    validationSchema
  })

  const [selectedSchulform]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedSchulform', vuetifyConfig)
  const [selectedSchulname, selectedSchulnameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedSchulname', vuetifyConfig)
  const [selectedDienststellennummer, selectedDienststellennummerProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedDienststellennummer', vuetifyConfig)

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    if (selectedDienststellennummer.value && selectedSchulname.value) {
      organisationStore.createOrganisation(
        selectedDienststellennummer.value,
        selectedSchulname.value,
        ' ',
        ' ',
        CreateOrganisationBodyParamsTypEnum.Schule
      )
    }
  })

  const handleCreateAnotherSchule = (): void => {
    organisationStore.createdOrganisation = null
    resetForm()
    router.push({ name: 'create-schule' })
  }

  function navigateBackToSchuleForm(): void {
    organisationStore.errorCode = ''
  }
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      :header="$t('admin.schule.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="t('admin.schule.schuleCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.schule.schuleCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.schule.backToCreateSchule')"
        :buttonAction="navigateBackToSchuleForm"
        buttonClass="primary"
      />
      <!-- Result template on success after submit (Present value in createdSchule and no errorCode)  -->
      <template v-if="organisationStore.createdOrganisation && !organisationStore.errorCode">
        <v-container class="new-rolle-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              {{ $t('admin.schule.schuleAddedSuccessfully') }}
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
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schulform') }}: </v-col>
            <v-col class="text-body"> {{ selectedSchulform }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.schule.dienststellennummer') }}:
            </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.kennung }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schulname') }}: </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.name }}</v-col>
          </v-row>
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
                data-testid="create-another-schule-button"
                @click="handleCreateAnotherSchule"
                :block="smAndDown"
              >
                {{ $t('admin.schule.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
      <!-- The form to create a new school (No created school yet and no errorCode) -->
      <template v-if="!organisationStore.createdOrganisation && !organisationStore.errorCode">
        <v-container class="new-schule">
          <v-form @submit.prevent="onSubmit">
            <v-row>
              <v-col
                class="d-none d-md-flex"
                cols="1"
              ></v-col>
              <v-col cols="auto">
                <v-icon
                  small
                  class="mr-2"
                  icon="mdi-alert-circle-outline"
                >
                </v-icon>
                <span class="subtitle-2">{{ $t('admin.mandatoryFieldsNotice') }}</span>
              </v-col>
            </v-row>
            <!-- Select school type. For now not bound to anything and just a UI element -->
            <v-row>
              <!-- This column will be hidden on xs screens and visible on sm and larger screens -->
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">1. {{ $t('admin.schule.assignSchulform') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col
                cols="4"
                class="d-none d-md-flex"
              ></v-col>
              <v-radio-group
                inline
                v-model="selectedSchulform"
              >
                <v-col
                  cols="12"
                  sm="4"
                  class="pb-0"
                >
                  <v-radio
                    :label="$t('admin.schule.publicSchule')"
                    :value="$t('admin.schule.publicSchule')"
                  ></v-radio>
                </v-col>
                <v-col
                  cols="12"
                  sm="4"
                  class="pt-0 pt-sm-3"
                >
                  <v-radio
                    :label="$t('admin.schule.ersatzschule')"
                    :value="$t('admin.schule.ersatzschule')"
                  ></v-radio>
                </v-col>
              </v-radio-group>
            </v-row>
            <!-- Enter service number -->
            <v-row>
              <!-- This column will be hidden on xs screens and visible on sm and larger screens -->
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">2. {{ $t('admin.schule.enterDienststellennummer') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col
                cols="3"
                class="d-none d-md-flex"
              ></v-col>
              <v-col
                cols="12"
                md="3"
                class="md-text-right py-0"
              >
                <label
                  class="text-body"
                  :error="selectedDienststellennummerProps['error']"
                  required="true"
                >
                  {{ $t('admin.schule.dienststellennummer') }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-text-field
                  data-testid="dienststellennummer-input"
                  v-bind="selectedDienststellennummerProps"
                  v-model="selectedDienststellennummer"
                  :placeholder="$t('admin.schule.dienststellennummer')"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
            <!-- select school name -->
            <v-row>
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">3. {{ $t('admin.schule.enterSchulname') }}</h3>
              </v-col>
            </v-row>
            <v-row>
              <!-- Spacer column -->
              <v-col
                cols="3"
                class="d-none d-md-flex"
              ></v-col>
              <v-col
                cols="12"
                md="3"
                class="md-text-right py-0"
              >
                <label
                  class="text-body"
                  :error="selectedSchulnameProps['error']"
                  required="true"
                >
                  {{ $t('admin.schule.schulname') }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-text-field
                  data-testid="schul-name-input"
                  v-bind="selectedSchulnameProps"
                  v-model="selectedSchulname"
                  :placeholder="$t('admin.schule.schulname')"
                  variant="outlined"
                  density="compact"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-divider
              class="border-opacity-100 rounded my-6"
              color="#E5EAEF"
              thickness="6"
            ></v-divider>
            <v-row justify="end">
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-btn
                  class="secondary"
                  data-testid="discard-schule-button"
                  :block="smAndDown"
                  >{{ $t('admin.schule.discard') }}</v-btn
                >
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-btn
                  type="submit"
                  class="primary button"
                  data-testid="create-schule-button"
                  :block="smAndDown"
                >
                  {{ $t('admin.schule.create') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style>
  @media (min-width: 960px) {
    .md-text-right {
      text-align: right;
    }
    .v-select {
      width: 310px;
    }

    .v-text-field {
      width: 310px;
    }
  }

  .select-item-text {
    color: #001e49;
  }
</style>
