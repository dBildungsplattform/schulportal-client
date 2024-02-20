<script setup lang="ts">
  import { usePersonStore, type CreatedPerson, type PersonStore } from '@/stores/PersonStore'
  import { onMounted, type Ref } from 'vue'
  import { type Router, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { type Composer, useI18n } from 'vue-i18n'
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate'
  import { object, string } from 'yup'
  import { toTypedSchema } from '@vee-validate/yup'
  import SpshAlert from '@/components/alert/SpshAlert.vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import PasswordOutput from '@/components/form/PasswordOutput.vue'

  const router: Router = useRouter()
  const personStore: PersonStore = usePersonStore()
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay()
  const { t }: Composer = useI18n({ useScope: 'global' })

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedVorname: string()
        .matches(/^[A-Za-z]*[A-Za-z][A-Za-z0-9- ]*$/, t('admin.person.rules.vorname.matches'))
        .min(2, t('admin.person.rules.vorname.min'))
        .required(t('admin.person.rules.vorname.required')),
      selectedFamilienname: string().required(t('admin.person.rules.familienname.required'))
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

  type PersonCreationForm = {
    selectedVorname: string
    selectedFamilienname: string
  }

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, resetForm } = useForm<PersonCreationForm>({
    validationSchema
  })

  const [selectedVorname, selectedVornameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedVorname', vuetifyConfig)
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>
  ] = defineField('selectedFamilienname', vuetifyConfig)

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' })
    personStore.createdPerson = null
    resetForm()
  }

  function createPerson(): void {
    const unpersistedPerson: CreatedPerson = {
      name: {
        familienname: selectedFamilienname.value as string,
        vorname: selectedVorname.value as string
      }
    }
    personStore.createPerson(unpersistedPerson)
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    createPerson()
  })

  const handleAlertClose = (): void => {
    personStore.errorCode = ''
  }

  const handleCreateAnotherPerson = (): void => {
    personStore.createdPerson = null
    resetForm()
    router.push({ name: 'create-person' })
  }

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
      :showButton="true"
      :buttonText="$t('admin.backToForm')"
      :text="$t('admin.person.creationErrorText')"
      @update:modelValue="handleAlertClose"
    />

    <!-- The form to create a new Person  -->
    <template v-if="!personStore.createdPerson && !personStore.errorCode">
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

            <!-- Dieses Div auf Auswahl einer Rolle bedingen -->
            <div>
              <!-- KoPers-Nr -->

              <!-- Persönliche Informationen -->
              <v-row>
                <h3 class="headline-3">{{ $t('admin.person.personalInfo') }}</h3>
              </v-row>
              <v-row class="align-center mt-8">
                <v-col
                  class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
                  cols="12"
                  sm="4"
                >
                  <label
                    for="vorname-input"
                    :error="selectedVornameProps['error']"
                    required="true"
                    >{{ $t('person.firstName') }}</label
                  >
                </v-col>
                <v-col
                  class="py-0"
                  cols="12"
                  sm="8"
                >
                  <v-text-field
                    clearable
                    data-testid="vorname-input"
                    id="vorname-input"
                    :placeholder="$t('person.enterFirstName')"
                    variant="outlined"
                    v-bind="selectedVornameProps"
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
                  <label
                    for="familienname-input"
                    :error="selectedFamiliennameProps['error']"
                    required="true"
                    >{{ $t('person.lastName') }}</label
                  >
                </v-col>
                <v-col
                  class="py-0"
                  cols="12"
                  sm="8"
                >
                  <v-text-field
                    clearable
                    data-testid="familienname-input"
                    id="familienname-input"
                    :placeholder="$t('person.enterLastName')"
                    variant="outlined"
                    v-bind="selectedFamiliennameProps"
                    v-model="selectedFamilienname"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Schulzuordnung -->
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
    <template v-if="personStore.createdPerson && !personStore.errorCode">
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
