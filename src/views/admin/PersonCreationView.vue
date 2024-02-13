<script setup lang="ts">
  import { usePersonStore, type CreatedPerson, type PersonStore } from '@/stores/PersonStore'
  // import { type RolleResponse } from '@/api-client/generated/api'
  import { onMounted, type Ref, ref } from 'vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { type Composer, useI18n } from 'vue-i18n'
  import { type FieldContext, useField, useForm } from 'vee-validate'
  import { object, string } from 'yup'
  import { toTypedSchema } from '@vee-validate/yup'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import PasswordOutput from '@/components/form/PasswordOutput.vue'

  const router: Router = useRouter()
  const personStore: PersonStore = usePersonStore()
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
  const { t }: Composer = useI18n({ useScope: 'global' })

  type PersonCreationForm = {
    selectedVorname: string
    selectedFamilienname: string
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  const { handleSubmit } = useForm<PersonCreationForm>({
    validationSchema: toTypedSchema(
      object({
        selectedVorname: string().required(t('admin.person.rules.vorname')),
        selectedFamilienname: string().required(t('admin.person.rules.familienname'))
      })
    )
  })

  const noKoPersNumber: Ref<boolean> = ref(false)
  const koPersNumber: Ref<string> = ref('')
  const selectedRolle: Ref<string> = ref('')
  const selectedVorname: FieldContext<unknown> = useField('selectedVorname')
  const selectedFamilienname: FieldContext<unknown> = useField('selectedFamilienname')

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' })
  }

  function createPerson(): void {
    const unpersistedPerson: CreatedPerson = {
      name: {
        familienname: selectedFamilienname.value.value as string,
        vorname: selectedVorname.value.value as string
      }
    }
    personStore.createPerson(unpersistedPerson)
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    createPerson()
  })

  const handleAlertClose = (): void => {
    personStore.errorCode = ''
    navigateToPersonTable()
  }

  const handleCreateAnotherPerson = (): void => {
    personStore.createdPerson = null
    selectedRolle.value = ''
    noKoPersNumber.value = false
    koPersNumber.value = ''
    selectedVorname.value.value = ''
    selectedFamilienname.value.value = ''
    router.push({ name: 'create-person' })
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
    :header="$t('admin.person.addNew')"
    @onCloseClicked="navigateToPersonTable"
    :padded="true"
    :showCloseText="true"
  >
    <!-- Error Message Display -->
    <SpshAlert
      :model-value="!!personStore.errorCode"
      :title="$t('admin.person.creationErrorTitle')"
      :type="'error'"
      :closable="false"
      :text="$t('admin.person.creationErrorText')"
      @update:modelValue="handleAlertClose"
    />

    <!-- The form to create a new Person  -->
    <template v-if="!personStore.createdPerson">
      <v-form
        @submit.prevent="onSubmit"
        data-testid="person-creation-form"
      >
        <v-container class="px-3 px-sm-16">
          <v-row class="align-center flex-nowrap mx-auto py-6">
            <v-icon
              aria-hidden="true"
              class="mr-2"
              icon="mdi-alert-circle-outline"
              size="small"
            ></v-icon>
            <label class="subtitle-2">{{ $t('admin.mandatoryFieldsNotice') }}</label>
          </v-row>
          <v-container class="px-lg-16">
            <!-- Rollenzuordnung -->
            <v-row>
              <h3 class="headline-3">1. {{ $t('admin.rolle.selectRolle') }}</h3>
            </v-row>
            <v-row class="align-center mt-8">
              <v-col
                class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                cols="12"
                sm="4"
              >
                <label for="rolle-select">{{ $t('admin.rolle.selectRolle') }}</label>
              </v-col>
              <v-col
                class="py-0"
                cols="12"
                sm="8"
              >
                <v-select
                  data-testid="rolle-select"
                  id="rolle-select"
                  :items="rollen"
                  item-title="name"
                  item-value="id"
                  :no-data-text="$t('admin.rolle.noRollenFound')"
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
                    data-testid="no-kopers-checkbox"
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
                    data-testid="kopers-number-input"
                    :disabled="noKoPersNumber"
                    v-model="koPersNumber"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Persönliche Informationen -->
              <v-row>
                <h3 class="headline-3">2. {{ $t('admin.person.personalInfo') }}</h3>
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
                    data-testid="vorname-input"
                    :error-messages="selectedVorname.errorMessage.value"
                    id="vorname-input"
                    variant="outlined"
                    v-model="selectedVorname.value.value"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row class="align-center">
                <v-col
                  class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                  cols="12"
                  sm="4"
                >
                  <label for="familienname-input">{{ $t('person.lastName') }}</label>
                </v-col>
                <v-col
                  class="py-0"
                  cols="12"
                  sm="8"
                >
                  <v-text-field
                    data-testid="familienname-input"
                    :error-messages="selectedFamilienname.errorMessage.value"
                    id="familienname-input"
                    variant="outlined"
                    v-model="selectedFamilienname.value.value"
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
                    data-testid="schule-select"
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
              @click.stop="navigateToPersonTable"
              data-testid="discard-person-button"
              >{{ $t('admin.person.discard') }}</v-btn
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
              data-testid="create-person-button"
              type="submit"
              >{{ $t('admin.person.create') }}</v-btn
            >
          </v-col>
        </v-row>
      </v-form>
    </template>

    <!-- Result template on success after submit  -->
    <template v-if="personStore.createdPerson">
      <v-container class="new-role-success">
        <v-row justify="center">
          <v-col
            class="subtitle-1"
            cols="auto"
          >
            {{
              $t('admin.person.addedSuccessfully', {
                firstname: personStore.createdPerson.person.name.vorname,
                lastname: personStore.createdPerson.person.name.familienname
              })
            }}
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
        <v-row justify="center">
          <v-col
            class="subtitle-2"
            cols="auto"
          >
            {{ $t('admin.followingDataCreated') }}
          </v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.firstName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.name.vorname }}</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.lastName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.name.familienname }}</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.userName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.referrer }}</v-col>
        </v-row>
        <v-row class="align-center">
          <v-col class="text-body bold text-right pb-8">
            {{ $t('admin.person.startPassword') }}:
          </v-col>
          <v-col class="text-body">
            <PasswordOutput
              :password="personStore.createdPerson.person.startpasswort"
            ></PasswordOutput>
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
            md="auto"
          >
            <v-btn
              class="secondary"
              @click.stop="navigateToPersonTable"
              data-testid="back-to-list-button"
            >
              {{ $t('nav.backToList') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            md="auto"
          >
            <v-btn
              class="primary button"
              @click="handleCreateAnotherPerson"
              data-testid="create-another-person-button"
            >
              {{ $t('admin.person.createAnother') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </LayoutCard>
</template>

<style></style>
