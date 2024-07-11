<script setup lang="ts">
  import { type Ref, ref, onBeforeMount, computed, type ComputedRef, watch } from 'vue';
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import PasswordReset from '@/components/admin/personen/PasswordReset.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import PersonDelete from '@/components/admin/personen/PersonDelete.vue';
  import PersonenkontextDelete from '@/components/admin/personen/PersonenkontextDelete.vue';
  import {
    usePersonenkontextStore,
    type DbiamPersonenkontextBodyParams,
    type DbiamUpdatePersonenkontexteBodyParams,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { useDisplay } from 'vuetify';
import TwoFactorAuthenticationSetUp from '@/components/admin/personen/TwoFactorAuthenticationSetUp.vue';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const currentPersonId: string = route.params['id'] as string;
  const personStore: PersonStore = usePersonStore();
  const personenKontextStore: PersonenkontextStore = usePersonenkontextStore();
  const authStore: AuthStore = useAuthStore();

  const password: Ref<string> = ref('');

  const zuordnungenResult: Ref<Zuordnung[] | undefined> = ref<Zuordnung[] | undefined>(undefined);
  const getZuordnungen: ComputedRef<Zuordnung[] | undefined> = computed(() => zuordnungenResult.value);
  const selectedZuordnungen: Ref<Zuordnung[]> = ref<Zuordnung[]>([]);

  const isEditActive: Ref<boolean> = ref(false);
  const pendingDeletion: Ref<boolean> = ref(false);
  const successDialogVisible: Ref<boolean> = ref(false);
  const cannotDeleteDialogVisible: Ref<boolean> = ref(false);

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  function resetPassword(personId: string): void {
    personStore.resetPassword(personId).then((newPassword?: string) => {
      password.value = newPassword || '';
    });
  }

  const handleAlertClose = (): void => {
    personStore.errorCode = '';
    navigateToPersonTable();
  };

  // Triggers the template to start editing
  const triggerEdit = (): void => {
    isEditActive.value = true;
  };
  // Cancels editing
  const cancelEdit = (): void => {
    isEditActive.value = false;
    pendingDeletion.value = false;
    selectedZuordnungen.value = [];
  };

  // Triggers the template to prepare the deletion
  const prepareDeletion = (): void => {
    pendingDeletion.value = true;
  };

  // Deletes the person and all kontexte
  async function deletePerson(personId: string): Promise<void> {
    await personStore.deletePerson(personId);
  }

  const closeCannotDeleteDialog = (): void => {
    cannotDeleteDialogVisible.value = false;
  };
  let closeSuccessDialog = (): void => {
    successDialogVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
  };
  // This will send the updated list of Zuordnungen to the Backend WITHOUT the selected Zuordnungen.
  const confirmDeletion = async (): Promise<void> => {
    // Check if the current user is trying to delete their own Zuordnungen
    if (authStore.currentUser?.personId === currentPersonId) {
      cannotDeleteDialogVisible.value = true;
      return;
    }
    // The remaining Zuordnungen that were not selected
    const remainingZuordnungen: Zuordnung[] | undefined = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => !selectedZuordnungen.value.includes(zuordnung),
    );

    // Extract Zuordnungen of type "Klasse"
    const klassenZuordnungen: Zuordnung[] | undefined = personenKontextStore.personenuebersicht?.zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );

    // Filter out Klassen where administriertVon is equal to any selectedZuordnungen.sskId so the Klasse is also deleted alongside the Schule.
    // Otherwise the Zuordnung to the Schule will be deleted but the one to the Klasse will remain.
    const filteredKlassenZuordnungen: Zuordnung[] | undefined = klassenZuordnungen?.filter(
      (klasseZuordnung: Zuordnung) =>
        !selectedZuordnungen.value.some(
          (selectedZuordnung: Zuordnung) => selectedZuordnung.sskId === klasseZuordnung.administriertVon,
        ),
    );

    // Combine remaining Zuordnungen and filtered Klassen Zuordnungen
    const combinedZuordnungen: Zuordnung[] | undefined = remainingZuordnungen?.concat(filteredKlassenZuordnungen || []);

    const updateParams: DbiamUpdatePersonenkontexteBodyParams = {
      lastModified: new Date().toISOString(),
      count: personenKontextStore.personenuebersicht?.zuordnungen.length ?? 0,
      personenkontexte: combinedZuordnungen?.map((zuordnung: Zuordnung) => ({
        personId: currentPersonId,
        organisationId: zuordnung.sskId,
        rolleId: zuordnung.rolleId,
      })) as DbiamPersonenkontextBodyParams[],
    };

    await personenKontextStore.updatePersonenkontexte(updateParams, currentPersonId);
    zuordnungenResult.value = combinedZuordnungen;
    selectedZuordnungen.value = [];

    // Filter out Zuordnungen with editable === false
    const editableZuordnungen: Zuordnung[] | undefined = combinedZuordnungen?.filter(
      (zuordnung: Zuordnung) => zuordnung.editable,
    );

    successDialogVisible.value = true;

    if (!editableZuordnungen || editableZuordnungen.length === 0) {
      // If no editable Zuordnungen are left, navigate to person table after the dialog is closed
      closeSuccessDialog = (): void => {
        successDialogVisible.value = false;
        navigateToPersonTable();
      };
    } else {
      closeSuccessDialog = (): void => {
        successDialogVisible.value = false;
        router.push(route).then(() => {
          router.go(0);
        });
      };
    }
  };

  function getSskName(sskDstNr: string, sskName: string): string {
    /* truncate ssk name */
    const truncatededSskName: string = sskName.length > 30 ? `${sskName.substring(0, 30)}...` : sskName;

    /* omit parens when there is no ssk kennung  */
    if (sskDstNr) {
      return `${sskDstNr} (${truncatededSskName})`;
    } else {
      return truncatededSskName;
    }
  }

  // Add the Klasse to it's corresponding Schule
  function computeZuordnungen(personenuebersicht: Uebersicht | null): Zuordnung[] | undefined {
    const zuordnungen: Zuordnung[] | undefined = personenuebersicht?.zuordnungen;

    if (!zuordnungen) return;

    const result: Zuordnung[] = [];

    // Extract all Klassen from the Zuordnungen
    const klassen: Zuordnung[] = zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );
    // Add every klasse to result
    for (const klasse of klassen) {
      // Find the specific parent of every Klasse (The rolle in the Klasse should also be the same role in the Parent (Schule))
      const administrierendeZuordnung: Zuordnung | undefined = zuordnungen.find(
        (z: Zuordnung) =>
          z.sskId === klasse.administriertVon && z.rolleId === klasse.rolleId && z.typ !== OrganisationsTyp.Klasse,
      );
      // If the parent is found then add the Klasse property to it
      if (administrierendeZuordnung) {
        result.push({
          ...administrierendeZuordnung,
          klasse: klasse.sskName,
        });
      }
    }
    // Other Zuordnungen not of typ Klasse
    const otherZuordnungen: Zuordnung[] = zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse,
    );

    for (const zuordnung of otherZuordnungen) {
      // Only add Zuordnungen that don't have the same sskId and rolleId to avoid redundancy in the final result
      if (!result.find((z: Zuordnung) => z.sskId === zuordnung.sskId && z.rolleId === zuordnung.rolleId)) {
        result.push(zuordnung);
      }
    }
    // Sort by klasse, rolle and SSK (optional)
    result
      .sort((a: Zuordnung, b: Zuordnung) => (a.klasse && b.klasse ? a.klasse.localeCompare(b.klasse) : 0))
      .sort((a: Zuordnung, b: Zuordnung) => a.rolle.localeCompare(b.rolle))
      .sort((a: Zuordnung, b: Zuordnung) => a.sskDstNr.localeCompare(b.sskDstNr));

    return result;
  }
  watch(
    () => personenKontextStore.personenuebersicht,
    (newValue: Uebersicht | null) => {
      zuordnungenResult.value = computeZuordnungen(newValue);
    },
    { immediate: true },
  );

  onBeforeMount(async () => {
    await personStore.getPersonById(currentPersonId);
    await personenKontextStore.getPersonenuebersichtById(currentPersonId);
  });
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1
          class="text-center headline-1"
          data-testid="admin-headline"
        >
          {{ $t('admin.headline') }}
        </h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      data-testid="person-details-card"
      :header="$t('admin.person.edit')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :buttonAction="navigateToPersonTable"
        :model-value="!!personStore.errorCode"
        :title="$t('admin.person.loadingErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.person.loadingErrorText')"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!personStore.errorCode">
        <v-container>
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">
                {{ $t('admin.person.personalInfo') }}
              </h3></v-col
            >
          </v-row>
          <div v-if="personStore.currentPerson?.person">
            <!-- Vorname -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.firstName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-vorname"
              >
                <span class="text-body"> {{ personStore.currentPerson.person.name.vorname }} </span>
              </v-col>
            </v-row>
            <!-- Familienname -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.lastName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-familienname"
              >
                <span class="text-body"> {{ personStore.currentPerson.person.name.familienname }}</span>
              </v-col>
            </v-row>
            <!-- Benutzername -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.userName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-username"
              >
                <span class="text-body">{{ personStore.currentPerson.person.referrer }} </span>
              </v-col>
            </v-row>
            <!-- Kopers-Nr -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.kopersnr') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-kopersnr"
              >
                <span class="text-body">{{ personStore.currentPerson.person.personalnummer ?? '---' }} </span>
              </v-col>
            </v-row>
          </div>
          <div v-else-if="personStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <v-container class="password-reset">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('person.password') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PasswordReset
                  :errorCode="personStore.errorCode"
                  :disabled="isEditActive"
                  :person="personStore.currentPerson"
                  @onClearPassword="password = ''"
                  @onResetPassword="resetPassword(currentPersonId)"
                  :password="password"
                >
                </PasswordReset>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <v-container class="two-factor-authentication-set-up">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('admin.person.twoFactorAuthentication.header') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <TwoFactorAuthenticationSetUp
                  :errorCode="personStore.errorCode"
                  :disabled="isEditActive"
                  :person="personStore.currentPerson"
                >
                </TwoFactorAuthenticationSetUp>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Zuordnungen -->
        <v-container
          v-if="!isEditActive"
          class="person-zuordnungen"
        >
          <v-row class="ml-md-16">
            <v-col
              cols="12"
              sm="auto"
            >
              <h3 class="subtitle-1">{{ $t('person.zuordnungen') }}</h3>
            </v-col>
            <v-spacer></v-spacer>
            <v-col
              cols="12"
              md="auto"
              class="mr-lg-13"
            >
              <div class="d-flex justify-sm-end">
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="primary ml-lg-8"
                    data-testid="zuordnung-edit-button"
                    @Click="triggerEdit"
                    :block="mdAndDown"
                  >
                    {{ $t('edit') }}
                  </v-btn>
                </v-col>
              </div>
            </v-col>
          </v-row>
          <!-- Check if 'zuordnungen' array exists and has length > 0 -->
          <v-row
            class="ml-md-3 mt-md-n8"
            v-if="
              personenKontextStore.personenuebersicht?.zuordnungen &&
              personenKontextStore.personenuebersicht?.zuordnungen.length > 0
            "
          >
            <v-col
              cols="10"
              offset="1"
              v-for="zuordnung in getZuordnungen"
              :key="zuordnung.sskId"
              :data-testid="`person-zuordnung-${zuordnung.sskId}`"
              :title="zuordnung.sskName"
            >
              <span class="text-body"
                >{{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                {{ zuordnung.klasse }}</span
              >
            </v-col>
          </v-row>

          <!-- Display 'No data available' if the above condition is false -->
          <v-row v-else>
            <v-col
              cols="10"
              offset-lg="2"
              offset="1"
            >
              <h3 class="text-body">{{ $t('person.noZuordnungenFound') }}</h3>
            </v-col>
          </v-row>
        </v-container>
        <!-- Show this template if the edit button is active-->
        <v-container v-if="isEditActive">
          <v-row class="ml-md-16">
            <v-col
              v-if="!pendingDeletion"
              cols="12"
              sm="auto"
            >
              <h3 class="subtitle-1">{{ $t('person.editZuordnungen') }}: {{ $t('pleaseSelect') }}</h3>
            </v-col>
          </v-row>
          <!-- Check if 'zuordnungen' array exists and has length > 0 -->
          <v-row
            class="checkbox-row ml-md-16 mb-12"
            v-if="
              personenKontextStore.personenuebersicht?.zuordnungen &&
              personenKontextStore.personenuebersicht?.zuordnungen.length > 0
            "
          >
            <v-col
              v-if="pendingDeletion"
              cols="12"
              sm="auto"
            >
              <h3 class="subtitle-1">{{ $t('person.checkAndSave') }}:</h3></v-col
            >
            <v-col
              cols="12"
              v-for="zuordnung in getZuordnungen?.filter((zuordnung) => zuordnung.editable)"
              :key="zuordnung.sskId"
              :data-testid="`person-zuordnung-${zuordnung.sskId}`"
              :title="zuordnung.sskName"
              class="py-0 d-flex align-items-center"
            >
              <template v-if="!pendingDeletion">
                <div class="checkbox-div">
                  <v-checkbox
                    v-model="selectedZuordnungen"
                    :value="zuordnung"
                  >
                    <template v-slot:label>
                      <span class="text-body">
                        {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                        {{ zuordnung.klasse }}
                      </span>
                    </template>
                  </v-checkbox>
                </div>
              </template>
              <template v-else>
                <span
                  class="my-3 ml-5"
                  :class="{
                    'text-body text-red': selectedZuordnungen.includes(zuordnung),
                    'text-body': !selectedZuordnungen.includes(zuordnung),
                  }"
                >
                  {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                  {{ zuordnung.klasse }}
                  <span
                    v-if="selectedZuordnungen.includes(zuordnung)"
                    class="text-red"
                  >
                    ({{ $t('person.willBeRemoved') }})</span
                  >
                </span>
              </template>
            </v-col>
            <v-spacer></v-spacer>
            <v-col
              v-if="!pendingDeletion"
              class="button-container"
              cols="12"
              md="auto"
            >
              <v-col
                cols="12"
                sm="6"
                md="auto"
              >
                <PersonenkontextDelete
                  v-if="!pendingDeletion"
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  :disabled="selectedZuordnungen.length === 0"
                  :zuordnungCount="zuordnungenResult?.filter((zuordnung) => zuordnung.editable).length"
                  @onDeletePersonenkontext="prepareDeletion"
                >
                </PersonenkontextDelete>
                <SpshTooltip
                  :enabledCondition="selectedZuordnungen.length === 0"
                  :disabledText="$t('person.addZuordnungNotAllowed')"
                  :enabledText="$t('person.addZuordnung')"
                  position="start"
                >
                  <v-btn
                    class="primary mt-2"
                    data-testid="open-person-delete-dialog-icon"
                    :disabled="selectedZuordnungen.length > 0"
                    :block="mdAndDown"
                  >
                    {{ $t('person.addZuordnung') }}
                  </v-btn>
                </SpshTooltip>
                <SpshTooltip
                  :enabledCondition="selectedZuordnungen.length > 0"
                  :disabledText="$t('person.chooseZuordnungFirst')"
                  :enabledText="$t('person.changeRolleDescription')"
                  position="start"
                >
                  <v-btn
                    class="primary mt-2"
                    data-testid="open-person-delete-dialog-icon"
                    :disabled="selectedZuordnungen.length === 0"
                    :block="mdAndDown"
                  >
                    {{ $t('person.changeRolle') }}
                  </v-btn>
                </SpshTooltip>
                <SpshTooltip
                  :enabledCondition="selectedZuordnungen.length > 0"
                  :disabledText="$t('person.chooseZuordnungFirst')"
                  :enabledText="$t('person.modifyBefristungDescription')"
                  position="start"
                >
                  <v-btn
                    class="primary mt-2"
                    data-testid="open-person-delete-dialog-icon"
                    :disabled="selectedZuordnungen.length === 0"
                    :block="mdAndDown"
                  >
                    {{ $t('person.modifyBefristung') }}
                  </v-btn>
                </SpshTooltip>
              </v-col>
            </v-col>
          </v-row>
          <v-row v-else>
            <v-col
              class="mb-14"
              cols="10"
              offset-lg="2"
              offset="1"
            >
              <h3 class="text-body">{{ $t('person.noZuordnungenFound') }}</h3>
            </v-col>
          </v-row>
          <v-row class="save-cancel-row ml-md-16 mb-3">
            <v-col
              class="cancel-col"
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                class="secondary small"
                data-testid="zuordnung-cancel"
                @click="cancelEdit"
                :block="mdAndDown"
              >
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <SpshTooltip
                :enabledCondition="pendingDeletion"
                :disabledText="$t('person.noChangesToSave')"
                :enabledText="$t('person.saveChanges')"
              >
                <v-btn
                  class="primary small"
                  data-testid="zuordnung-changes-save"
                  @click="confirmDeletion"
                  :block="mdAndDown"
                  :disabled="!pendingDeletion"
                >
                  {{ $t('save') }}
                </v-btn>
              </SpshTooltip>
            </v-col>
          </v-row>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Delete person -->
        <v-container
          v-if="authStore.hasPersonenLoeschenPermission"
          class="person-delete"
        >
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('admin.person.status') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-10"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PersonDelete
                  :disabled="isEditActive"
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  @onDeletePerson="deletePerson(currentPersonId)"
                >
                </PersonDelete>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
      </template>
    </LayoutCard>
    <!-- Success Dialog after deleting the Zuordnung-->
    <v-dialog
      v-model="successDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.deleteZuordnungSuccess') }}</span>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                @click.stop="closeSuccessDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Dialog to inform the user that he can't delete his own Zuordnungen -->
    <v-dialog
      v-model="cannotDeleteDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.cannotDeleteOwnZuordnung') }}</span>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                @click.stop="closeCannotDeleteDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
  </div>
</template>

<style scoped>
  @media only screen and (max-width: 600px) {
    .save-cancel-row {
      margin-top: -40px;
    }
    .cancel-col {
      margin-bottom: -15px;
    }
  }
</style>
