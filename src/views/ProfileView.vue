<script setup lang="ts">
  import { RollenArt, RollenMerkmal } from '@/api-client/generated/api';
  import PasswordReset from '@/components/admin/personen/PasswordReset.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SelfServiceWorkflow from '@/components/two-factor-authentication/SelfServiceWorkflow.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { usePersonInfoStore, type PersonInfoStore } from '@/stores/PersonInfoStore';
  import { EmailStatus, usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import {
    TokenKind,
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { Zuordnung } from '@/stores/types/Zuordnung';
  import { adjustDateForTimezoneAndFormat } from '@/utils/date';
  import { mapToLabelValues, type LabelValue, ItemType, type SchulDaten } from '@/utils/personalDataMapper';
  import { computed, onBeforeMount, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ComposedZuordnung = Zuordnung & {
    klasse?: string | null;
  };

  const { xs }: { xs: Ref<boolean> } = useDisplay();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const kcActionStatus: string | null = route.query['kc_action_status'] as string | null;

  const authStore: AuthStore = useAuthStore();
  const personInfoStore: PersonInfoStore = usePersonInfoStore();
  const personStore: PersonStore = usePersonStore();
  const twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

  const windowOrigin: string = window.location.origin;
  const loading2FA: Ref<boolean> = ref(false);

  const devicePassword: Ref<string> = ref('');

  /**
   * Gruppiert eine Liste von Zuordnungen nach dem Wert der Eigenschaft 'sskId'.
   *
   * Diese Funktion nimmt ein Array von Zuordnungen entgegen und organisiert diese
   * in einer Map, wobei der Schlüssel der Wert der Eigenschaft 'sskId' ist
   * und der Wert ein Array von Zuordnungen mit diesem Schlüssel.
   *
   * @param zuordnungen - Ein Array von Zuordnungen, die gruppiert werden sollen.
   * @returns Eine Map, in der jeder Schlüssel ein Wert von 'sskId' ist und
   *          jeder Wert ein Array von Zuordnungen mit diesem Schlüssel.
   */
  function groupZuordnungen(zuordnungen: Zuordnung[]): Map<string, Zuordnung[]> {
    const groupedZuordnungen: Map<string, Zuordnung[]> = new Map();
    for (const zuordnung of zuordnungen) {
      const key: string = zuordnung.sskId;
      if (groupedZuordnungen.has(key)) {
        groupedZuordnungen.get(key)?.push(zuordnung);
      } else {
        groupedZuordnungen.set(key, [zuordnung]);
      }
    }
    return groupedZuordnungen;
  }

  /**
   * Erstellt eine Liste von zusammengesetzten Zuordnungen aus einer gruppierten Map von Zuordnungen.
   *
   * Diese Funktion nimmt eine Map von gruppierten Zuordnungen entgegen und erstellt eine neue Liste von
   * Zuordnungen. Wenn es mehrere Zuordnungen in einer Gruppe gibt, werden die Rollen aggregiert und
   * zusammengeführt. Für Zuordnungen des Typs "Klasse" oder "Schule" wird der Name der Klasse oder
   * der Schule entsprechend gesetzt. Einzelne Zuordnungen ohne Gruppierung werden direkt übernommen.
   *
   * @param groupedZuordnungen - Eine Map, in der jeder Schlüssel ein Wert von 'sskDstNr' ist und
   *                             jeder Wert ein Array von Zuordnungen mit diesem Schlüssel.
   * @returns Ein Array von zusammengesetzten Zuordnungen.
   */
  function createComposedZuordnungen(groupedZuordnungen: Map<string, Zuordnung[]>): ComposedZuordnung[] {
    const composedZuordnungen: ComposedZuordnung[] = [];
    for (const [, zuordnungen] of groupedZuordnungen) {
      if (zuordnungen.length === 0 || zuordnungen[0] === undefined) continue;
      if (zuordnungen.length > 1) {
        const aggregatedRoles: string[] = zuordnungen.map((z: Zuordnung) => z.rolle);
        const uniqueRoles: string[] = [...new Set(aggregatedRoles)];
        const composedRoles: string = uniqueRoles.join(', ');
        const befristung: Zuordnung['befristung'] | undefined = zuordnungen.find(
          (z: Zuordnung) => z.befristung,
        )?.befristung;
        const klasse: string | null =
          zuordnungen
            .filter((z: Zuordnung) => z.typ === OrganisationsTyp.Klasse)
            .map((z: Zuordnung) => z.sskName)
            .join(', ') || null;
        const schule: string | null =
          zuordnungen.find((z: Zuordnung) => z.typ === OrganisationsTyp.Schule)?.sskName || null;
        const composedZuordnung: ComposedZuordnung = Zuordnung.from(zuordnungen[0]);
        composedZuordnung.rolle = composedRoles;
        if (schule) composedZuordnung.sskName = schule;
        if (klasse) composedZuordnung.klasse = klasse;
        composedZuordnung.befristung = befristung ?? null;
        composedZuordnungen.push(composedZuordnung);
      } else {
        composedZuordnungen.push(zuordnungen[0]);
      }
    }
    return composedZuordnungen;
  }

  function createZuordnungsSchuleDaten(zuordnungen: ComposedZuordnung[]): SchulDaten[] {
    const result: SchulDaten[] = [];
    for (const [index, zuordnung] of zuordnungen.entries()) {
      const tempSchulDaten: SchulDaten = {
        title: zuordnung.sskName,
        info: t('profile.yourSchuleAdminsAre'),
        schulAdmins: zuordnung.admins,
        labelAndValues: [
          {
            label: t('profile.schule'),
            value: zuordnung.sskName,
            testIdLabel: 'schule-label-' + (index + 1),
            testIdValue: 'schule-value-' + (index + 1),
          },
        ],
      };

      if (zuordnung.klasse) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.klasse'),
          value: zuordnung.klasse,
          testIdLabel: 'klasse-label-' + (index + 1),
          testIdValue: 'klasse-value-' + (index + 1),
        });
      }

      tempSchulDaten.labelAndValues.push({
        label: t('admin.rolle.rolle'),
        value: zuordnung.rolle,
        testIdLabel: 'rolle-label-' + (index + 1),
        testIdValue: 'rolle-value-' + (index + 1),
      });

      if (zuordnung.sskDstNr) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.dienstStellenNummer'),
          labelAbbr: t('profile.dienstStellenNummerAbbr'),
          value: zuordnung.sskDstNr,
          testIdLabel: 'dienststellennummer-label-' + (index + 1),
          testIdValue: 'dienststellennummer-value-' + (index + 1),
        });
      }

      if (zuordnung.befristung) {
        tempSchulDaten.labelAndValues.push({
          label: t('profile.limitedUntil'),
          value: adjustDateForTimezoneAndFormat(zuordnung.befristung),
          testIdLabel: 'befristung-label-' + (index + 1),
          testIdValue: 'befristung-value-' + (index + 1),
        });
      }

      result.push(tempSchulDaten);
    }

    return result;
  }

  const hasKoPersMerkmal: ComputedRef<boolean> = computed(() => {
    return personStore.personenuebersicht?.hasRollenMerkmale([RollenMerkmal.KopersPflicht]) || false;
  });

  // Used to show device password block
  const hasLehrRolle: ComputedRef<boolean> = computed(() => {
    return (
      !!personStore.personenuebersicht?.zuordnungen.find((zuordnung: Zuordnung) => {
        return zuordnung.rollenArt === RollenArt.Lehr;
      }) || false
    );
  });

  // Computed property to get the device password dialog text
  const devicePasswordDialogText: ComputedRef<string> = computed(() => {
    let message: string = t('admin.person.devicePassword.dialogTextProfile');
    if (devicePassword.value) {
      message = `${t('admin.person.resetPasswordSuccessMessage')}\n\n${t('admin.person.devicePassword.dialogTextProfile')}`;
    }
    return message;
  });

  const devicePasswordErrorMessage: ComputedRef<string> = computed(() => {
    let message: string = '';
    if (personStore.errorCode) {
      message = t('admin.person.devicePassword.errorMessage');
    }
    return message;
  });

  async function resetDevicePassword(): Promise<void> {
    await personStore.resetDevicePassword();
    devicePassword.value = personStore.newDevicePassword || '';
  }

  const personalData: ComputedRef<LabelValue[]> = computed(() =>
    personInfoStore.personInfo
      ? mapToLabelValues(
          t,
          {
            vorname: personInfoStore.personInfo.person.name.vorname,
            familienname: personInfoStore.personInfo.person.name.familiennamen,
            username: personInfoStore.personInfo.person.referrer ?? undefined,
            personalnummer: personInfoStore.personInfo.person.personalnummer ?? null,
            emailStatus: {
              status: personInfoStore.personInfo.email?.status as EmailStatus,
              address: personInfoStore.personInfo.email?.address,
            },
          },
          {
            hasKoPersMerkmal,
            includeKoPers: true,
            includeEmail: true,
          },
        )
      : [],
  );

  const schulDaten: ComputedRef<SchulDaten[]> = computed(() => {
    if (!personStore.personenuebersicht) return [];
    const personenZuordnungen: Zuordnung[] = personStore.personenuebersicht.zuordnungen;
    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungen(
      personenZuordnungen.map(
        (z: Zuordnung) =>
          ({
            ...z,
            sskId: z.typ === OrganisationsTyp.Klasse ? z.administriertVon : z.sskId, // Nutze die ID der Schule, wenn es sich um eine Klasse handelt
          }) as Zuordnung,
      ),
    );

    const composedZuordnungen: ComposedZuordnung[] = createComposedZuordnungen(groupedZuordnungen);
    return createZuordnungsSchuleDaten(composedZuordnungen);
  });

  const lastPasswordChangeDate: ComputedRef<string> = computed(() => {
    const passwordUpdatedAt: string | null | undefined = authStore.currentUser?.password_updated_at;
    if (!passwordUpdatedAt) return '';
    const date: Date = new Date(passwordUpdatedAt);
    if (isNaN(date.valueOf())) return '';
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  });

  const twoFactorAuthError: ComputedRef<string> = computed(() => {
    // Early return if loading
    if (twoFactorAuthenticationStore.loading) return '';

    switch (twoFactorAuthenticationStore.errorCode) {
      case 'TOKEN_STATE_ERROR':
        return t('admin.person.twoFactorAuthentication.errors.tokenStateSelfServiceError');
      case 'PI_UNAVAILABLE_ERROR':
        return t('admin.person.twoFactorAuthentication.errors.connection');
      default:
        return '';
    }
  });

  function handleGoToPreviousPage(): void {
    const previousUrl: string | null = sessionStorage.getItem('previousUrl');
    router.push(previousUrl ?? '/start');
  }

  async function initializeStores(): Promise<void> {
    await personInfoStore.initPersonInfo();
  }

  const isPasswordResetDialogActive: Ref<boolean> = ref(false);
  const showChangedPasswordDialog: Ref<boolean> = ref(true);

  function closeChangePasswordDialog(): void {
    isPasswordResetDialogActive.value = false;
  }

  function openChangePasswordDialog(): void {
    isPasswordResetDialogActive.value = true;
  }

  function closePasswordChangedDialogAndClearQuery(): void {
    showChangedPasswordDialog.value = false;
    router.replace({ path: route.fullPath, query: {} });
  }

  function navigateToPasswordChange(): void {
    const url: URL = new URL(window.origin + '/api/auth/reset-password');
    url.searchParams.set('redirectUrl', windowOrigin + route.fullPath);
    url.searchParams.set('login_hint', personInfoStore.personInfo?.person.referrer ?? '');
    window.location.href = url.toString();
  }

  type WatchOptions = {
    immediate: boolean;
  };

  watch(
    () => personInfoStore.personInfo?.person.id,
    async (personId: string | undefined) => {
      if (!personId) return;
      loading2FA.value = true;

      const twoFARequirementPromise: Promise<void> = twoFactorAuthenticationStore.get2FARequirement(personId);
      const personUebersichtPromise: Promise<void> = personStore.getPersonenuebersichtById(personId);
      const twoFAStatePromise: Promise<void> = twoFactorAuthenticationStore.get2FAState(personId);

      await Promise.all([twoFARequirementPromise, personUebersichtPromise, twoFAStatePromise]);
      loading2FA.value = false;
    },
    { immediate: true } as WatchOptions,
  );

  onBeforeMount(async () => {
    await initializeStores();
  });
</script>

<template>
  <v-btn
    class="mt-8"
    @click="handleGoToPreviousPage()"
    data-testid="back-to-previous-page-button"
  >
    <v-icon
      class="mr-2"
      icon="mdi-arrow-left-thin"
    />
    {{ $t('nav.backToPreviousPage') }}</v-btn
  >
  <div class="my-8">
    <v-row class="flex-nowrap mb-1 justify-center">
      <v-col cols="auto">
        <h2
          class="headline-1"
          data-testid="profile-headline"
        >
          {{ $t('nav.profile') }}
        </h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="12"
        md="6"
        class="d-flex flex-column ga-8"
      >
        <LayoutCard
          :header="$t('profile.personalData')"
          :headline-test-id="'layout-card-headline-persoenliche-daten'"
        >
          <v-row class="ma-4">
            <v-col cols="12">
              <v-table class="text-body-1">
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in personalData"
                      :key="item.label"
                    >
                      <td v-if="item.type === ItemType.KO_PERS && item.value === null">
                        <SpshTooltip
                          :disabledText="t('profile.koPersNummerMissing')"
                          :enabledText="t('profile.koPersNummerMissing')"
                          position="top"
                        >
                          <span
                            v-if="item.labelAbbr"
                            class="text-red"
                          >
                            <strong>{{ item.labelAbbr }}</strong> :</span
                          >
                          <strong v-else>{{ item.label }}:</strong>
                        </SpshTooltip>
                      </td>
                      <td v-else>
                        <span v-if="item.labelAbbr"
                          ><abbr :title="item.label"
                            ><strong :data-testid="item.testIdLabel">{{ item.labelAbbr }}:</strong></abbr
                          ></span
                        >
                        <strong
                          :data-testid="item.testIdLabel"
                          v-else
                          >{{ item.label }}:</strong
                        >
                      </td>
                      <td
                        :data-testid="item.testIdValue"
                        v-if="item.type === ItemType.KO_PERS && item.value === null"
                        class="text-red"
                      >
                        {{ t('missing') }}
                      </td>
                      <td
                        :data-testid="item.testIdValue"
                        v-else
                      >
                        <v-row
                          no-gutters
                          align="center"
                        >
                          <SpshTooltip
                            v-if="item.tooltip"
                            enabledCondition
                            :enabledText="item.tooltip"
                            position="bottom"
                          >
                            <v-icon
                              aria-hidden="true"
                              class="mr-2"
                              icon="mdi-alert-circle-outline"
                              size="small"
                            />
                          </SpshTooltip>
                          <span>{{ item.value }}</span>
                        </v-row>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-table>
              <p
                class="pt-4 text-center text-body-1 text-medium-emphasis"
                data-testid="info-text-with-icon"
                style="white-space: normal"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                  data-testid="info-icon"
                ></v-icon>
                <span data-testid="info-text">
                  {{ $t('profile.infoAboutChangeabilityFromPersonalData') }}
                </span>
              </p>
            </v-col>
          </v-row>
        </LayoutCard>
        <LayoutCard
          data-testid="password-card"
          :headline-test-id="'new-password-card'"
          :header="$t('login.password')"
          class="text-body"
        >
          <v-row
            align="center"
            justify="center"
            class="ma-4 text-body"
          >
            <v-col class="text-center px-0">
              <v-row>
                <p
                  class="w-100"
                  v-if="lastPasswordChangeDate"
                >
                  {{ t('profile.lastPasswordChange', { date: lastPasswordChangeDate }) }}
                </p>
              </v-row>
              <v-row class="d-flex align-center justify-center">
                <v-col class="d-flex justify-center">
                  <v-btn
                    class="primary"
                    data-testid="open-change-password-dialog-button"
                    :block="xs"
                    @click="openChangePasswordDialog()"
                  >
                    {{ $t('profile.changePassword') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-dialog
            v-model="isPasswordResetDialogActive"
            persistent
          >
            <LayoutCard
              :closable="true"
              :header="$t('profile.changePassword')"
              @onCloseClicked="closeChangePasswordDialog()"
            >
              <v-card-text>
                <v-container class="d-flex align-center">
                  <v-col
                    cols="1"
                    class="d-flex justify-center"
                  >
                    <v-icon
                      class="mr-2"
                      size="x-large"
                      icon="mdi-information-slab-circle-outline"
                    ></v-icon>
                  </v-col>
                  <v-col>
                    <p class="text-body bold">
                      {{ $t('profile.changePasswordInfo') }}
                    </p>
                  </v-col>
                </v-container>
              </v-card-text>
              <v-card-actions class="d-flex justify-center">
                <v-row class="d-flex justify-center align-center">
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    class="d-flex justify-center"
                  >
                    <v-btn
                      class="secondary button w-100"
                      @click.stop="closeChangePasswordDialog()"
                      data-testid="close-change-password-dialog-button"
                    >
                      {{ $t('cancel') }}
                    </v-btn>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    class="d-flex justify-center"
                  >
                    <v-btn
                      @click.stop="navigateToPasswordChange()"
                      class="primary w-100"
                      data-testid="change-password-button"
                    >
                      {{ $t('profile.changePassword') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-actions>
            </LayoutCard>
          </v-dialog>
        </LayoutCard>
        <template v-if="loading2FA">
          <v-row
            align="center"
            justify="center"
            class="ma-3"
          >
            <v-progress-circular
              indeterminate
              size="64"
              color="primary"
              data-testid="loading-spinner"
            ></v-progress-circular>
          </v-row>
        </template>
        <LayoutCard
          v-else-if="twoFactorAuthenticationStore.required"
          :headline-test-id="'two-factor-card'"
          :header="$t('profile.twoFactorAuth')"
        >
          <v-row
            align="center"
            justify="center"
            class="ma-4 text-body"
          >
            <v-col
              v-if="twoFactorAuthenticationStore.hasToken || twoFactorAuthError"
              cols="12"
            >
              <v-row>
                <v-col
                  cols="1"
                  align-self="center"
                  class="text-right"
                >
                  <v-icon
                    v-if="twoFactorAuthError"
                    color="warning"
                    icon="mdi-alert-outline"
                  ></v-icon>
                  <v-icon
                    v-else-if="twoFactorAuthenticationStore.hasToken === true"
                    color="green"
                    icon="mdi-check-circle"
                  ></v-icon>
                </v-col>
                <v-col data-testid="two-factor-info">
                  <template v-if="twoFactorAuthError">
                    {{ twoFactorAuthError }}
                  </template>
                  <template v-else-if="twoFactorAuthenticationStore.hasToken === true">
                    <template v-if="twoFactorAuthenticationStore.tokenKind === TokenKind.software">
                      {{ $t('admin.person.twoFactorAuthentication.softwareTokenIsSetUpSelfService') }}
                    </template>
                    <template v-else-if="twoFactorAuthenticationStore.tokenKind === TokenKind.hardware">
                      {{
                        $t('admin.person.twoFactorAuthentication.hardwareTokenIsSetUpSelfService', {
                          serialNumber: twoFactorAuthenticationStore.serial,
                        })
                      }}
                    </template>
                  </template>
                </v-col>
              </v-row>
            </v-col>
            <v-col
              cols="12"
              v-else
            >
              <v-row justify="center">
                <v-col
                  align-self="center"
                  class="text-center"
                  data-testid="two-factor-info"
                >
                  <v-icon
                    color="warning"
                    icon="mdi-alert-circle"
                  ></v-icon>
                  {{ $t('admin.person.twoFactorAuthentication.secondFactorNotSet') }}
                </v-col>
              </v-row>
            </v-col>
            <v-col
              cols="12"
              v-if="!twoFactorAuthError"
            >
              <v-row>
                <template v-if="twoFactorAuthenticationStore.hasToken === false">
                  <SelfServiceWorkflow
                    :personId="personInfoStore.personInfo?.person.id ?? ''"
                    @updateState="twoFactorAuthenticationStore.get2FAState(personInfoStore.personInfo?.person.id ?? '')"
                  >
                  </SelfServiceWorkflow>
                </template>
                <template v-else-if="twoFactorAuthenticationStore.hasToken === true">
                  <v-col
                    cols="1"
                    align-self="center"
                    class="text-right"
                  >
                    <v-icon
                      class="mb-2"
                      icon="mdi-information"
                    >
                    </v-icon>
                  </v-col>
                  <v-col>
                    <p>
                      {{ $t('admin.person.twoFactorAuthentication.questionsProblems') }}
                    </p>
                  </v-col>
                </template>
              </v-row>
            </v-col>
          </v-row>
        </LayoutCard>
        <LayoutCard
          v-if="hasLehrRolle"
          data-testid="reset-device-password-card"
          :headline-test-id="'reset-device-password-card'"
          :header="$t('admin.person.devicePassword.header')"
          class="text-body"
        >
          <v-row
            align="center"
            justify="center"
            class="ma-4 text-body"
          >
            <v-col class="text-center px-0">
              <v-row class="d-flex align-center justify-center">
                <PasswordReset
                  :buttonText="$t('admin.person.devicePassword.createPassword')"
                  :confirmButtonText="$t('admin.person.devicePassword.createPassword')"
                  :dialogHeader="$t('admin.person.devicePassword.createDevicePassword')"
                  :dialogText="devicePasswordDialogText"
                  :errorCode="personStore.errorCode"
                  :errorMessage="devicePasswordErrorMessage"
                  :isLoading="personStore.loading"
                  @onClearPassword="devicePassword = ''"
                  @onResetPassword="resetDevicePassword()"
                  :password="devicePassword"
                  :testId="'device-password'"
                >
                </PasswordReset>
              </v-row>
              <v-row class="d-flex justify-center">
                <v-col
                  class="text-right"
                  cols="1"
                >
                  <v-icon
                    class="mb-2"
                    icon="mdi-information"
                  >
                  </v-icon>
                </v-col>
                <v-col class="text-left">
                  <p class="white-space-pre-wrap">
                    {{ $t('admin.person.devicePassword.infoTextProfile') }}
                  </p>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </LayoutCard>
      </v-col>
      <v-col
        cols="12"
        sm="12"
        md="6"
        class="d-flex flex-column ga-8"
      >
        <LayoutCard
          v-for="(schuleData, index) in schulDaten"
          :key="schuleData.title"
          :header="$t('person.zuordnung') + ' ' + (schulDaten.length > 1 ? (index + 1).toString() : '')"
          :headline-test-id="'zuordung-card-' + (index + 1)"
        >
          <v-row class="ma-3 p-4">
            <v-col cols="12">
              <v-table class="text-body-1">
                <template v-slot:default>
                  <tbody>
                    <tr
                      v-for="item in schuleData.labelAndValues"
                      :key="item.label"
                    >
                      <td>
                        <span v-if="item.labelAbbr"
                          ><abbr :title="item.label"
                            ><strong :data-testid="item.testIdLabel">{{ item.labelAbbr }}:</strong></abbr
                          ></span
                        >
                        <strong
                          :data-testid="item.testIdLabel"
                          v-else
                          >{{ item.label }}:</strong
                        >
                      </td>
                      <td :data-testid="item.testIdValue">{{ item.value }}</td>
                    </tr>
                  </tbody>
                </template>
              </v-table>
              <p
                class="pt-4 text-center text-body-1 text-medium-emphasis"
                data-testid="schuladmins-info-text-with-icon"
                style="white-space: normal"
                v-if="schuleData.schulAdmins && schuleData.schulAdmins.length > 0"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                  data-testid="schuladmins-info-icon"
                ></v-icon>
                <span data-testid="schulAdmins-info-text">
                  {{ `${schuleData.info} ${schuleData.schulAdmins?.join(', ') || ''}` }}
                </span>
              </p>
            </v-col>
          </v-row>
        </LayoutCard>
      </v-col>
    </v-row>
  </div>

  <template v-if="kcActionStatus && kcActionStatus != 'cancelled'">
    <v-dialog
      v-model="showChangedPasswordDialog"
      persistent
    >
      <LayoutCard
        :closable="true"
        :header="$t('profile.changePassword')"
        @onCloseClicked="closePasswordChangedDialogAndClearQuery()"
      >
        <v-card-text>
          <v-container class="d-flex align-center">
            <v-col
              cols="auto"
              class="d-flex justify-center"
            >
              <v-icon
                class="mr-2"
                size="x-large"
                icon="mdi-information-slab-circle-outline"
              ></v-icon>
            </v-col>
            <v-col>
              <p class="text-body bold">
                {{
                  kcActionStatus == 'success'
                    ? $t('profile.successFullPasswordChange')
                    : $t('profile.errorPasswordChange')
                }}
              </p>
            </v-col>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn
            class="secondary button"
            @click.stop="closePasswordChangedDialogAndClearQuery()"
            data-testid="close-password-changed-dialog-button"
            :block="xs"
          >
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
  </template>
</template>

<style scoped>
  * {
    white-space: normal !important;
  }
</style>
