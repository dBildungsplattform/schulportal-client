<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { usePersonStore, type CreatedPerson, type PersonStore } from '@/stores/PersonStore'
  // import { type RolleResponse } from '@/api-client/generated/api'
  import { onMounted, type Ref, ref } from 'vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import SpshAlert from '@/components/alert/SpshAlert.vue'

  const router: Router = useRouter()
  const personStore: PersonStore = usePersonStore()
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
  const noKoPersNumber: Ref<boolean> = ref(false)
  const selectedRolle: Ref<string> = ref('')
  const selectedVorname: Ref<string> = ref('')
  const selectedFamilienname: Ref<string> = ref('')

  function navigateToUserTable(): void {
    router.push({ name: 'user-management' })
  }

  function createPerson(): void {
    const unpersistedPerson: CreatedPerson = {
      name: {
        familienname: selectedFamilienname.value,
        vorname: selectedVorname.value
      }
    }
    personStore.createPerson(unpersistedPerson)
  }

  const handleAlertClose = (): void => {
    personStore.errorCode = ''
    navigateToUserTable()
  }

  const rollen: Array<Object> = [
    {
      id: '1',
      name: 'Tutor',
      rollenart: 'LERN',
      merkmale: '',
      createdAt: '',
      updatedAt: '',
      administeredBySchulstrukturknoten: '1'
    }
  ]

  const schulen: Array<string> = ['1', '2', '3']

  onMounted(async () => {
    personStore.errorCode = ''
  })
</script>

<template>
  <LayoutCard
    :closable="true"
    :header="$t('admin.user.addNew')"
    @onCloseClicked="navigateToUserTable"
    :padded="true"
    :showCloseText="true"
  >
    <!-- Error Message Display -->
    <SpshAlert
      :model-value="!!personStore.errorCode"
      :title="$t('admin.user.creationErrorTitle')"
      :type="'error'"
      :closable="false"
      :text="$t('admin.user.creationErrorText')"
      :showButton="true"
      :buttonText="$t('admin.user.backToList')"
      :buttonAction="navigateToUserTable"
      @update:modelValue="handleAlertClose"
    />

    <v-form @submit.prevent>
      <v-container class="px-3 px-sm-16">
        <v-row class="align-center flex-nowrap mx-auto py-6">
          <v-icon
            class="mr-2"
            icon="mdi-information-outline"
            size="small"
          ></v-icon>
          <label class="subtitle-2">{{ $t('admin.mandatoryFieldsNotice') }}</label>
        </v-row>
        <v-container class="px-lg-16">
          <!-- Rollenzuordnung -->
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.role.selectRole') }}</h3>
          </v-row>
          <v-row class="align-center mt-8">
            <v-col
              class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
              cols="12"
              sm="4"
            >
              <label for="rolle-select">{{ $t('admin.role.selectRole') }}</label>
            </v-col>
            <v-col
              class="py-0"
              cols="12"
              sm="8"
            >
              <v-select
                id="rolle-select"
                :items="rollen"
                item-title="name"
                item-value="id"
                :no-data-text="$t('admin.role.noRolesFound')"
                variant="outlined"
                v-model="selectedRolle"
              ></v-select>
            </v-col>
          </v-row>

          <div v-if="selectedRolle">
            <!-- KoPers-Nr -->
            <v-row class="align-center">
              <v-col
                class="hidden-xs-and-down"
                cols="12"
                sm="4"
              ></v-col>
              <v-col
                class="pa-0"
                cols="8"
              >
                <v-checkbox
                  class="no-kopers-checkbox"
                  hide-details
                  :label="$t('admin.koPers.noKoPersNumber')"
                  v-model="noKoPersNumber"
                ></v-checkbox>
              </v-col>
              <v-col
                class="py-0 pb-sm-8 text-sm-right"
                cols="12"
                sm="4"
              >
                <label
                  for="kopers-number"
                  :disabled="noKoPersNumber"
                  >{{ $t('admin.koPers.koPersNumber') }}</label
                >
              </v-col>
              <v-col
                class="pt-0"
                cols="12"
                sm="8"
              >
                <v-text-field
                  id="kopers-number"
                  :disabled="noKoPersNumber"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Persönliche Informationen -->
            <v-row>
              <h3 class="headline-3">2. {{ $t('admin.user.personalInfo') }}</h3>
            </v-row>
            <v-row class="align-center mt-8">
              <v-col
                class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                cols="12"
                sm="4"
              >
                <label for="vorname-input">{{ $t('person.firstName') }}</label>
              </v-col>
              <v-col
                class="py-0"
                cols="12"
                sm="8"
              >
                <v-text-field
                  id="vorname-input"
                  variant="outlined"
                  v-model="selectedVorname"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row class="align-center">
              <v-col
                class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                cols="12"
                sm="4"
              >
                <label for="nachname-input">{{ $t('person.lastName') }}</label>
              </v-col>
              <v-col
                class="py-0"
                cols="12"
                sm="8"
              >
                <v-text-field
                  id="nachname-input"
                  variant="outlined"
                  v-model="selectedFamilienname"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Schulzuordnung -->
            <v-row>
              <h3 class="headline-3">3. {{ $t('admin.school.assign') }}</h3>
            </v-row>
            <v-row class="align-center mt-8">
              <v-col
                class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                cols="12"
                sm="4"
              >
                <label for="schule-select">{{ $t('admin.school.assign') }}</label>
              </v-col>
              <v-col
                class="py-0"
                cols="12"
                sm="8"
              >
                <v-select
                  id="schule-select"
                  :items="schulen"
                  :no-data-text="$t('admin.school.noSchoolsFound')"
                  variant="outlined"
                ></v-select>
              </v-col>
            </v-row>
          </div>
        </v-container>
      </v-container>
      <v-divider
        class="border-opacity-100 rounded"
        color="#E5EAEF"
        thickness="5px"
      ></v-divider>
      <v-row class="py-3 px-2 justify-center">
        <v-spacer class="hidden-sm-and-down"></v-spacer>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-btn
            :block="smAndDown"
            class="secondary"
            @click.stop="navigateToUserTable"
            >{{ $t('admin.user.discard') }}</v-btn
          >
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-btn
            :block="smAndDown"
            class="primary"
            @click.stop="createPerson()"
            type="submit"
            >{{ $t('admin.user.create') }}</v-btn
          >
        </v-col>
      </v-row>
    </v-form>
  </LayoutCard>
</template>

<style></style>
