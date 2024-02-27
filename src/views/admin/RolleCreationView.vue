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
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
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
  const translatedRollenart: Ref<TranslatedRollenArt[]> = ref([])

  type TranslatedMerkmal = { value: RolleResponseMerkmaleEnum; title: string }
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([])

  const selectedSchulstrukturKnoten: Ref<string | null> = ref(null)
  const selectedRollenName: Ref<string | null> = ref(null)
  const selectedRollenArt: Ref<CreateRolleBodyParamsRollenartEnum | null> = ref(null)
  const selectedMerkmale: Ref<CreateRolleBodyParamsMerkmaleEnum[] | null> = ref(null)

  // Rule for validating the rolle name. Maybe enhance a validation framework like VeeValidate instead?
  const rolleNameRules: Array<(v: string | null | undefined) => boolean | string> = [
    (v: string | null | undefined): boolean | string => {
      // First, check for null or undefined values and return a required field message.
      if (v == null || v.trim().length === 0) {
        return t('admin.rolle.rule.rolleNameRequired')
      }
      // Next, check for the length constraint.
      if (v.length > 200) {
        return t('admin.rolle.rule.rolleNameLength')
      }
      // If none of the above conditions are met, the input is valid.
      return true
    }
  ]
  const submitForm = async (): Promise<void> => {
    if (selectedRollenName.value && selectedSchulstrukturKnoten.value && selectedRollenArt.value) {
      const merkmaleToSubmit: CreateRolleBodyParamsMerkmaleEnum[] =
        selectedMerkmale.value?.map((m: CreateRolleBodyParamsMerkmaleEnum) => m) || []
      await rolleStore.createRolle(
        selectedRollenName.value,
        selectedSchulstrukturKnoten.value,
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
  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null
    organisationStore.currentOrganisation = null
    selectedSchulstrukturKnoten.value = null
    selectedRollenArt.value = null
    selectedRollenName.value = null
    selectedMerkmale.value = null
    router.push({ name: 'create-rolle' })
  }

  function navigateBackToRolleForm(): void {
    rolleStore.errorCode = ''
    router.push({ name: 'create-rolle' })
  }
  function navigateToRolleManagement(): void {
    rolleStore.createdRolle = null
    selectedSchulstrukturKnoten.value = null
    selectedRollenArt.value = null
    selectedRollenName.value = null
    selectedMerkmale.value = null
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
      <!-- Result template on success after submit (Present value in createdRolle and no errorCode)  -->
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
      <!-- The form to create a new role (No created role yet and no errorCode) -->
      <template v-if="!rolleStore.createdRolle && !rolleStore.errorCode">
        <v-container class="new-rolle">
          <v-form @submit.prevent="submitForm">
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
            <!-- select school structure node -->
            <v-row>
              <!-- This column will be hidden on xs screens and visible on sm and larger screens -->
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">
                  1. {{ $t('admin.schulstrukturknoten.assignSchulstrukturknoten') }}
                </h3>
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
                  for="schulstrukturknoten-select"
                  required="true"
                >
                  {{ $t('admin.schulstrukturknoten.schulstrukturknoten') }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-select
                  data-testid="schulstrukturknoten-select"
                  id="schulstrukturknoten-select"
                  :items="schulstrukturknoten"
                  v-model="selectedSchulstrukturKnoten"
                  item-value="value"
                  item-text="title"
                  variant="outlined"
                  density="compact"
                  single-line
                  :placeholder="$t('admin.schulstrukturknoten.selectSchulstrukturknoten')"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      class="select-item-text"
                    ></v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            <!-- select Role type -->
            <v-row>
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">2. {{ $t('admin.rolle.assignRollenart') }}</h3>
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
                  for="rollenart-select"
                  required="true"
                >
                  {{ $t('admin.rolle.rollenart') }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-select
                  data-testid="rollenart-select"
                  id="rollenart-select"
                  :items="translatedRollenart"
                  v-model="selectedRollenArt"
                  item-value="value"
                  item-text="title"
                  :placeholder="$t('admin.rolle.selectRollenart')"
                  variant="outlined"
                  density="compact"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      class="select-item-text"
                    ></v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Enter Role name -->
            <template v-if="selectedRollenArt && selectedSchulstrukturKnoten">
              <v-row>
                <v-col
                  cols="2"
                  class="d-none d-md-flex"
                ></v-col>
                <v-col>
                  <label class="subtitle-2">3. {{ $t('admin.rolle.enterRollenname') }}</label>
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
                    for="rollenname-input"
                    required="true"
                  >
                    {{ $t('admin.rolle.rollenname') }}
                  </label></v-col
                >
                <v-col
                  cols="12"
                  md="auto"
                  class="py-0"
                >
                  <v-text-field
                    clearable
                    data-testid="rollenname-input"
                    id="rollenname-input"
                    v-model="selectedRollenName"
                    :placeholder="$t('admin.rolle.enterRollenname')"
                    variant="outlined"
                    density="compact"
                    :rules="rolleNameRules"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
              <!-- select characteristics -->
              <v-row>
                <v-col
                  class="d-none d-md-flex"
                  cols="2"
                ></v-col>
                <v-col>
                  <label class="subtitle-2">4. {{ $t('admin.rolle.assignMerkmale') }}</label>
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
                    for="merkmale-select"
                  >
                    {{ $t('admin.rolle.merkmale') }}
                  </label></v-col
                >
                <v-col
                  cols="12"
                  md="auto"
                  class="py-0"
                >
                  <v-select
                    data-testid="merkmale-select"
                    id="merkmale-select"
                    :items="translatedMerkmale"
                    v-model="selectedMerkmale"
                    item-value="value"
                    item-text="title"
                    :placeholder="$t('admin.rolle.selectMerkmale')"
                    variant="outlined"
                    density="compact"
                    multiple
                    clearable
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.title"
                        class="select-item-text"
                      ></v-list-item>
                    </template>
                  </v-select>
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
                    data-testid="discard-rolle-button"
                    :block="smAndDown"
                    @click="navigateToRolleManagement"
                    >{{ $t('admin.rolle.discard') }}</v-btn
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
                    data-testid="create-rolle-button"
                    :block="smAndDown"
                  >
                    {{ $t('admin.rolle.create') }}
                  </v-btn>
                </v-col>
              </v-row>
            </template>
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