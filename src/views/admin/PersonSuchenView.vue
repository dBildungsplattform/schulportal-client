<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useForm, type BaseFieldProps, type TypedSchema, type FormContext } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { type Composer, useI18n } from 'vue-i18n';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import { useDisplay } from 'vuetify';

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const personStore: PersonStore = usePersonStore();

  enum SearchType {
    KoPers = 'kopers',
    Email = 'email',
    Username = 'username',
    Name = 'name',
  }

  // Default selection is always KoPers
  const searchType: Ref<SearchType> = ref<SearchType>(SearchType.KoPers);
  const showPersonNotFoundDialog: Ref<boolean> = ref(false);

  // eslint-disable-next-line @typescript-eslint/typedef
  const baseSchema = object({
    selectedKopers: string().optional().nullable(),
    selectedEmail: string().optional().nullable(),
    selectedUsername: string().optional().nullable(),
    selectedVorname: string().nullable(),
    selectedNachname: string().nullable(),
  }).test(
    'vorname-nachname-pair',
    '',
    function (values: { selectedVorname?: string | null; selectedNachname?: string | null }) {
      const {
        selectedVorname,
        selectedNachname,
      }: { selectedVorname?: string | null; selectedNachname?: string | null } = values;

      if (selectedVorname && !selectedNachname) {
        return this.createError({
          path: 'selectedNachname',
          message: t('admin.person.rules.familienname.required'),
        });
      }

      if (selectedNachname && !selectedVorname) {
        return this.createError({
          path: 'selectedVorname',
          message: t('admin.person.rules.vorname.required'),
        });
      }

      return true;
    },
  );

  const schema: TypedSchema = toTypedSchema(baseSchema);

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type PersonSearchForm = {
    selectedKopers: string;
    selectedEmail: string;
    selectedUsername: string;
    selectedVorname: string;
    selectedNachname: string;
  };

  const formContext: FormContext<PersonSearchForm> = useForm({ validationSchema: schema });

  const [selectedKopers, selectedKopersProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedKopers', vuetifyConfig);
  const [selectedEmail, selectedEmailProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedEmail', vuetifyConfig);
  const [selectedUsername, selectedUsernameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedUsername', vuetifyConfig);
  const [selectedVorname, selectedVornameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedVorname', vuetifyConfig);
  const [selectedNachname, selectedNachnameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedNachname', vuetifyConfig);

  const isSearchDisabled: ComputedRef<boolean> = computed(() => {
    return !(
      selectedKopers.value ||
      selectedEmail.value ||
      selectedUsername.value ||
      selectedVorname.value ||
      selectedNachname.value
    );
  });

  // Watch for searchType changes to clear all fields when radio button changes
  watch(searchType, (_newSearchType: SearchType) => {
    // Clear all fields when switching between search types
    selectedKopers.value = '';
    selectedEmail.value = '';
    selectedUsername.value = '';
    selectedVorname.value = '';
    selectedNachname.value = '';
  });

  // Add watchers to clear other fields when one is changed
  watch(selectedKopers, (newValue: string | undefined) => {
    if (newValue) {
      selectedEmail.value = '';
      selectedUsername.value = '';
      selectedVorname.value = '';
      selectedNachname.value = '';
      searchType.value = SearchType.KoPers;
    }
  });

  watch(selectedEmail, (newValue: string | undefined) => {
    if (newValue) {
      selectedKopers.value = '';
      selectedUsername.value = '';
      selectedVorname.value = '';
      selectedNachname.value = '';
      searchType.value = SearchType.Email;
    }
  });

  watch(selectedUsername, (newValue: string | undefined) => {
    if (newValue) {
      selectedKopers.value = '';
      selectedEmail.value = '';
      selectedVorname.value = '';
      selectedNachname.value = '';
      searchType.value = SearchType.Username;
    }
  });

  // For name fields, clear other fields but allow both Vorname and Nachname to coexist
  watch(selectedVorname, (newValue: string | undefined) => {
    if (newValue) {
      selectedKopers.value = '';
      selectedEmail.value = '';
      selectedUsername.value = '';
      searchType.value = SearchType.Name;
    }
  });

  watch(selectedNachname, (newValue: string | undefined) => {
    if (newValue) {
      selectedKopers.value = '';
      selectedEmail.value = '';
      selectedUsername.value = '';
      searchType.value = SearchType.Name;
    }
  });

  const onSubmit: (e?: Event) => Promise<Promise<void> | undefined> = formContext.handleSubmit(async () => {
    switch (searchType.value) {
      case SearchType.KoPers:
        await personStore.getLandesbedienstetePerson({
          personalnummer: selectedKopers.value,
        });
        break;
      case SearchType.Email:
        await personStore.getLandesbedienstetePerson({
          primaryEmailAddress: selectedEmail.value,
        });
        break;
      case SearchType.Username:
        await personStore.getLandesbedienstetePerson({
          username: selectedUsername.value,
        });
        break;
      case SearchType.Name:
        await personStore.getLandesbedienstetePerson({
          vorname: selectedVorname.value,
          nachname: selectedNachname.value,
        });
        break;
    }

    // Check if the result is an empty array, if that's the case show the corresponding dialog
    if (
      Array.isArray(personStore.allLandesbedienstetePersonen) &&
      personStore.allLandesbedienstetePersonen.length === 0
    ) {
      showPersonNotFoundDialog.value = true;
    }
  });

  function isFormDirty(): boolean {
    return (
      formContext.isFieldDirty('selectedKopers') ||
      formContext.isFieldDirty('selectedEmail') ||
      formContext.isFieldDirty('selectedUsername') ||
      formContext.isFieldDirty('selectedVorname') ||
      formContext.isFieldDirty('selectedNachname')
    );
  }

  async function navigateBackToPersonSearchForm(): Promise<void> {
    if (personStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      formContext.resetForm();
      await router.push({ name: 'search-person-limited' }).then(() => {
        router.go(0);
      });
    } else {
      personStore.errorCode = '';
      await router.push({ name: 'search-person-limited' });
    }
  }

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    personStore.errorCode = '';
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onMounted(async () => {
    personStore.errorCode = '';
    personStore.allLandesbedienstetePersonen = [];

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>
<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="false"
      :header="t('admin.person.stateEmployeeSearch.searchPerson')"
      :padded="true"
      :showCloseText="true"
    >
      <FormWrapper
        :canCommit="!isSearchDisabled || personStore.loading"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('search')"
        :discardButtonLabel="$t('cancel')"
        :hideActions="!!personStore.errorCode"
        :hideNotice="true"
        id="person-creation-form"
        :isLoading="personStore.loading"
        :onDiscard="() => router.go(0)"
        @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
        :onSubmit="onSubmit"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Error Message Display for error messages from the personStore -->
        <SpshAlert
          :modelValue="!!personStore.errorCode"
          :title="t(`admin.person.title.${personStore.errorCode}`)"
          :type="'error'"
          :closable="false"
          :showButton="true"
          :buttonText="t('admin.person.backToCreatePerson')"
          :buttonAction="navigateBackToPersonSearchForm"
          :text="t(`admin.person.errors.${personStore.errorCode}`)"
        />

        <v-row
          v-if="!personStore.errorCode"
          class="align-start"
        >
          <!-- notice Column -->
          <v-col
            cols="12"
            sm="3"
          >
            <v-icon
              aria-hidden="true"
              class="mr-2"
              icon="mdi-alert-circle-outline"
              size="small"
            ></v-icon>
            <span class="text-body bold">
              {{ t('admin.person.stateEmployeeSearch.searchMethodNotice') }}
            </span>
          </v-col>

          <!-- Radio Group and Inputs Column -->
          <v-col
            cols="12"
            sm="9"
          >
            <v-radio-group v-model="searchType">
              <!-- KoPers -->
              <v-row class="align-center">
                <v-col cols="auto">
                  <v-radio
                    :label="t('admin.person.stateEmployeeSearch.withKopers')"
                    :value="SearchType.KoPers"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="9"
                  v-if="searchType === SearchType.KoPers"
                >
                  <v-text-field
                    clearable
                    data-testid="kopers-input"
                    density="compact"
                    id="kopers-input"
                    ref="kopers-input"
                    variant="outlined"
                    v-bind="selectedKopersProps"
                    v-model="selectedKopers"
                    placeholder="KoPers.-Nr. eingeben"
                  />
                </v-col>
              </v-row>

              <!-- Email -->
              <v-row class="align-center">
                <v-col cols="auto">
                  <v-radio
                    :label="t('admin.person.stateEmployeeSearch.withEmail')"
                    :value="SearchType.Email"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="9"
                  v-if="searchType === SearchType.Email"
                >
                  <v-text-field
                    clearable
                    data-testid="email-input"
                    density="compact"
                    id="email-input"
                    ref="email-input"
                    variant="outlined"
                    v-bind="selectedEmailProps"
                    v-model="selectedEmail"
                    placeholder="E-Mail eingeben"
                  />
                </v-col>
              </v-row>

              <!-- Username -->
              <v-row class="align-center">
                <v-col cols="auto">
                  <v-radio
                    :label="t('admin.person.stateEmployeeSearch.withUsername')"
                    :value="SearchType.Username"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="8"
                  v-if="searchType === SearchType.Username"
                >
                  <v-text-field
                    clearable
                    data-testid="username-input"
                    density="compact"
                    id="username-input"
                    ref="username-input"
                    variant="outlined"
                    v-bind="selectedUsernameProps"
                    v-model="selectedUsername"
                    placeholder="Benutzername eingeben"
                  />
                </v-col>
              </v-row>

              <!-- Name -->
              <v-row class="align-center">
                <v-col cols="auto">
                  <v-radio
                    :label="t('admin.person.stateEmployeeSearch.withfirstAndLastname')"
                    :value="SearchType.Name"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="9"
                  v-if="searchType === SearchType.Name"
                >
                  <v-row>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <v-text-field
                        clearable
                        data-testid="vorname-input"
                        density="compact"
                        id="vorname-input"
                        ref="vorname-input"
                        variant="outlined"
                        v-bind="selectedVornameProps"
                        v-model="selectedVorname"
                        placeholder="Vorname eingeben"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <v-text-field
                        clearable
                        data-testid="nachname-input"
                        density="compact"
                        id="nachname-input"
                        ref="nachname-input"
                        variant="outlined"
                        v-bind="selectedNachnameProps"
                        v-model="selectedNachname"
                        placeholder="Nachname eingeben"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-radio-group>
          </v-col>
        </v-row>
      </FormWrapper>
    </LayoutCard>
    <v-dialog
      v-model="showPersonNotFoundDialog"
      persistent
    >
      <LayoutCard
        v-if="showPersonNotFoundDialog"
        :closable="false"
        :header="t('admin.person.stateEmployeeSearch.searchResult')"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                class="text-center"
                cols="12"
              >
                <span data-testid="no-person-found-text">
                  {{ t('admin.person.stateEmployeeSearch.noPersonFoundMessage') }}
                </span>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              cols="12"
              class="d-flex justify-center"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                @click.stop="showPersonNotFoundDialog = false"
                data-testid="cancel-no-person-found-button"
              >
                {{ t('cancel') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
  </div>
</template>
