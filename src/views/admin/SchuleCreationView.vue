<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref, onMounted } from 'vue'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import {
    useOrganisationStore,
    type OrganisationStore,
    CreateOrganisationBodyParamsTypEnum
  } from '@/stores/OrganisationStore'

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()
  const organisationStore: OrganisationStore = useOrganisationStore()

  const selectedDienstellennummer: Ref<string | null> = ref(null)
  const selectedSchulname: Ref<string | null> = ref(null)
  const selectedAdministrativeSchulträger: Ref<string | null> = ref(null)

  const administrativeSchulträger: string[] = ['Eigenständig verwaltet']

  const submitForm = async (): Promise<void> => {
    if (
      selectedDienstellennummer.value &&
      selectedSchulname.value &&
      selectedAdministrativeSchulträger.value
    ) {
      await organisationStore.createOrganisation(
        selectedDienstellennummer.value,
        selectedSchulname.value,
        ' ',
        ' ',
        CreateOrganisationBodyParamsTypEnum.Schule
      )
    }
  }
  const handleCreateAnotherRolle = (): void => {
    organisationStore.createdOrganisation = null
    selectedDienstellennummer.value = null
    selectedSchulname.value = null
    selectedAdministrativeSchulträger.value = null
    router.push({ name: 'create-schule' })
  }

  function navigateBackToRolleForm(): void {
    organisationStore.errorCode = ''
  }
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
        :buttonAction="navigateBackToRolleForm"
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
            <v-col class="text-body bold text-right">
              {{ $t('admin.schule.dienstellennummer') }}:
            </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.kennung }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schulname') }}: </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.name }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.schule.adminstrativeSchulträger') }}:</v-col
            >
            <v-col class="text-body">{{ administrativeSchulträger.join(',') }} </v-col>
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
                @click="handleCreateAnotherRolle"
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
            <!-- Enter service number -->
            <v-row>
              <!-- This column will be hidden on xs screens and visible on sm and larger screens -->
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <h3 class="subtitle-2">1. {{ $t('admin.schule.enterDienstellennummer') }}</h3>
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
                <label class="text-body">
                  {{ $t('admin.schule.dienstellennummer') + '*' }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-text-field
                  data-testid="rollen-name-input"
                  v-model="selectedDienstellennummer"
                  :placeholder="$t('admin.schule.dienstellennummer')"
                  variant="outlined"
                  density="compact"
                  required
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
                <h3 class="subtitle-2">2. {{ $t('admin.schule.enterSchulname') }}</h3>
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
                <label class="text-body">
                  {{ $t('admin.schule.schulname') + '*' }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-text-field
                  data-testid="rollen-name-input"
                  v-model="selectedSchulname"
                  :placeholder="$t('admin.schule.schulname')"
                  variant="outlined"
                  density="compact"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Enter managing school authority  -->
            <v-row>
              <v-col
                cols="2"
                class="d-none d-md-flex"
              ></v-col>
              <v-col>
                <label class="subtitle-2"
                  >3. {{ $t('admin.schule.assignAdminstrativeSchulträger') }}</label
                >
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
                <label class="text-body">
                  {{ $t('admin.schule.adminstrativeSchulträger') + '*' }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-select
                  data-testid="schulstruktur-knoten-select"
                  :items="administrativeSchulträger"
                  v-model="selectedAdministrativeSchulträger"
                  variant="outlined"
                  density="compact"
                  single-line
                  :placeholder="$t('admin.schule.adminstrativeSchulträger')"
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
                  data-testid="create-rolle-button"
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
