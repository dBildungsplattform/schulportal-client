<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { ref, type Ref } from 'vue'
  import { useRolleStore, type RolleStore } from '@/stores/RolleStore'
  import type { CreateRolleBodyParamsRollenartEnum } from '@/api-client/generated'
  import { useI18n, type Composer } from 'vue-i18n'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()

  const { t }: Composer = useI18n({ useScope: 'global' })
  const router: Router = useRouter()

  type Selection = string | null
  type SelectionArray = string[] | null

  const selectedSchulstrukturKnoten: Ref<Selection> = ref(null)
  const selectedRollenArt: Ref<Selection> = ref(null)
  const selectedRollenName: Ref<Selection> = ref(null)
  const selectedMerkmale: Ref<SelectionArray> = ref(null)

  const schulstrukturKnoten: string[] = ['cef7240e-fd08-4961-927e-c9ea0c5a37c5']
  const rollenArten: string[] = ['Lern', 'Lehr', 'Extern', 'Orgadmin', 'Leit', 'Sysadmin']
  const merkmale: string[] = ['BEFRISTUNG_PFLICHT', 'KOPERS_PFLICHT']

  const rolleStore: RolleStore = useRolleStore()

  const submitForm = async (): Promise<void> => {
    if (selectedRollenName.value && selectedSchulstrukturKnoten.value && selectedRollenArt.value) {
      await rolleStore.createRolle(
        selectedRollenName.value,
        selectedSchulstrukturKnoten.value,
        selectedRollenArt.value as keyof typeof CreateRolleBodyParamsRollenartEnum,
        selectedMerkmale.value || []
      )
    }
  }

  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null
    selectedSchulstrukturKnoten.value = null
    selectedRollenArt.value = null
    selectedRollenName.value = null
    selectedMerkmale.value = null
    router.push({ name: 'create-rolle' })
  }
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
        :buttonText="$t('admin.user.backToList')"
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
              >
                mdi-check-circle
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
              {{ $t('admin.rolle.schulstrukurknoten') }}:
            </v-col>
            <v-col class="text-body">
              {{ rolleStore.createdRolle.administeredBySchulstrukturknoten }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenart') }}: </v-col>
            <v-col class="text-body"> {{ rolleStore.createdRolle.rollenart }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenname') }}:</v-col>
            <v-col class="text-body"> {{ rolleStore.createdRolle.name }} </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.merkmale') }}:</v-col>
            <v-col class="text-body"> {{ rolleStore.createdRolle.merkmale }}</v-col></v-row
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
                >
                  mdi-alert-circle-outline
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
                <h3 class="subtitle-2">1. {{ $t('admin.rolle.selectSchulstrukturKnoten') }}</h3>
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
                  {{ $t('admin.rolle.selectSchulstrukturKnoten') + '*' }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-select
                  :items="schulstrukturKnoten"
                  v-model="selectedSchulstrukturKnoten"
                  variant="outlined"
                  density="compact"
                  single-line
                  :placeholder="$t('admin.rolle.selectSchulstrukturKnoten')"
                  :bg-color="selectedSchulstrukturKnoten ? '#4dc7bc' : ''"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      style="color: #001e49"
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
                <h3 class="subtitle-2">2. {{ $t('admin.rolle.selectRollenart') }}</h3>
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
                  {{ $t('admin.rolle.selectRollenart') + '*' }}
                </label></v-col
              >
              <v-col
                cols="12"
                md="auto"
                class="py-0"
              >
                <v-select
                  :items="rollenArten"
                  v-model="selectedRollenArt"
                  :placeholder="$t('admin.rolle.selectRollenart')"
                  variant="outlined"
                  density="compact"
                  :bg-color="selectedRollenArt ? '#4dc7bc' : ''"
                  clearable
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :title="item.title"
                      style="color: #001e49"
                    ></v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Enter Role name -->
            <template v-if="selectedRollenArt">
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
                  <label class="text-body">
                    {{ $t('admin.rolle.enterRollenname') + '*' }}
                  </label></v-col
                >
                <v-col
                  cols="12"
                  md="auto"
                  class="py-0"
                >
                  <v-text-field
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
                  <label class="subtitle-2">4. {{ $t('admin.rolle.selectMerkmale') }}</label>
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
                  <h3 class="text-body">
                    {{ $t('admin.rolle.selectMerkmale') + '*' }}
                  </h3></v-col
                >
                <v-col
                  cols="12"
                  md="auto"
                  class="py-0"
                >
                  <v-select
                    :items="merkmale"
                    v-model="selectedMerkmale"
                    :placeholder="$t('admin.rolle.selectMerkmale')"
                    variant="outlined"
                    density="compact"
                    multiple
                    :bg-color="selectedMerkmale && selectedMerkmale.length > 0 ? '#4dc7bc' : ''"
                    clearable
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.title"
                        style="color: #001e49"
                      ></v-list-item> </template
                  ></v-select>
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
</style>
