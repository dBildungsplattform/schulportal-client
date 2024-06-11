<script setup lang="ts">
  import { type Ref, ref, onBeforeMount, computed, type ComputedRef, watch } from 'vue';
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import PasswordReset from '@/components/admin/PasswordReset.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import PersonDelete from '@/components/admin/PersonDelete.vue';
  import PersonenkontextDelete from '@/components/admin/PersonenkontextDelete.vue';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { useDisplay } from 'vuetify';
  import type {
    DbiamUpdatePersonenkontexteBodyParams,
    DBiamCreatePersonenkontextBodyParams,
  } from '@/api-client/generated';

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

  async function deletePerson(personId: string): Promise<void> {
    await personStore.deletePerson(personId);
  }

  // This will send the updated list of Zuordnungen to the Backend WITHOUT the selected Zuordnungen.
  const confirmDeletion = async (): Promise<void> => {
    // The remaining Zuordnungen that were not selected
    const remainingZuordnungen: Zuordnung[] | undefined = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => !selectedZuordnungen.value.includes(zuordnung),
    );

    const updateParams: DbiamUpdatePersonenkontexteBodyParams = {
      lastModified: new Date().toISOString(),
      count: zuordnungenResult.value?.length ?? 0,
      personenkontexte: remainingZuordnungen?.map((zuordnung: Zuordnung) => ({
        personId: currentPersonId,
        organisationId: zuordnung.sskId,
        rolleId: zuordnung.rolleId,
      })) as DBiamCreatePersonenkontextBodyParams[],
    };

    await personenKontextStore.updatePersonenkontexte(updateParams, currentPersonId);
    zuordnungenResult.value = remainingZuordnungen;
    selectedZuordnungen.value = [];
    successDialogVisible.value = true;
  };

  const closeSuccessDialog = (): void => {
    successDialogVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
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
        <v-container class="personal-info">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">
                {{ $t('admin.person.personalInfo') }}
              </h3></v-col
            >
          </v-row>
          <div v-if="personStore.currentPerson?.person">
            <!-- Vorname -->
            <v-row>
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
            <v-row>
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
            <v-row>
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
            <v-row>
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
            </v-col></v-row
          >
          <v-row
            justify="end"
            class="mr-lg-10"
          >
            <v-col
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PasswordReset
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  @onClearPassword="password = ''"
                  @onResetPassword="resetPassword(currentPersonId)"
                  :password="password"
                >
                </PasswordReset>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col>
          </v-row>
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
              sm="6"
              md="auto"
            >
              <v-btn
                class="primary ml-lg-8 mr-lg-16 mr-sm-3"
                data-testid="zuordnung-edit"
                @Click="triggerEdit"
                :block="mdAndDown"
              >
                {{ $t('edit') }}
              </v-btn>
            </v-col>
          </v-row>
          <!-- Check if 'zuordnungen' array exists and has length > 0 -->
          <v-row
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
            <v-col
              v-if="pendingDeletion"
              cols="12"
              sm="auto"
            >
              <h3 class="subtitle-1">{{ $t('person.editZuordnungen') }}:</h3></v-col
            >
            <v-spacer></v-spacer>
            <PersonenkontextDelete
              v-if="!pendingDeletion"
              :errorCode="personStore.errorCode"
              :person="personStore.currentPerson"
              :disabled="selectedZuordnungen.length === 0"
              @onDeletePersonenkontext="prepareDeletion"
            >
            </PersonenkontextDelete>
            <v-col
              v-if="!pendingDeletion"
              class="button-container"
            >
              <v-tooltip location="left">
                <template v-slot:activator="{ props: tooltipProps }">
                  <div v-bind="tooltipProps">
                    <v-btn
                      class="primary"
                      data-testid="open-person-delete-dialog-icon"
                      :disabled="selectedZuordnungen.length > 0"
                      v-bind="tooltipProps"
                      :block="mdAndDown"
                    >
                      {{ $t('person.addZuordnung') }}
                    </v-btn>
                  </div>
                </template>
                <span>{{
                  selectedZuordnungen.length > 0 ? $t('person.addZuordnungNotAllowed') : $t('person.addZuordnung')
                }}</span>
              </v-tooltip>
              <v-tooltip location="left">
                <template v-slot:activator="{ props: tooltipProps }">
                  <div v-bind="tooltipProps">
                    <v-btn
                      class="primary mt-2"
                      data-testid="open-person-delete-dialog-icon"
                      :disabled="selectedZuordnungen.length === 0"
                      v-bind="tooltipProps"
                      :block="mdAndDown"
                    >
                      {{ $t('person.changeRolle') }}
                    </v-btn>
                  </div>
                </template>
                <span>{{
                  selectedZuordnungen.length === 0 ? $t('person.chooseZuordnungFirst') : $t('person.changeRolleHover')
                }}</span>
              </v-tooltip>
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props: tooltipProps }">
                  <div v-bind="tooltipProps">
                    <v-btn
                      class="primary mt-2"
                      data-testid="open-person-delete-dialog-icon"
                      :disabled="selectedZuordnungen.length === 0"
                      v-bind="tooltipProps"
                      :block="mdAndDown"
                    >
                      {{ $t('person.modifyBefristung') }}
                    </v-btn>
                  </div>
                </template>
                <span>{{
                  selectedZuordnungen.length === 0
                    ? $t('person.chooseZuordnungFirst')
                    : $t('person.modifyBefristungHover')
                }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
          <!-- Check if 'zuordnungen' array exists and has length > 0 -->
          <v-row
            class="ml-md-16"
            v-if="
              personenKontextStore.personenuebersicht?.zuordnungen &&
              personenKontextStore.personenuebersicht?.zuordnungen.length > 0
            "
          >
            <v-col
              cols="12"
              v-for="zuordnung in getZuordnungen"
              :key="zuordnung.sskId"
              :data-testid="`person-zuordnung-${zuordnung.sskId}`"
              :title="zuordnung.sskName"
              class="py-0 d-flex align-items-center"
            >
              <template v-if="!pendingDeletion">
                <div class="checkbox-row">
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
                    'text-body--error': selectedZuordnungen.includes(zuordnung),
                    'text-body': !selectedZuordnungen.includes(zuordnung),
                  }"
                >
                  {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                  {{ zuordnung.klasse }}
                  <span
                    v-if="selectedZuordnungen.includes(zuordnung)"
                    class="text-body--error"
                  >
                    ({{ $t('person.willBeRemoved') }})</span
                  >
                </span>
              </template>
            </v-col>
          </v-row>
          <v-row class="ml-md-16">
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                class="secondary v-btn--small"
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
              <v-tooltip location="top">
                <template v-slot:activator="{ props: tooltipProps }">
                  <div v-bind="tooltipProps">
                    <v-btn
                      class="primary v-btn--small"
                      data-testid="zuordnung-changes-save"
                      @click="confirmDeletion"
                      :block="mdAndDown"
                      :disabled="!pendingDeletion"
                      v-bind="tooltipProps"
                    >
                      {{ $t('save') }}
                    </v-btn>
                  </div>
                </template>
                <span>{{ !pendingDeletion ? $t('person.noChangesToSave') : $t('person.saveChanges') }}</span>
              </v-tooltip>
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
            </v-col></v-row
          >
          <v-row
            justify="end"
            class="mr-lg-10"
          >
            <v-col
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PersonDelete
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  @onDeletePerson="deletePerson(currentPersonId)"
                >
                </PersonDelete>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col>
          </v-row>
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
  </div>
</template>

<style scoped>
  .button-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: flex-end;
    right: 68px;
    margin-top: 58px;
  }
  .checkbox-row {
    margin-bottom: -10px;
  }
</style>
