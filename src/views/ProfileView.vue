<script setup lang="ts">
  import { RollenMerkmal, type DBiamPersonenzuordnungResponse } from '@/api-client/generated/api';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SelfServiceWorkflow from '@/components/two-factor-authentication/SelfServiceWorkflow.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import { usePersonInfoStore, type PersonInfoStore } from '@/stores/PersonInfoStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { type Zuordnung } from '@/stores/PersonenkontextStore';
  import {
    TokenKind,
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { computed, onBeforeMount, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';

  const { t }: { t: Function } = useI18n();

  enum ItemType {
    KO_PERS = 'KO_PERS',
  }
  type LabelValue = {
    label: string;
    labelAbbr?: string;
    value: string | null;
    type?: ItemType;
    testIdLabel: string;
    testIdValue: string;
  };
  type SchulDaten = {
    title: string;
    info?: string | null;
    schulAdmins?: string[];
    labelAndValues: LabelValue[];
  };

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const kcActionStatus: string | null = route.query['kc_action_status'] as string | null;

  const authStore: AuthStore = useAuthStore();
  const personInfoStore: PersonInfoStore = usePersonInfoStore();
  const personStore: PersonStore = usePersonStore();
  const twoFactorAuthenticationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

  const windowOrigin: string = window.location.origin;
  const loading2FA: Ref<boolean> = ref(false);

  /**
   * Gruppiert eine Liste von Zuordnungen nach dem Wert der Eigenschaft 'sskDstNr'.
   *
   * Diese Funktion nimmt ein Array von Zuordnungen entgegen und organisiert diese
   * in einer Map, wobei der Schlüssel der Wert der Eigenschaft 'sskDstNr' ist
   * und der Wert ein Array von Zuordnungen mit diesem Schlüssel.
   *
   * @param zuordnungen - Ein Array von Zuordnungen, die gruppiert werden sollen.
   * @returns Eine Map, in der jeder Schlüssel ein Wert von 'sskDstNr' ist und
   *          jeder Wert ein Array von Zuordnungen mit diesem Schlüssel.
   */
  function groupZuordnungen(zuordnungen: Zuordnung[]): Map<string, Zuordnung[]> {
    const groupedZuordnungen: Map<string, Zuordnung[]> = new Map();
    for (const zuordnung of zuordnungen) {
      const key: string = zuordnung.sskDstNr ?? zuordnung.sskId;
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
  function createComposedZuordnungen(groupedZuordnungen: Map<string, Zuordnung[]>): Zuordnung[] {
    const composedZuordnungen: Zuordnung[] = [];
    for (const [, zuordnungen] of groupedZuordnungen) {
      if (zuordnungen.length === 0 || zuordnungen[0] === undefined) continue;
      if (zuordnungen.length > 1) {
        const aggregatedRoles: string[] = zuordnungen.map((z: Zuordnung) => z.rolle);
        const uniqueRoles: string[] = [...new Set(aggregatedRoles)];
        const composedRoles: string = uniqueRoles.join(', ');
        const befristungen: (string | undefined)[] = zuordnungen.map((z: Zuordnung) => z.befristung);
        const klasse: string | null =
          zuordnungen
            .filter((z: Zuordnung) => z.typ === OrganisationsTyp.Klasse)
            .map((z: Zuordnung) => z.sskName)
            .join(', ') || null;
        const schule: string | null =
          zuordnungen.find((z: Zuordnung) => z.typ === OrganisationsTyp.Schule)?.sskName || null;
        const composedZuordnung: Zuordnung = { ...zuordnungen[0], rolle: composedRoles };
        if (schule) composedZuordnung.sskName = schule;
        if (klasse) composedZuordnung.klasse = klasse;
        composedZuordnung.befristung = [...new Set(befristungen)].at(0);
        composedZuordnungen.push(composedZuordnung);
      } else {
        composedZuordnungen.push(zuordnungen[0]);
      }
    }
    return composedZuordnungen;
  }

  function translatedBefristung(befristung: string | undefined): string {
    if (!befristung) return '';
    const utcDate: Date = new Date(befristung);
    if (utcDate.getTimezoneOffset() >= -120) {
      // Check if the timezone offset is 2 hours (indicating MESZ)
      // Subtract one day if in summer time (MESZ)
      utcDate.setDate(utcDate.getDate() - 1);
    }
    return utcDate.toLocaleDateString('de-DE');
  }

  function createZuordnungsSchuleDaten(zuordnungen: Zuordnung[]): SchulDaten[] {
    const result: SchulDaten[] = [];
    for (const [index, zuordnung] of zuordnungen.entries()) {
      const tempSchulDaten: SchulDaten = {
        title: zuordnung.sskName,
        info: t('profile.yourSchuleAdminsAre'),
        schulAdmins: [], // Hierfuer muss ein API-Endpunkt implementiert werden
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
          value: translatedBefristung(zuordnung.befristung),
          testIdLabel: 'befristung-label-' + (index + 1),
          testIdValue: 'befristung-value-' + (index + 1),
        });
      }

      result.push(tempSchulDaten);
    }

    return result;
  }

  const hasKoPersMerkmal: ComputedRef<boolean> = computed(() => {
    return (
      personStore.personenuebersicht?.zuordnungen.find((zuordnung: DBiamPersonenzuordnungResponse) => {
        return zuordnung.merkmale.includes(RollenMerkmal.KopersPflicht);
      }) !== undefined
    );
  });

  const personalData: ComputedRef<LabelValue[]> = computed(() => {
    const data: LabelValue[] = [];
    if (!personInfoStore.personInfo) return data;
    data.push({
      label: t('profile.fullName'),
      value:
        personInfoStore.personInfo.person.name.vorname + ' ' + personInfoStore.personInfo.person.name.familiennamen,
      testIdLabel: 'fullName-label',
      testIdValue: 'fullName-value',
    });
    if (personInfoStore.personInfo.person.referrer)
      data.push({
        label: t('person.userName'),
        value: personInfoStore.personInfo.person.referrer,
        testIdLabel: 'userName-label',
        testIdValue: 'userName-value',
      });

    if (!personInfoStore.personInfo.person.personalnummer && !hasKoPersMerkmal.value) return data;
    data.push({
      label: t('profile.koPersNummer'),
      labelAbbr: t('profile.koPersNummerAbbr'),
      value: personInfoStore.personInfo.person.personalnummer,
      type: ItemType.KO_PERS,
      testIdLabel: 'kopersnummer-label',
      testIdValue: 'kopersnummer-value',
    });
    return data;
  });

  const schulDaten: ComputedRef<SchulDaten[]> = computed(() => {
    if (!personStore.personenuebersicht) return [];
    const personenZuordnungen: Zuordnung[] = personStore.personenuebersicht.zuordnungen;
    const groupedZuordnungen: Map<string, Zuordnung[]> = groupZuordnungen(
      personenZuordnungen.map(
        (z: Zuordnung) =>
          ({
            ...z,
            sskDstNr: z.sskDstNr?.split('-')[0], // die Klasse wird durch einen Bindestrich an die Schulnummer angehangen. Um nach der Schule zu gruppieren, wird nur die Schulnummer verwendet.
          }) as Zuordnung,
      ),
    );

    const composedZuordnungen: Zuordnung[] = createComposedZuordnungen(groupedZuordnungen);
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
    const ignoredErrorCodes: string[] = ['SOFTWARE_TOKEN_VERIFICATION_ERROR', 'OTP_NICHT_GUELTIG'];
    if (twoFactorAuthenticationStore.errorCode && !ignoredErrorCodes.includes(twoFactorAuthenticationStore.errorCode)) {
      return t('admin.person.twoFactorAuthentication.errors.connection');
    }
    // Default return, no error
    return '';
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
                        {{ item.value }}
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
          class="pb-4"
        >
          <v-row class="ma-3 d-flex align-content-center justify-center ga-4">
            <p
              class="w-100 text-center text-body"
              v-if="lastPasswordChangeDate"
            >
              {{ t('profile.lastPasswordChange', { date: lastPasswordChangeDate }) }}
            </p>
          </v-row>
          <v-row class="d-flex align-center justify-center">
            <v-col class="d-flex justify-center">
              <v-btn
                class="primary"
                data-testid="open-change-password-dialog"
                @click="openChangePasswordDialog()"
              >
                {{ $t('profile.changePassword') }}
              </v-btn>
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
          v-if="twoFactorAuthenticationStore.required && twoFactorAuthenticationStore.hasToken != null"
          :headline-test-id="'two-factor-card'"
          :header="$t('profile.twoFactorAuth')"
        >
          <v-row
            align="center"
            justify="center"
            class="ma-3 text-body"
          >
            <v-col
              :sm="twoFactorAuthenticationStore.hasToken === false ? 6 : null"
              :md="twoFactorAuthenticationStore.hasToken === false ? 'auto' : null"
              cols="12"
            >
              <v-row :justify="twoFactorAuthenticationStore.hasToken === false ? 'center' : null">
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
                    v-else-if="twoFactorAuthenticationStore.hasToken === false"
                    color="warning"
                    icon="mdi-alert-circle"
                  ></v-icon>
                  <v-icon
                    v-else-if="twoFactorAuthenticationStore.hasToken === true"
                    color="green"
                    icon="mdi-check-circle"
                  ></v-icon>
                </v-col>
                <v-col>
                  <p data-testid="two-factor-info">
                    <template v-if="twoFactorAuthError">
                      {{ twoFactorAuthError }}
                    </template>
                    <template v-else-if="twoFactorAuthenticationStore.hasToken === false">
                      {{ $t('admin.person.twoFactorAuthentication.SecondFactorNotSet') }}
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
                  </p>
                </v-col>
              </v-row>
            </v-col>
            <v-col
              cols="12"
              v-if="!twoFactorAuthError"
            >
              <v-row
                align="center"
                justify="center"
              >
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
                class="pt-4 text-center text-body-1"
                v-if="schuleData.schulAdmins && schuleData.schulAdmins.length > 0"
                data-testid="school-admins-${index}"
              >
                <v-icon
                  class="mr-2"
                  icon="mdi-information-slab-circle-outline"
                  data-testid="school-admins-icon"
                ></v-icon>
                {{ `${schuleData.info} ${schuleData.schulAdmins?.join(', ') || ''}` }}
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
        @onCloseClicked="closeChangePasswordDialog()"
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
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="4"
              class="d-flex justify-center"
            >
              <v-btn
                class="secondary button w-100"
                @click.stop="closePasswordChangedDialogAndClearQuery()"
                data-testid="close-password-changed-dialog-button"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
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
